/**
 * Created by zppro on 15-12-16.
 * 参考字典D1003-预定义树
 */

module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/services/' + this.module_name.split('_').join('/');

        option = option || {};

        this.logger = require('log4js').getLogger(this.filename);

        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }


        var orderModelOption = {model_name: 'pub_order', model_path: '../models/pub/order'};
        var tenantModelOption = {model_name: 'pub_tenant', model_path: '../models/pub/tenant'};
        var userModelOption = {model_name: 'pub_user', model_path: '../models/pub/user'};
        var elderlyModelOption = {model_name: 'pub_elderly', model_path: '../models/pub/elderly'};
        var enterModelOption = {model_name: 'pfta_enter', model_path: '../models/pfta/enter'};
        var roomStatusModelOption = {model_name: 'pfta_roomStatus', model_path: '../models/pfta/roomStatus'};



        this.actions = [
            {
                method: 'tenantInfo',
                verb: 'get',
                url: this.service_url_prefix + "/tenantInfo/:_id/:select",//:select需要提取的字段域用逗号分割 e.g. name,type
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, this.params._id);
                            var ret = app._.pick(tenant.toObject(),this.params.select.split(','));
                            this.body = app.wrapper.res.ret(ret);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            /**********************房间状态相关*****************************/
            {
                method: 'roomStatusInfo',
                verb: 'get',
                url: this.service_url_prefix + "/roomStatusInfo/:tenantId",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var roomStatuses = yield app.modelFactory().model_query(app.models['pfta_roomStatus'], {where: {tenantId: this.params.tenantId}})
                                .populate({
                                    path: 'occupied.elderlyId',
                                    select: '-_id name'
                                });
                            this.body = app.wrapper.res.rows(roomStatuses);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'updateRoomStatusInfo',
                verb: 'post',
                url: this.service_url_prefix + "/updateRoomStatusInfo",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var tenant,elderly,room;
                        var remove_created_roomStatus_id,raw_bed_status_for_cancel_occupy_roomStatus,raw_elderly_for_cancel_occupy_roomStatus;
                        var cancel_occupy, cancel_occupy_roomStatus;
                        try {
                            //this.request.body
                            var tenantId = this.request.body.tenantId;
                            var roomId = this.request.body.roomId;
                            var bed_no = this.request.body.bed_no;
                            var elderlyId = this.request.body.elderlyId;

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], elderlyId);
                            if(!elderly || elderly.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }
                            room =  yield app.modelFactory().model_read(app.models['pfta_room'], roomId);
                            if(!room || room.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到房间资料资料!'});
                                yield next;
                                return;
                            }
                            if(Number(bed_no) > room.capacity) {
                                this.body = app.wrapper.res.error({message: '无效的床位号，该房间最多支持'+room.capacity+'床位!'});
                                yield next;
                                return;
                            }
                            console.log('前置检查完成');

                            //检查入住老人有没有其他的预占用或在用记录
                            var toUpdateRoomStatus = [];
                            var toCreateRoomStatus;
                            var roomStatuses  = yield app.modelFactory().model_query(app.models['pfta_roomStatus'], {where: {tenantId: tenantId}});
                            for(var i=0;i<roomStatuses.length;i++) {
                                if(roomStatuses[i].occupied){
                                    for(var j=0;j<roomStatuses[i].occupied.length;j++){

                                        var occupy = roomStatuses[i].occupied[j];
                                        if (elderlyId == occupy.elderlyId) {
                                            if (occupy.bed_status == 'A0003') {
                                                this.body = app.wrapper.res.error({message: '该老人已经入住到其他床位，请使用换床功能!!'});
                                                yield next;
                                                return;
                                            }

                                            raw_bed_status_for_cancel_occupy_roomStatus = occupy.bed_status;
                                            raw_elderly_for_cancel_occupy_roomStatus = occupy.elderlyId;
                                            cancel_occupy = occupy;
                                            cancel_occupy_roomStatus = roomStatuses[i];

                                            occupy.bed_status = 'A0001';
                                            occupy.elderlyId = undefined;

                                            console.log(roomStatuses[i]);
                                            toUpdateRoomStatus.push(roomStatuses[i]);

                                        }
                                    }
                                }
                            }


                            var roomStatus;
                            for(var i=0;i<roomStatuses.length;i++){
                                if(roomId == roomStatuses[i].roomId){
                                    roomStatus = roomStatuses[i];
                                    break;
                                }
                            }

                            if(!roomStatus) {
                                console.log('create:'+roomId);
                                toCreateRoomStatus = {
                                    roomId: roomId,
                                    occupied: [{bed_no: bed_no, bed_status: 'A0002', elderlyId: elderlyId}],
                                    tenantId: tenantId
                                };
                            }
                            else{
                                var bedInfo1
                                for(var i=0;i<roomStatus.occupied.length;i++){
                                    if(bed_no == roomStatus.occupied[i].bed_no){
                                        bedInfo1 = roomStatus.occupied[i];
                                    }
                                }

                                if(!bedInfo1){
                                    roomStatus.occupied.push({bed_no: bed_no,bed_status:'A0002', elderlyId: elderlyId});
                                }
                                else {
                                    //判断要入住的床位是否有其他老人，如有其他老人已经预占则返回
                                    if (bedInfo1.elderlyId && bedInfo1.elderlyId != elderlyId) {
                                        //改成
                                        this.body = app.wrapper.res.error({message: '该床位已经被占用，请刷新床位信息!'});
                                        yield next;
                                        return;
                                    }
                                    bedInfo1.bed_status = 'A0002';
                                    bedInfo1.elderlyId = elderlyId;

                                }

                                toUpdateRoomStatus.push(roomStatus);
                            }

                            if(toCreateRoomStatus) {
                                remove_created_roomStatus_id =  (yield app.modelFactory().model_create(app.models['pfta_roomStatus'], toCreateRoomStatus))._id;
                                steps = 'A';
                            }

                            for(var i=0;i<toUpdateRoomStatus.length;i++) {
                                yield toUpdateRoomStatus[i].save();
                                steps += "A";
                            }
                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch(i) {
                                        case 0:
                                            yield app.modelFactory().model_delete(app.models['pfta_roomStatus'], remove_created_roomStatus_id)
                                            break;
                                        case 1:
                                            if (cancel_occupy_roomStatus) {
                                                cancel_occupy.bed_status = raw_bed_status_for_cancel_occupy_roomStatus;
                                                cancel_occupy.elderlyId = raw_elderly_for_cancel_occupy_roomStatus;
                                            }
                                            yield cancel_occupy_roomStatus.save();
                                            break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            /**********************出院相关*****************************/
            {
                method: 'submitApplicationToExit',//提交出院申请
                verb: 'post',
                url: this.service_url_prefix + "/submitApplicationToExit/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var elderly,newExit;
                        var raw_elderly_begin_exit_flow;
                        try {

                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;

                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            //1、判断老人是否在院
                            elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], this.params._id);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }
                            if (!elderly.live_in_flag) {
                                this.body = app.wrapper.res.error({message: '老人已经出院!'});
                                yield next;
                                return;
                            }

                            if (elderly.begin_exit_flow || (yield app.modelFactory().model_totals(app.models['pfta_exit'], {
                                    where: {
                                        tenantId: elderly.tenantId,
                                        elderlyId: elderly._id,
                                        enter_code: elderly.enter_code
                                    }
                                })).length > 0) {
                                this.body = app.wrapper.res.error({message: '老人出院申请已经提交，请按照出院流程办理出院手续!'});
                                yield next;
                                return;
                            }


                            console.log('前置检查完成');

                            //更改老人
                            raw_elderly_begin_exit_flow = elderly.begin_exit_flow;
                            elderly.begin_exit_flow = true;

                            //出院申请
                            newExit = {
                                operated_by: operated_by,
                                operated_by_name: operated_by_name,
                                current_step: 'A0001',
                                enter_code: elderly.enter_code,
                                enter_on: elderly.enter_on,
                                elderlyId: elderly._id,
                                elderly_name: elderly.name,
                                elderly_id_no: elderly.id_no,
                                elderly_sex: elderly.sex,
                                elderly_birthday: elderly.birthday,
                                elderly_home_address: elderly.home_address,
                                tenantId: elderly.tenantId
                            };


                            yield elderly.save();
                            steps = "A";
                            newExit = yield app.modelFactory().model_create(app.models['pfta_exit'], newExit);

                            this.body = app.wrapper.res.ret({begin_exit_flow: elderly.begin_exit_flow});
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch(i) {
                                        case 0:
                                            elderly.begin_exit_flow = raw_elderly_begin_exit_flow;
                                            yield elderly.save();
                                            break;
                                    }
                                }
                            }

                        }
                        yield next;
                    };
                }
            },
            {
                method: 'submitToAuditItemReturn',//提交归还物品检查
                verb: 'post',
                url: this.service_url_prefix + "/submitToAuditItemReturn/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var exit;
                        try {
                            exit = yield app.modelFactory().model_read(app.models['pfta_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }
                            if (exit.current_step!='A0001') {
                                this.body = app.wrapper.res.error({message: '出院流程步骤错误，当前状态下不能提交!'});
                                yield next;
                                return;
                            }

                            console.log('前置检查完成');

                            exit.current_step = 'A0003';

                            yield exit.save();

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'submitToAuditSettlement',//提交出院结算审核
                verb: 'post',
                url: this.service_url_prefix + "/submitToAuditSettlement/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var exit;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            exit = yield app.modelFactory().model_read(app.models['pfta_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }
                            if (exit.current_step!='A0003') {
                                this.body = app.wrapper.res.error({message: '出院流程步骤错误，当前状态下不能提交!'});
                                yield next;
                                return;
                            }

                            console.log('前置检查完成');

                            exit.current_step = 'A0005';
                            if(!exit.item_return_audit)
                                exit.item_return_audit = {};
                            exit.item_return_audit.operated_by = operated_by;
                            exit.item_return_audit.operated_by_name = operated_by_name;
                            exit.item_return_audit.pass_flag = true;
                            exit.item_return_audit.comment = this.request.body.comment;

                            yield exit.save();

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'submitToConfirmExit',//提交到确认出院步骤
                verb: 'post',
                url: this.service_url_prefix + "/submitToConfirmExit/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var exit;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            exit = yield app.modelFactory().model_read(app.models['pfta_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }
                            if (exit.current_step!='A0005') {
                                this.body = app.wrapper.res.error({message: '出院流程步骤错误，当前状态下不能提交!'});
                                yield next;
                                return;
                            }

                            console.log('前置检查完成');

                            exit.current_step = 'A0007';
                            if(!exit.settlement_audit)
                                exit.settlement_audit = {};
                            exit.settlement_audit.operated_by = operated_by;
                            exit.settlement_audit.operated_by_name = operated_by_name;
                            exit.settlement_audit.pass_flag = true;
                            exit.settlement_audit.comment = this.request.body.comment;

                            yield exit.save();

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'advancePaymentItemsWhenExitSettlement',
                verb: 'get',
                url: this.service_url_prefix + "/advancePaymentItemsWhenExitSettlement/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var exit = yield app.modelFactory().model_read(app.models['pfta_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }

                            var elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], exit.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if(!elderly.begin_exit_flow){
                                this.body = app.wrapper.res.error({message: '当前老人没有办理出院流程，无法获取结算信息!'});
                                yield next;
                                return;
                            }

                            var advancePaymentItems = [];

                            var balance_brought_forward_payment_item = {digest: '上期结转', amount: elderly.general_ledger};
                            advancePaymentItems.push(balance_brought_forward_payment_item);
                            var arr_journal_account = elderly.journal_account;
                            for(var i=0;i<arr_journal_account.length;i++) {
                                if (arr_journal_account[i].carry_over_flag == false && (arr_journal_account[i].revenue_and_expenditure_type == 'A0001' || arr_journal_account[i].revenue_and_expenditure_type == 'A0002')) {
                                    advancePaymentItems.push({
                                        digest: app.dictionary.pairs["D3002"][arr_journal_account[i].revenue_and_expenditure_type].name + ':' + arr_journal_account[i].digest,
                                        amount: arr_journal_account[i].amount
                                    });
                                }
                            }

                            this.body = app.wrapper.res.rows(advancePaymentItems);

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'chargeItemsRecordedWhenExitSettlement',
                verb: 'get',
                url: this.service_url_prefix + "/chargeItemsRecordedWhenExitSettlement/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var exit = yield app.modelFactory().model_read(app.models['pfta_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }

                            var elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], exit.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if(!elderly.begin_exit_flow){
                                this.body = app.wrapper.res.error({message: '当前老人没有办理出院流程，无法获取结算信息!'});
                                yield next;
                                return;
                            }

                            var chargeItems = [];
                            var arr_journal_account = elderly.journal_account;
                            for(var i=0;i<arr_journal_account.length;i++) {
                                if (arr_journal_account[i].carry_over_flag == false && arr_journal_account[i].revenue_and_expenditure_type != 'A0001' && arr_journal_account[i].revenue_and_expenditure_type != 'A0002') {
                                    var revenue_and_expenditure_type_Prefix = arr_journal_account[i].revenue_and_expenditure_type.substr(0,1);
                                    chargeItems.push({
                                        digest: app.dictionary.pairs["D3002"][arr_journal_account[i].revenue_and_expenditure_type].name + ':' + arr_journal_account[i].digest,
                                        amount: (revenue_and_expenditure_type_Prefix == 'A' ? -1 : 1) * arr_journal_account[i].amount
                                    });
                                }
                            }


                            this.body = app.wrapper.res.rows(chargeItems);

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'chargeItemsUnRecordedWhenExitSettlement',
                verb: 'get',
                url: this.service_url_prefix + "/chargeItemsUnRecordedWhenExitSettlement/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var exit = yield app.modelFactory().model_read(app.models['pfta_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }

                            var elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], exit.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if(!elderly.begin_exit_flow){
                                this.body = app.wrapper.res.error({message: '当前老人没有办理出院流程，无法获取结算信息!'});
                                yield next;
                                return;
                            }

                            var elderly_json = elderly.toObject();

                            //1、寻找最后一次的预付月租并计算到今天为止应该退还多少租金
                            var chargeItems = [];

                            var arr_journal_account_B0001 = app._.where(elderly_json.journal_account,{revenue_and_expenditure_type:'B0001'});
                            if(arr_journal_account_B0001.length>0) {
                                var latest_journal_account_B0001 = app._.max(arr_journal_account_B0001, function (item) {
                                    return item.check_in_time;
                                });

                                var firstPrepayDate = latest_journal_account_B0001.check_in_time;
                                var daysOfMonthOnAverage = 30;
                                var monthly_prepay_price = app._.reduce(app._.pluck(elderly_json.charge_items,'period_price'),function(total,period_price){
                                        return total + period_price;
                                },0);

                                var charge_item_day_price = monthly_prepay_price / daysOfMonthOnAverage;

                                var remainder = daysOfMonthOnAverage - app.moment().diff(firstPrepayDate,'days') % daysOfMonthOnAverage;
                                var refund = (charge_item_day_price * remainder).toFixed(2);

                                chargeItems.push({
                                    digest: app.dictionary.pairs["D3002"]['A0003'].name + ':' + remainder + '天',
                                    amount: -1 * refund
                                });
                            }
                            //2、赔偿物品


                            this.body = app.wrapper.res.rows(chargeItems);

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'exitSettlement',//出院结算
                verb: 'post',
                url: this.service_url_prefix + "/exitSettlement/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var exit, elderly, tenant;
                        var raw_elderly_general_ledger, raw_elderly_subsidiary_ledger, raw_elderly_journal_account;
                        var raw_tenant_general_ledger, raw_tenant_subsidiary_ledger;
                        var raw_exit_settlement_info;
                        var new_elderly_journal_account_item_A0003;//未入账费用当前仅A0003预付月租退款
                        var new_tenantJournalAccount_B0006,remove_tenantJournalAccount_B0006_id;
                        var new_elderly_journal_account_item, new_tenantJournalAccount_item,remove_tenantJournalAccount_item_id;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            exit = yield app.modelFactory().model_read(app.models['pfta_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }
                            if (exit.current_step != 'A0005') {
                                this.body = app.wrapper.res.error({message: '出院流程步骤错误，当前状态下不能提交!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], exit.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if (!elderly.begin_exit_flow) {
                                this.body = app.wrapper.res.error({message: '当前老人没有办理出院流程，无法结算!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], exit.tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }


                            var exit_json = exit.toObject();
                            var elderly_json = elderly.toObject();
                            var tenant_json = tenant.toObject();
                            console.log('前置检查完成');

                            raw_elderly_general_ledger = elderly_json.general_ledger;
                            raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                            raw_elderly_journal_account = app.clone(elderly_json.journal_account);
                            raw_tenant_general_ledger = tenant_json.general_ledger;
                            raw_tenant_subsidiary_ledger = app.clone(tenant_json.subsidiary_ledger);
                            if(exit_json.settlement_info){
                                raw_exit_settlement_info = app.clone(tenant_json.settlement_info);
                            }
                            else{
                                raw_exit_settlement_info = undefined;
                            }


                            //预缴金额
                            var advancePayment = elderly_json.general_ledger;
                            var arr_journal_account = elderly_json.journal_account;
                            for (var i = 0; i < arr_journal_account.length; i++) {
                                if (arr_journal_account[i].carry_over_flag == false && (arr_journal_account[i].revenue_and_expenditure_type == 'A0001' || arr_journal_account[i].revenue_and_expenditure_type == 'A0002')) {
                                    advancePayment += arr_journal_account[i].amount;
                                }
                            }

                            //已入账费用合计
                            var recorded_charge_total = 0;
                            var arr_journal_account = elderly_json.journal_account;
                            for (var i = 0; i < arr_journal_account.length; i++) {
                                if (arr_journal_account[i].carry_over_flag == false && arr_journal_account[i].revenue_and_expenditure_type != 'A0001' && arr_journal_account[i].revenue_and_expenditure_type != 'A0002') {
                                    var revenue_and_expenditure_type_Prefix = arr_journal_account[i].revenue_and_expenditure_type.substr(0, 1);
                                    recorded_charge_total += (revenue_and_expenditure_type_Prefix == 'A' ? -1 : 1) * arr_journal_account[i].amount;
                                }
                            }

                            //未入账费用合计
                            var unrecorded_charge_total = 0;
                            var arr_journal_account_B0001 = app._.where(elderly_json.journal_account, {revenue_and_expenditure_type: 'B0001'});
                            if (arr_journal_account_B0001.length > 0) {
                                var latest_journal_account_B0001 = app._.max(arr_journal_account_B0001, function (item) {
                                    return item.check_in_time;
                                });

                                var firstPrepayDate = latest_journal_account_B0001.check_in_time;
                                var daysOfMonthOnAverage = 30;
                                var monthly_prepay_price = app._.reduce(app._.pluck(elderly_json.charge_items, 'period_price'), function (total, period_price) {
                                    return total + period_price;
                                }, 0);

                                var charge_item_day_price = monthly_prepay_price / daysOfMonthOnAverage;
                                var remainder = daysOfMonthOnAverage - app.moment().diff(firstPrepayDate, 'days') % daysOfMonthOnAverage;
                                var refund = (charge_item_day_price * remainder);

                                //未入账费用
                                unrecorded_charge_total += -1 * refund;

                                //记入老人资金流水
                                //此处因为是最后一次的出院结算，因此直接将结算标志设置为true
                                new_elderly_journal_account_item_A0003 = {
                                    voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                    revenue_and_expenditure_type: 'A0003',
                                    digest: app.moment(firstPrepayDate).format('YYYY-MM') + ':' + app.dictionary.pairs["D3002"]['A0003'].name + '退回' + remainder + '天',
                                    carry_over_flag: true,
                                    amount: refund
                                };
                                elderly.journal_account.push(new_elderly_journal_account_item_A0003);

                                //更新老人分类账
                                elderly.subsidiary_ledger.self = elderly.subsidiary_ledger.self + refund;

                                //记录租户流水账(不在此处结算)
                                new_tenantJournalAccount_B0006 = {
                                    voucher_no : new_elderly_journal_account_item_A0003.voucher_no,
                                    revenue_and_expenditure_type: 'B0006',
                                    digest: elderly.name + ' ' + new_elderly_journal_account_item_A0003.digest,
                                    amount: new_elderly_journal_account_item_A0003.amount,
                                    tenantId: elderly.tenantId
                                };
                                //更新租户分类账
                                tenant.subsidiary_ledger.self += -new_tenantJournalAccount_B0006.amount;
                            }

                            //更新明细流水结算
                            for(var i=0;i<elderly.journal_account.length;i++) {
                                if (!elderly.journal_account[i].carry_over_flag) {
                                    elderly.journal_account[i].carry_over_flag = true;
                                }
                            }

                            //更新老人总账
                            elderly.general_ledger = advancePayment - (recorded_charge_total + unrecorded_charge_total);

                            if (elderly.general_ledger != 0) {

                                var sign =  elderly.general_ledger > 0 ? -1 : 1;
                                new_elderly_journal_account_item = {
                                    voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                    revenue_and_expenditure_type: elderly.general_ledger > 0 ? 'B0002' : 'A0004',//租户需要退款给老人:老人需要补缴给租户欠费
                                    digest: '出院' + exit.enter_code,
                                    carry_over_flag: true,
                                    amount: elderly.general_ledger
                                };
                                elderly.journal_account.push(new_elderly_journal_account_item);

                                //计算结果老人分类账应该为0
                                new_tenantJournalAccount_item = {
                                    voucher_no : new_elderly_journal_account_item.voucher_no,
                                    revenue_and_expenditure_type: elderly.general_ledger > 0 ? 'B0007' : 'A0004',//租户需要退款给老人:老人需要补缴给租户欠费
                                    digest:  elderly.name + ' ' + new_elderly_journal_account_item.digest,
                                    amount: new_elderly_journal_account_item.amount,
                                    tenantId: elderly.tenantId
                                };

                                elderly.subsidiary_ledger.self += sign * new_elderly_journal_account_item.amount;
                                elderly.general_ledger = 0;
                                tenant.subsidiary_ledger.self += sign * new_tenantJournalAccount_item.amount;

                            }


                            //更新出院结算信息
                            if(!exit.settlement_info){
                                exit.settlement_info = {};
                            }
                            exit.settlement_info.operated_on = app.moment();
                            exit.settlement_info.operated_by = operated_by;
                            exit.settlement_info.operated_by_name = operated_by_name;
                            exit.settlement_info.settlement_flag = true;
                            exit.settlement_info.advance_payment_amount = advancePayment;
                            exit.settlement_info.charge_total = recorded_charge_total + unrecorded_charge_total;


                            yield exit.save();
                            steps="A";

                            yield elderly.save();
                            steps+="A";

                            new_tenantJournalAccount_B0006 = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], new_tenantJournalAccount_B0006);
                            remove_tenantJournalAccount_B0006_id = new_tenantJournalAccount_B0006._id;
                            steps+="A";
                            new_tenantJournalAccount_item = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], new_tenantJournalAccount_item);
                            remove_tenantJournalAccount_item_id = new_tenantJournalAccount_item._id;
                            steps+="A";

                            yield tenant.save();

                            this.body = app.wrapper.res.ret(exit.settlement_info);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch(i){
                                        case 0:
                                            exit.settlement_info = raw_exit_settlement_info;
                                            yield exit.save();
                                            break;
                                        case 1:
                                            elderly.general_ledger = raw_elderly_general_ledger;
                                            elderly.subsidiary_ledger =raw_elderly_subsidiary_ledger;
                                            elderly.journal_account = raw_elderly_journal_account;
                                            yield elderly.save();
                                            break;
                                        case 2:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_B0006_id);
                                            break;
                                        case 3:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_item_id);
                                            break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'completeExit',//完成出院
                verb: 'post',
                url: this.service_url_prefix + "/completeExit/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var exit,tenant,elderly,roomStatus,now_roomOccupancyChangeHistory,new_roomOccupancyChangeHistory;
                        var raw_exit_current_step,raw_exit_exit_on,raw_exit_elderly_snapshot;
                            raw_elderly_live_in_flag, raw_elderly_begin_exit_flow,raw_elderly_room_value, raw_elderly_room_summary,raw_elderly_exit_on,
                            raw_roomStatus_occupied,raw_roomOccupancyChangeHistory_in_flag,raw_roomOccupancyChangeHistory_check_out_time;
                        var remove_roomOccupancyChangeHistory_id;
                        try {
                            exit = yield app.modelFactory().model_read(app.models["pfta_exit"], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到出院记录!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models["pub_elderly"], exit.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if (!elderly.live_in_flag) {
                                this.body = app.wrapper.res.error({message: '该老人已出院!'});
                                yield next;
                                return;
                            }

                            roomStatus = yield app.modelFactory().model_one(app.models["pfta_roomStatus"], {
                                where: {
                                    roomId: elderly.room_value.roomId,
                                    'occupied.bed_no': elderly.room_value.bed_no,
                                    'occupied.elderlyId': elderly._id,
                                    'occupied.bed_status': 'A0003'
                                }
                            });

                            if (roomStatus == null) {
                                this.body = app.wrapper.res.error({message: '无法找到当前老人在用的床位状态资料!'});
                                yield next;
                                return;
                            }

                            var roomOccupancyChangeHistories = yield app.modelFactory().model_query(app.models['pfta_roomOccupancyChangeHistory'], {
                                where: {
                                    tenantId: exit.tenantId,
                                    roomId: elderly.room_value.roomId,
                                    bed_no: elderly.room_value.bed_no,
                                    elderlyId: elderly._id,
                                    in_flag: true
                                }, sort: {check_in_time: -1}
                            });

                            if (roomOccupancyChangeHistories && roomOccupancyChangeHistories.length > 0) {
                                now_roomOccupancyChangeHistory = roomOccupancyChangeHistories[0];
                            }
                            else {
                                this.body = app.wrapper.res.error({message: '无法找到旧的房间占用历史!'});
                                yield next;
                                return;
                            }


                            var exit_json = exit.toObject();
                            var elderly_json = elderly.toObject();
                            var roomStatus_json = roomStatus.toObject();
                            console.log('前置检查完成');

                            raw_exit_current_step = exit_json.current_step;
                            raw_exit_exit_on = undefined;
                            raw_exit_elderly_snapshot = undefined;
                            raw_elderly_live_in_flag = elderly_json.live_in_flag;
                            raw_elderly_begin_exit_flow = elderly_json.begin_exit_flow;
                            raw_elderly_room_value = app.clone(elderly_json.room_value);
                            raw_elderly_room_summary = elderly_json.room_summary;
                            raw_elderly_exit_on = undefined;
                            raw_roomStatus_occupied = app.clone(roomStatus_json.occupied);
                            raw_roomOccupancyChangeHistory_in_flag = now_roomOccupancyChangeHistory.in_flag;
                            raw_roomOccupancyChangeHistory_check_out_time = undefined;


                            now_roomOccupancyChangeHistory.in_flag = true;
                            now_roomOccupancyChangeHistory.check_out_time = app.moment();

                            for (var i = 0; i < roomStatus.occupied.length; i++) {
                                var occupy = roomStatus.occupied[i];
                                if (elderly._id.equals(occupy.elderlyId) && elderly.room_value.bed_no == occupy.bed_no && occupy.bed_status == 'A0003') {
                                    console.log('update roomOccupy')
                                    occupy.bed_status = 'A0001';
                                    occupy.elderlyId = undefined;
                                }
                            }

                            exit.current_step = 'A0009';
                            exit.exit_on = app.moment();
                            exit.elderly_snapshot = {
                                charge_standard: elderly_json.charge_standard,
                                charge_items: elderly_json.charge_items,
                                journal_account: elderly_json.journal_account,
                                charge_item_change_history: elderly_json.charge_item_change_history
                            };

                            elderly.live_in_flag = false;
                            elderly.begin_exit_flow = false;
                            elderly.room_value = undefined;
                            elderly.room_summary = undefined;
                            elderly.exit_on = exit.exit_on;

                            yield now_roomOccupancyChangeHistory.save();
                            steps = "A";

                            yield roomStatus.save();
                            steps += "A";

                            yield exit.save();
                            steps += "A";

                            yield elderly.save();

                            this.body = app.wrapper.res.ret({current_step: exit.current_step, exit_on: exit.exit_on});

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch(i){
                                        case 0:
                                            now_roomOccupancyChangeHistory.in_flag = raw_roomOccupancyChangeHistory_in_flag;
                                            now_roomOccupancyChangeHistory.check_out_time = raw_roomOccupancyChangeHistory_check_out_time;
                                            yield now_roomOccupancyChangeHistory.save();
                                            break;
                                        case 1:
                                            roomStatus.occupied = raw_roomStatus_occupied;
                                            yield roomStatus.save();
                                            break;
                                        case 2:
                                            exit.current_step = raw_exit_current_step;
                                            exit.exit_on = raw_exit_exit_on;
                                            exit.elderly_snapshot = raw_exit_elderly_snapshot;
                                            yield exit.save();
                                            break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            /**********************入院相关*****************************/
            {
                method: 'completeEnter',//完成入院
                verb: 'post',
                url: this.service_url_prefix + "/completeEnter/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var enter,tenant,elderly,roomStatus,roomOccupancyChangeHistory,
                            journal_account_item_A0001,journal_account_item_B0001,
                            tenantJournalAccount_A0001;
                        var old_current_register_step,old_live_in_flag,old_enter_code,old_enter_on,old_remark,old_roomStatus_occupied,
                            old_elderly_journal_account,old_elderly_subsidiary_ledger,old_tenant_subsidiary_ledger;

                        var remove_roomStatus_id,remove_roomOccupancyChangeHistory_id,remove_tenantJournalAccount_A0001_id;
                        try {
                            //1、订单状态改为[入院成功]
                            enter = yield app.modelFactory().read(enterModelOption.model_name, enterModelOption.model_path, this.params._id);

                            if(!enter || enter.status == 0 ) {
                                this.body = app.wrapper.res.error({message: '无法找到入院记录!'});
                                yield next;
                                return;
                            }
                            old_current_register_step = enter.current_register_step;
                            enter.current_register_step = 'A0007';
                            console.log('prepare 1');
                            //2、获取租户信息
                            tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, enter.tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            console.log('prepare 2');
                            //3、正式入院后从入院单中复制
                            elderly = yield app.modelFactory().read(elderlyModelOption.model_name, elderlyModelOption.model_path, enter.elderlyId);
                            if(!elderly || elderly.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }
                            var elderly_json = elderly.toObject();

                            old_live_in_flag = elderly.live_in_flag;
                            old_enter_code = undefined;
                            old_enter_on = undefined;
                            old_remark = elderly.remark;
                            if(!old_remark)
                                old_remark = undefined;

                            elderly.live_in_flag = true;
                            elderly.enter_code = enter.code;
                            elderly.enter_on = enter.enter_on;
                            if(!elderly.remark)
                                elderly.remark = enter.remark;
                            console.log('prepare 3');
                            //4、更新房间床位信息
                            var roomId = elderly.room_value.roomId;
                            var bed_no = elderly.room_value.bed_no;
                            roomStatus = yield app.modelFactory().one(roomStatusModelOption.model_name,roomStatusModelOption.model_path,{where:{roomId:roomId}});
                            if(!roomStatus){
                                roomStatus = {
                                    roomId: roomId,
                                    occupied: [{bed_no: bed_no, bed_status:'A0003', elderlyId: enter.elderlyId}],
                                    tenantId: enter.tenantId
                                };
                            }
                            else{
                                old_roomStatus_occupied = app.clone(roomStatus.toObject().occupied);
                                if(!old_roomStatus_occupied)
                                    old_roomStatus_occupied = undefined;


                                if(roomStatus.occupied){
                                    for(var i=0;i< roomStatus.occupied.length;i++ ) {
                                        console.log(typeof elderly.toObject()._id);
                                        console.log(typeof roomStatus.occupied[i].toObject().elderlyId);
                                        console.log(elderly._id.equals(roomStatus.occupied[i].elderlyId));
                                        if(roomStatus.occupied[i].bed_no==bed_no && elderly._id.equals(roomStatus.occupied[i].elderlyId)) {
                                            roomStatus.occupied[i].bed_status = 'A0003';
                                        }
                                    }
                                }

                                //var isOccupied = app._.some(roomStatus.occupied,function(o){
                                //    return o.bed_no == bed_no && elderlyId == elderly._id;
                                //});
                                //if(isOccupied){
                                //    this.body = app.wrapper.res.error({message: '该房间床位已经占用!'});
                                //    yield next;
                                //    return;
                                //}
                                //else{
                                //    roomStatus.occupied.push({bed_no: bed_no, elderlyId: elderly._id});
                                //}
                            }



                            console.log('prepare 4');
                            //5、增加房间状态变动历史
                            roomOccupancyChangeHistory = {
                                roomId: roomId,
                                bed_no: bed_no,
                                room_summary: elderly.room_summary,
                                elderlyId: elderly._id,
                                elderly_summary: elderly.name + ' ' + elderly.id_no,
                                in_flag: true,
                                tenantId: enter.tenantId
                            };
                            console.log('prepare 5');
                            //6、增加老人资金流水
                            //6.1个人存款
                            journal_account_item_A0001 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'A0001',
                                digest: enter.code,
                                amount: enter.deposit
                            };
                            //6.2预付月租
                            journal_account_item_B0001 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'B0001',
                                digest: app.moment().format('YYYY-MM'),
                                amount: enter.sum_period_price * 1
                            };

                            old_elderly_journal_account = app.clone(elderly_json.journal_account);
                            if(!old_elderly_journal_account)
                                old_elderly_journal_account = undefined;

                            if(!elderly.journal_account)
                                elderly.journal_account = [];
                            elderly.journal_account.push(journal_account_item_A0001);
                            elderly.journal_account.push(journal_account_item_B0001);
                            console.log('prepare 6');

                            //7、增加租户资金流水
                            tenantJournalAccount_A0001 = {
                                voucher_no : journal_account_item_B0001.voucher_no,
                                revenue_and_expenditure_type: 'A0001',
                                digest: elderly.name + ' ' + journal_account_item_B0001.digest,
                                amount: journal_account_item_B0001.amount,
                                tenantId: enter.tenantId
                            };
                            console.log('prepare 7');

                            //8、修改老人明细账
                            old_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                            elderly.subsidiary_ledger.self += journal_account_item_A0001.amount - journal_account_item_B0001.amount;
                            console.log('prepare 8');
                            //9、修改租户明细账
                            old_tenant_subsidiary_ledger = app.clone(tenant.toObject().subsidiary_ledger);
                            tenant.subsidiary_ledger.self += tenantJournalAccount_A0001.amount;
                            console.log('prepare 9');
                            //commit 原子事务性保存

                            yield enter.save();
                            steps="A";
                            yield elderly.save();
                            steps+="A";
                            if(roomStatus._id){
                                yield roomStatus.save();
                                steps+="A";
                            }
                            else{
                                roomStatus = yield app.modelFactory().create(roomStatusModelOption.model_name,roomStatusModelOption.model_path, roomStatus);
                                remove_roomStatus_id = roomStatus._id;
                                steps+="B";
                            }
                            roomOccupancyChangeHistory = yield app.modelFactory().model_create(app.models['pfta_roomOccupancyChangeHistory'], roomOccupancyChangeHistory);
                            remove_roomOccupancyChangeHistory_id = roomOccupancyChangeHistory._id;
                            steps+="A";
                            tenantJournalAccount_A0001 = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], tenantJournalAccount_A0001);
                            remove_tenantJournalAccount_A0001_id = tenantJournalAccount_A0001._id;
                            steps+="A";
                            yield tenant.save();
                            steps+="A";
                            this.body = app.wrapper.res.ret({current_register_step: enter.current_register_step});
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch(i){
                                        case 0:
                                            enter.current_register_step = old_current_register_step;
                                            yield enter.save();
                                            break;
                                        case 1:
                                            elderly.live_in_flag = old_live_in_flag;
                                            elderly.enter_code = old_enter_code;
                                            elderly.enter_on = old_enter_on;
                                            elderly.remark = old_remark;
                                            elderly.journal_account = old_elderly_journal_account;
                                            elderly.subsidiary_ledger =old_elderly_subsidiary_ledger;
                                            yield elderly.save();
                                            break;
                                        case 2:
                                            if(steps[i] == 'A'){
                                                //修改
                                                roomStatus.occupied = old_roomStatus_occupied;
                                                yield roomStatus.save();
                                            }
                                            else{
                                                //删除
                                                yield app.modelFactory().delete(roomStatusModelOption.model_name,roomStatusModelOption.model_path, remove_roomStatus_id);
                                            }
                                            break;
                                        case 3:
                                            yield app.modelFactory().model_delete(app.models['pfta_roomOccupancyChangeHistory'],remove_roomOccupancyChangeHistory_id);
                                            break;
                                        case 4:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_A0001_id);
                                            break;
                                        case 5:
                                            tenant.subsidiary_ledger = old_tenant_subsidiary_ledger;
                                            tenant.save();
                                            break;
                                    }
                                }
                            }

                        }
                        yield next;
                    };
                }
            },
            {
                method: 'disableEnterRelatedAction',//作废入院记录的相关动作
                verb: 'post',
                url: this.service_url_prefix + "/disableEnterRelatedAction/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var enter,tenant,elderly;
                        var toUpdateRoomStatus = [];
                        var arr_old_roomStatus_occupied = [];

                        try {
                            //1、订单状态改为[入院成功]
                            enter = yield app.modelFactory().read(enterModelOption.model_name, enterModelOption.model_path, this.params._id);
                            if(!enter  || enter.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到入院记录!'});
                                yield next;
                                return;
                            }
                            console.log('prepare 1');
                            //2、获取租户信息
                            tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, enter.tenantId);
                            if(!tenant  || tenant.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            console.log('prepare 2');
                            //3、判断老人是否在院
                            elderly = yield app.modelFactory().read(elderlyModelOption.model_name, elderlyModelOption.model_path, enter.elderlyId);
                            if(!elderly || elderly.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }
                            if(elderly.live_in_flag){
                                this.body = app.wrapper.res.error({message: '老人已经在院，必须办理出院手续!'});
                                yield next;
                                return;
                            }

                            //解除预占用
                            var roomStatuses  = yield app.modelFactory().model_query(app.models['pfta_roomStatus'], {where: {tenantId: enter.tenantId}});
                            for(var i=0;i<roomStatuses.length;i++) {
                                if(roomStatuses[i].occupied){
                                    var old_roomStatus_occupied = app.clone(roomStatuses[i].toObject().occupied);

                                    for(var j=0;j<roomStatuses[i].occupied.length;j++){
                                        var occupy = roomStatuses[i].occupied[j];
                                        if (elderly._id.equals(occupy.elderlyId)) {
                                            occupy.bed_status = 'A0001';
                                            occupy.elderlyId = undefined;
                                            arr_old_roomStatus_occupied.push(old_roomStatus_occupied);
                                            toUpdateRoomStatus.push(roomStatuses[i]);
                                        }
                                    }
                                }
                            }

                            for(var i=0;i<toUpdateRoomStatus.length;i++) {
                                yield toUpdateRoomStatus[i].save();
                                steps += "A";
                            }

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    var roomStatus = toUpdateRoomStatus[i];
                                    roomStatus.occupied = arr_old_roomStatus_occupied[i];
                                    yield roomStatus.save();
                                }
                            }

                        }
                        yield next;
                    };
                }
            },
            {
                method: 'checkBeforeAddEnter',//作废入院记录的相关动作
                verb: 'get',
                url: this.service_url_prefix + "/checkBeforeAddEnter/:tenantId/:id_no",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var enter, tenant, elderly;
                        var toUpdateRoomStatus = [];
                        var arr_old_roomStatus_occupied = [];

                        try {
                            var tenantId = this.params.tenantId;
                            var id_no = this.params.id_no;
                            var canAdd = true;

                            //1、获取租户信息
                            tenant = yield app.modelFactory().model_read(app.models["pub_tenant"], tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            console.log('prepare 1');
                            //2、判断老人是否在院
                            elderly = yield app.modelFactory().model_one(app.models['pub_elderly'], {
                                where: {
                                    id_no: id_no,
                                    tenantId: tenantId
                                },
                                select:'_id status live_in_flag name id_no sex birthday marriage home_address family_members medical_insurance politics_status inhabit_status financial_status hobbies medical_histories remark'
                            });
                            if (elderly && elderly.status == 1) {

                                if (elderly.live_in_flag) {
                                    console.log('老人已经在院，无法办理入院手续!');
                                    this.body = app.wrapper.res.error({message: '老人已经在院，无法办理入院手续!'});
                                    yield next;
                                    return;
                                }
                            }
                            console.log('prepare 2');
                            //3、判断老人是否同时存在其他未确认的入院记录
                            if (elderly && elderly._id) {
                                var enters = yield app.modelFactory().model_query(app.models['pfta_enter'], {
                                    where: {
                                        elderlyId: elderly._id,
                                        current_register_step: {"$in": ['A0001', 'A0003', 'A0005']},
                                        tenantId: tenantId,
                                        status: 1
                                    }
                                });

                                if (enters && enters.length > 0) {
                                    this.body = app.wrapper.res.error({message: '系统检测到该老人已经存在其他入院记录，无法办理入院手续!'});
                                    yield next;
                                    return;
                                }
                            }

                            this.body = app.wrapper.res.ret({elderly: elderly});
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                        }
                        yield next;
                    };
                }
            },
            /**********************老人相关*****************************/
            {
                method: 'queryElderly',
                verb: 'post',
                url: this.service_url_prefix + "/q/elderly",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.request.body.tenantId;
                            var keyword = this.request.body.keyword;
                            var data = this.request.body.data;
                            tenant = yield app.modelFactory().model_query(app.models['pub_tenant'], tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }

                            app._.extend(data.where,{
                                status: 1,
                                tenantId: tenantId
                            });

                            if(keyword){
                                data.where.name = new RegExp(keyword);
                            }
                            var rows = yield app.modelFactory().model_query(app.models['pub_elderly'], data);

                            this.body = app.wrapper.res.rows(rows);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'elderlyInfo',
                verb: 'get',
                url: this.service_url_prefix + "/elderlyInfo/:_id/:select",//:select需要提取的字段域用逗号分割 e.g. name,type
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], this.params._id);
                            var ret = app._.pick(elderly.toObject(),this.params.select.split(','));
                            this.body = app.wrapper.res.ret(ret);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'changeElderlyRoomBed',
                verb: 'post',
                url: this.service_url_prefix + "/changeElderlyRoomBed",
                handler: function (app, options) {
                    return function * (next) {



                        var steps;
                        var tenant,elderly,room;
                        var oldRoomStatus,newRoomStatus,updateRoomStatus,old_roomOccupancyChangeHistory,new_roomOccupancyChangeHistory;
                        var raw_elderly_room_value,raw_elderly_room_summary,raw_updateRoomStatus_occupied,raw_bed_status_for_cancel_occupy_roomStatus,raw_elderly_for_cancel_occupy_roomStatus,raw_in_flag;
                        var cancel_occupy;
                        try {
                            //this.request.body
                            var tenantId = this.request.body.tenantId;
                            var elderlyId = this.request.body.elderlyId;
                            var roomId = this.request.body.roomId;
                            var bed_no = Number(this.request.body.bed_no);

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], elderlyId);
                            if(!elderly || elderly.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }
                            room =  yield app.modelFactory().model_read(app.models['pfta_room'], roomId);
                            if(!room || room.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到搬入房间资料!'});
                                yield next;
                                return;
                            }

                            var district = yield app.modelFactory().model_read(app.models['pfta_district'], room.districtId);
                            if(!district || district.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到搬入房间所在区域资料!'});
                                yield next;
                                return;
                            }
                            if(bed_no > room.capacity) {
                                this.body = app.wrapper.res.error({message: '无效的床位号，该房间最多支持'+room.capacity+'床位!'});
                                yield next;
                                return;
                            }

                            var elderly_json = elderly.toObject();
                            raw_elderly_room_value = app.clone(elderly_json.room_value);
                            raw_elderly_room_summary = elderly_json.room_summary;

                            if(raw_elderly_room_value.roomId == roomId && raw_elderly_room_value.bed_no == bed_no){
                                this.body = app.wrapper.res.error({message: '房间床位没有变化!'});
                                yield next;
                                return;
                            }



                            //检查入住老人有没有其他的预占用或在用记录
                            console.log(raw_elderly_room_value.roomId.toString());
                            var oldRoomStatuses = yield app.modelFactory().model_query(app.models['pfta_roomStatus'], {where: {tenantId: tenantId,roomId:raw_elderly_room_value.roomId}});
                            if(oldRoomStatuses.length == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人搬离房间床位信息!'});
                                yield next;
                                return;
                            }
                            else {
                                oldRoomStatus = oldRoomStatuses[0];
                            }
                            if(!oldRoomStatus.occupied){
                                this.body = app.wrapper.res.error({message: '无法找到老人搬离房间床位信息!'});
                                yield next;
                                return;
                            }
                            var foundOccupy = false;
                            for(var j=0;j<oldRoomStatus.occupied.length;j++){
                                var occupy = oldRoomStatus.occupied[j];

                                if (occupy.bed_no == raw_elderly_room_value.bed_no &&  elderlyId == occupy.elderlyId) {
                                    foundOccupy = true;
                                    if (occupy.bed_status == 'A0002') {
                                        this.body = app.wrapper.res.error({message: '该老人旧床位仅仅被预占用，请使用修改预占用床位功能!'});
                                        yield next;
                                        return;
                                    }

                                    //rollback用
                                    raw_bed_status_for_cancel_occupy_roomStatus = occupy.bed_status;
                                    raw_elderly_for_cancel_occupy_roomStatus = occupy.elderlyId;
                                    cancel_occupy = occupy;

                                    occupy.bed_status = 'A0001';
                                    occupy.elderlyId = undefined;
                                }
                            }

                            if(!foundOccupy){
                                this.body = app.wrapper.res.error({message: '无法找到老人原来的房间床位信息!'});
                                yield next;

                                return;
                            }
                            console.log('前置检查完成');

                            //修改room_summary,room_value
                            elderly.room_value.districtId = room.districtId;
                            elderly.room_value.roomId = roomId;
                            elderly.room_value.bed_no = bed_no;
                            elderly.room_summary = district.name + '-'+room.floor+'F-'+room.name+'-'+bed_no+'#床';

                            var newRoomStatuses = yield app.modelFactory().model_query(app.models['pfta_roomStatus'], {where: {tenantId: tenantId,roomId:roomId}});
                            if(newRoomStatuses.length == 0) {
                                newRoomStatus = {
                                    roomId: roomId,
                                    occupied: [{bed_no: bed_no, bed_status: 'A0003', elderlyId: elderlyId}],
                                    tenantId: tenantId
                                };
                            }
                            else {
                                updateRoomStatus = newRoomStatuses[0];

                                //rollback用
                                raw_updateRoomStatus_occupied = app.clone(updateRoomStatus.toObject().occupied);

                                var bedInfo1;
                                if (updateRoomStatus.occupied) {
                                    for (var i = 0; i < updateRoomStatus.occupied.length; i++) {
                                        if (bed_no == updateRoomStatus.occupied[i].bed_no) {
                                            bedInfo1 = updateRoomStatus.occupied[i];
                                        }
                                    }
                                }

                                if (!bedInfo1) {
                                    updateRoomStatus.occupied.push({
                                        bed_no: bed_no,
                                        bed_status: 'A0003',
                                        elderlyId: elderlyId
                                    });
                                }
                                else {
                                    //判断要入住的床位是否有其他老人，如有其他老人已经预占则返回
                                    if (bedInfo1.elderlyId) {
                                        //改成
                                        this.body = app.wrapper.res.error({message: '该床位已经被占用，请刷新床位信息!'});
                                        yield next;
                                        return;
                                    }
                                    bedInfo1.bed_status = 'A0003';
                                    bedInfo1.elderlyId = elderlyId;
                                }
                            }



                            //修改旧的占用历史(in_flag改为搬离，并设置搬离时间)
                            console.log(raw_elderly_room_value.roomId);
                            console.log(elderlyId);
                            var roomOccupancyChangeHistories = yield app.modelFactory().model_query(app.models['pfta_roomOccupancyChangeHistory'], {where: {tenantId: tenantId,roomId:raw_elderly_room_value.roomId,bed_no:raw_elderly_room_value.bed_no,elderlyId:elderlyId,in_flag:true},sort:{check_in_time:-1}});
                            console.log(roomOccupancyChangeHistories);
                            if(roomOccupancyChangeHistories && roomOccupancyChangeHistories.length>0) {
                                old_roomOccupancyChangeHistory = roomOccupancyChangeHistories[0];
                                raw_in_flag = old_roomOccupancyChangeHistory.in_flag;
                                old_roomOccupancyChangeHistory.in_flag = false;
                                old_roomOccupancyChangeHistory.check_out_time = app.moment();
                            }
                            else {
                                this.body = app.wrapper.res.error({message: '无法找到旧的房间占用历史!'});
                                yield next;
                                return;
                            }

                            //增加新的占用记录
                            new_roomOccupancyChangeHistory = {
                                roomId: roomId,
                                room_summary: elderly.room_summary,
                                bed_no: bed_no,
                                elderlyId: elderly._id,
                                elderly_summary: elderly.name + ' ' + elderly.id_no,
                                in_flag: true,
                                tenantId: tenantId
                            };

                            yield elderly.save();
                            steps="A";

                            if(cancel_occupy){
                                yield oldRoomStatus.save();
                            }
                            steps += 'A';

                            if(newRoomStatus) {
                                newRoomStatus =  yield app.modelFactory().model_create(app.models['pfta_roomStatus'], newRoomStatus);
                            }
                            else if(updateRoomStatus){
                                yield updateRoomStatus.save();
                            }
                            steps += 'A';
                            if(old_roomOccupancyChangeHistory){
                                yield old_roomOccupancyChangeHistory.save();
                            }
                            steps += 'A';

                            new_roomOccupancyChangeHistory = yield app.modelFactory().model_create(app.models['pfta_roomOccupancyChangeHistory'], new_roomOccupancyChangeHistory);
                            steps += 'A';

                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch(i) {
                                        case 0:
                                            elderly.room_value = raw_elderly_room_value;
                                            elderly.room_summary = raw_elderly_room_summary;
                                            yield elderly.save();
                                            break;
                                        case 1:
                                            if (cancel_occupy) {
                                                cancel_occupy.bed_status = raw_bed_status_for_cancel_occupy_roomStatus;
                                                cancel_occupy.elderlyId = raw_elderly_for_cancel_occupy_roomStatus;
                                                yield oldRoomStatus.save();
                                            }
                                            break;
                                        case 2:
                                            if (newRoomStatus) {
                                                yield app.modelFactory().model_delete(app.models['pfta_roomStatus'], newRoomStatus._id);
                                            }
                                            else if (updateRoomStatus) {
                                                updateRoomStatus.occupied = raw_updateRoomStatus_occupied;
                                                yield updateRoomStatus.save();
                                            }
                                            break;
                                        case 3:
                                            if (old_roomOccupancyChangeHistory) {
                                                old_roomOccupancyChangeHistory.in_flag = raw_in_flag;
                                                yield old_roomOccupancyChangeHistory.save();
                                            }
                                            break;
                                        //case 4:
                                        //    if(new_roomOccupancyChangeHistory) {
                                        //        yield app.modelFactory().model_delete(app.models['pfta_roomOccupancyChangeHistory'], new_roomOccupancyChangeHistory._id);
                                        //    }
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'changeElderlyChargeItem',
                verb: 'post',
                url: this.service_url_prefix + "/changeElderlyChargeItem",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var tenant,elderly,charge_item;
                        var journal_account_item_A0003,journal_account_item_B0001,tenantJournalAccount_B0006,tenantJournalAccount_A0001;
                        var remove_elderly_charge_item_change_history_id,remove_tenantJournalAccount_B0006_id,remove_tenantJournalAccount_A0001_id;
                        var summary_key;
                        var old_elderly_charge_item_change_history,old_elderly_charge_items, old_elderly_journal_account,old_elderly_subsidiary_ledger,
                            old_elderly_charge_item_catalog_summary,old_tenant_subsidiary_ledger;
                        try {
                            var tenantId = this.request.body.tenantId;
                            var elderlyId = this.request.body.elderlyId;
                            var charge_item_catalog_id = this.request.body.charge_item_catalog_id;
                            var old_charge_item_id = this.request.body.old_charge_item_id;
                            var new_charge_item = this.request.body.new_charge_item;

                            var arr_old_charge_item_id = old_charge_item_id.split('.');
                            var arr_new_charge_item_id = new_charge_item.item_id.split('.');
                            if(arr_old_charge_item_id.slice(0,arr_old_charge_item_id.length-1).join('.')!= arr_new_charge_item_id.slice(0,arr_new_charge_item_id.length-1).join('.')) {
                                this.body = app.wrapper.res.error({message: '更改的收费项目不是统一个收费类别下!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], elderlyId);
                            if(!elderly || elderly.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            charge_item = app._.findWhere(elderly.charge_items, {item_id: old_charge_item_id});
                            if(!charge_item) {
                                this.body = app.wrapper.res.error({message: '该老人数据中无法找到收费项目!'});
                                yield next;
                                return;
                            }

                            var tenant_json = tenant.toObject();
                            var elderly_json = elderly.toObject();
                            console.log('前置检查完成');

                            //算法1，将旧收费项目中止，并计算退款，然后按照新收费项目重新按月预收
                            //计算预付月收费日
                            var firstPrepayDate = elderly.enter_on;
                            var daysOfMonthOnAverage = 30;

                            var except_old_monthly_prepay_price = 0;
                            var old_monthly_prepay_price = 0;
                            app._.each(elderly.charge_items,function(item) {
                                if (item.item_id != charge_item.item_id) {
                                    except_old_monthly_prepay_price += item.period_price;
                                }
                            });
                            var old_monthly_prepay_price = except_old_monthly_prepay_price + charge_item.period_price;
                            var new_monthly_prepay_price = except_old_monthly_prepay_price+ new_charge_item.period_price;

                            var old_charge_item_day_price = old_monthly_prepay_price / daysOfMonthOnAverage;
                            if(elderly.charge_item_change_history && elderly.charge_item_change_history.length>0) {
                                var latestChangeRecord = app._.max(app._.where(elderly.charge_item_change_history, {charge_item_catalog_id: charge_item_catalog_id}),
                                    function (item) {
                                        return item.check_in_time;
                                    });
                                latestChangeRecord && (firstPrepayDate = latestChangeRecord.check_in_time);
                            }

                            //当月周期未住满的天数
                            var remainder = daysOfMonthOnAverage - app.moment().diff(firstPrepayDate,'days') % daysOfMonthOnAverage;
                            var refund = (old_charge_item_day_price * remainder).toFixed(2);
                            console.log(refund);
                            old_elderly_journal_account = app.clone(elderly_json.journal_account);

                            //预付月租退款(按天计算)
                            journal_account_item_A0003 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'A0003',
                                digest: app.moment(firstPrepayDate).format('YYYY-MM') + ':' + charge_item.item_name + '->' + new_charge_item.item_name + '退回' + remainder + '天',
                                amount: refund
                            };

                            //变化后的预付月租
                            journal_account_item_B0001 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'B0001',
                                digest: app.moment().format('YYYY-MM') + ':' + charge_item.item_name + '->' + new_charge_item.item_name + '引起月租重新计算 ',
                                amount: new_monthly_prepay_price * 1
                            };

                            //记录老人流水账
                            elderly.journal_account.push(journal_account_item_A0003);
                            elderly.journal_account.push(journal_account_item_B0001);

                            //修改老人明细账
                            old_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                            elderly.subsidiary_ledger.self += journal_account_item_A0003.amount - journal_account_item_B0001.amount;

                            //增加老人收费项目变动历史
                            old_elderly_charge_item_change_history = app.clone(elderly_json.charge_item_change_history);
                            var charge_item_change_record = {
                                charge_item_catalog_id: charge_item_catalog_id,
                                old_item_id: charge_item.item_id,
                                old_item_name: charge_item.item_name,
                                old_period_price: charge_item.period_price,
                                old_period: charge_item.period,
                                new_item_id: new_charge_item.item_id,
                                new_item_name: new_charge_item.item_name,
                                new_period_price: new_charge_item.period_price,
                                new_period: new_charge_item.period
                            };
                            elderly.charge_item_change_history.push(charge_item_change_record);

                            //修改老人收费项目
                            old_elderly_charge_items =  app.clone(elderly_json.charge_items);
                            charge_item.item_id = new_charge_item.item_id;
                            charge_item.item_name = new_charge_item.item_name;
                            charge_item.period_price = new_charge_item.period_price;
                            charge_item.period = new_charge_item.period;

                            //除了房间床位分类，其他根据不同收费分类重新设置老人项目汇总信息
                            var new_charge_item_catalog_name = arr_new_charge_item_id[arr_new_charge_item_id.length-2].toLowerCase().replace('-'+elderly.charge_standard.toLowerCase(),'');


                            if(new_charge_item_catalog_name!='room') {
                                summary_key = new_charge_item_catalog_name + '_summary';
                                old_elderly_charge_item_catalog_summary = elderly[summary_key];
                                elderly[summary_key] = new_charge_item.item_name;
                            }

                            //记录租户流水账
                            tenantJournalAccount_B0006 = {
                                voucher_no : journal_account_item_A0003.voucher_no,
                                revenue_and_expenditure_type: 'B0006',
                                digest: elderly.name + ' ' + journal_account_item_A0003.digest,
                                amount: journal_account_item_A0003.amount,
                                tenantId: elderly.tenantId
                            };

                            tenantJournalAccount_A0001 = {
                                voucher_no : journal_account_item_B0001.voucher_no,
                                revenue_and_expenditure_type: 'A0001',
                                digest: elderly.name + ' ' + journal_account_item_B0001.digest,
                                amount: journal_account_item_B0001.amount,
                                tenantId: elderly.tenantId
                            };
                            //修改租户明细账
                            old_tenant_subsidiary_ledger = app.clone(tenant_json.subsidiary_ledger);
                            tenant.subsidiary_ledger.self += tenantJournalAccount_A0001.amount - tenantJournalAccount_B0006.amount;

                            yield elderly.save();
                            steps="A";

                            tenantJournalAccount_B0006 = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], tenantJournalAccount_B0006);
                            remove_tenantJournalAccount_B0006_id = tenantJournalAccount_B0006._id;
                            steps+="A";
                            tenantJournalAccount_A0001 = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], tenantJournalAccount_A0001);
                            remove_tenantJournalAccount_A0001_id = tenantJournalAccount_A0001._id;
                            steps+="A";

                            yield tenant.save();
                            steps+="A";

                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch (i) {
                                        case 0:
                                            elderly.journal_account = old_elderly_journal_account;
                                            elderly.subsidiary_ledger = old_elderly_subsidiary_ledger;
                                            elderly.charge_item_change_history = old_elderly_charge_item_change_history;
                                            if(summary_key) {
                                                elderly[summary_key] = old_elderly_charge_item_catalog_summary;
                                            }
                                            yield elderly.save();
                                            break;
                                        case 1:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_B0006_id);
                                            break;
                                        case 2:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_A0001_id);
                                            break;
                                        case 3:
                                            tenant.subsidiary_ledger = old_tenant_subsidiary_ledger;
                                            tenant.save();
                                            break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'checkCanChangeBookingOrUnbookingRecharge',//作废入院记录的相关动作
                verb: 'get',
                url: this.service_url_prefix + "/checkCanChangeBookingOrUnbookingRecharge/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var recharge, elderly, tenant;

                        try {
                            var canAdd = true;

                            recharge = yield app.modelFactory().model_read(app.models['pfta_recharge'], this.params._id);
                            if (!recharge || recharge.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到充值记录!'});
                                yield next;
                                return;
                            }
                            if (!recharge.voucher_no) {
                                this.body = app.wrapper.res.ret({itCan: false});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], recharge.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }
                            if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                yield next;
                                return;
                            }

                            var recharge_json = recharge.toObject();
                            var elderly_json = elderly.toObject();
                            console.log('前置检查完成');

                            var bookingJournalAccountItem = app._.findWhere(elderly_json.journal_account, {voucher_no: recharge_json.voucher_no});

                            this.body = app.wrapper.res.ret({itCan: bookingJournalAccountItem != null});
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                        }
                        yield next;
                    };
                }
            },
            {
                method: 'bookingRecharge',
                verb: 'post',
                url: this.service_url_prefix + "/bookingRecharge/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var recharge,elderly, tenant;
                        var raw_recharge_operated_by,raw_recharge_operated_by_name;
                        var raw_elderly_subsidiary_ledger, raw_elderly_journal_account;
                        var new_elderly_journal_account_item_A0001;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            recharge = yield app.modelFactory().model_read(app.models['pfta_recharge'], this.params._id);
                            if (!recharge || recharge.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到充值记录!'});
                                yield next;
                                return;
                            }
                            if (recharge.voucher_no) {
                                this.body = app.wrapper.res.error({message: '充值记录已经入账无需重新记账!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], recharge.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], recharge.tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }

                            var recharge_json = recharge.toObject();
                            var elderly_json = elderly.toObject();
                            console.log('前置检查完成');

                            raw_recharge_operated_by = recharge_json.operated_by;
                            raw_recharge_operated_by_name = recharge_json.operated_by_name;
                            //raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                            //raw_elderly_journal_account = app.clone(elderly_json.journal_account);

                            recharge.operated_by = operated_by;
                            recharge.operated_by_name = operated_by_name;


                            new_elderly_journal_account_item_A0001 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'A0001',
                                digest: app.moment(recharge_json.check_in_time).format('YYYY-MM-DD') + ':' + app.dictionary.pairs["D3005"][recharge_json.type].name,
                                amount: recharge_json.amount
                            };
                            recharge.voucher_no = new_elderly_journal_account_item_A0001.voucher_no;

                            elderly.journal_account.push(new_elderly_journal_account_item_A0001);

                            //更新老人分类账
                            elderly.subsidiary_ledger.self += new_elderly_journal_account_item_A0001.amount;

                            ////现金业务不应该更新租户账户
                            ////记录租户流水账
                            //new_tenantJournalAccount_A0001 = {
                            //    voucher_no : yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.TENANT_ACCOUNT),
                            //    revenue_and_expenditure_type: 'A0001',
                            //    digest: elderly.name + ' ' + new_elderly_journal_account_item_A0001.digest,
                            //    amount: new_elderly_journal_account_item_A0001.amount,
                            //    tenantId: elderly.tenantId
                            //};
                            ////更新租户分类账
                            //tenant.subsidiary_ledger.self += new_tenantJournalAccount_A0001.amount;

                            yield recharge.save();
                            steps = 'A';
                            yield elderly.save();
                            //steps += 'A';
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps) {
                                for (var i = 0; i < steps.length; i++) {
                                    switch (i) {
                                        case 0:
                                            recharge.operated_by = raw_recharge_operated_by;
                                            recharge.operated_by_name = raw_recharge_operated_by_name;
                                            yield recharge.save();
                                            break;
                                        //case 1:
                                        //    elderly.subsidiary_ledger = raw_elderly_subsidiary_ledger;
                                        //    elderly.journal_account = raw_elderly_journal_account;
                                        //    yield elderly.save();
                                        //    break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'disableRechargeAndUnbooking',
                verb: 'post',
                url: this.service_url_prefix + "/disableRechargeAndUnbooking/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var recharge,elderly, tenant;
                        var raw_recharge_status,raw_recharge_operated_by,raw_recharge_operated_by_name;
                        var raw_elderly_subsidiary_ledger, raw_elderly_journal_account;
                        var new_elderly_journal_account_item_A0001;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            recharge = yield app.modelFactory().model_read(app.models['pfta_recharge'], this.params._id);
                            if (!recharge || recharge.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到充值记录!'});
                                yield next;
                                return;
                            }
                            if (!recharge.voucher_no) {
                                this.body = app.wrapper.res.error({message: '充值记录还未记账，无需撤销!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], recharge.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], recharge.tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }

                            var recharge_json = recharge.toObject();
                            var elderly_json = elderly.toObject();
                            console.log('前置检查完成');

                            raw_recharge_status = recharge_json.status;
                            raw_recharge_operated_by = recharge_json.operated_by;
                            raw_recharge_operated_by_name = recharge_json.operated_by_name;
                            //raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                            //raw_elderly_journal_account = app.clone(elderly_json.journal_account);

                            recharge.status = 0;
                            recharge.operated_by = operated_by;
                            recharge.operated_by_name = operated_by_name;

                            var isBookingJournalAccountItemCarryOver = false;
                            var unbookingAmount = 0;
                            var arr_journal_account = elderly.journal_account;
                            for(var i=0;i<arr_journal_account.length;i++) {
                                //此处已经确定是充值，所以不用管是收入还是支出，其必定是收入
                                if (arr_journal_account[i].voucher_no == recharge_json.voucher_no) {
                                    if(arr_journal_account[i].carry_over_flag == false){
                                        unbookingAmount = arr_journal_account[i].amount;
                                    }
                                    else{
                                        isBookingJournalAccountItemCarryOver = true;
                                    }
                                }
                            }

                            if(isBookingJournalAccountItemCarryOver){
                                this.body = app.wrapper.res.error({message: '充值记录记账凭证已经结算，无需撤销!'});
                                yield next;
                                return;
                            }


                            elderly.journal_account = app._.reject(elderly_json.journal_account,{voucher_no : recharge_json.voucher_no});

                            //更新老人分类账
                            elderly.subsidiary_ledger.self -= unbookingAmount;


                            yield recharge.save();
                            steps = 'A';
                            yield elderly.save();
                            //steps += 'A';
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps) {
                                for (var i = 0; i < steps.length; i++) {
                                    switch (i) {
                                        case 0:
                                            recharge.status = raw_recharge_status;
                                            recharge.operated_by = raw_recharge_operated_by;
                                            recharge.operated_by_name = raw_recharge_operated_by_name;
                                            yield recharge.save();
                                            break;
                                        //case 1:
                                        //    elderly.subsidiary_ledger = raw_elderly_subsidiary_ledger;
                                        //    elderly.journal_account = raw_elderly_journal_account;
                                        //    yield elderly.save();
                                        //    break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'changeRechargeBookingAmount',
                verb: 'post',
                url: this.service_url_prefix + "/changeRechargeBookingAmount/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var recharge,elderly, tenant;
                        var raw_recharge_operated_by,raw_recharge_operated_by_name;
                        var raw_elderly_subsidiary_ledger, raw_elderly_journal_account;
                        var new_elderly_journal_account_item_A0001;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            recharge = yield app.modelFactory().model_read(app.models['pfta_recharge'], this.params._id);
                            if (!recharge || recharge.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到充值记录!'});
                                yield next;
                                return;
                            }
                            if (!recharge.voucher_no) {
                                this.body = app.wrapper.res.error({message: '充值记录还未记账，无需撤销!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], recharge.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], recharge.tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }

                            var recharge_json = recharge.toObject();
                            console.log('前置检查完成');

                            raw_recharge_operated_by = recharge_json.operated_by;
                            raw_recharge_operated_by_name = recharge_json.operated_by_name;

                            recharge.operated_by = operated_by;
                            recharge.operated_by_name = operated_by_name;

                            var isBookingJournalAccountItemCarryOver = false;
                            var newBookingAmount =  recharge_json.amount;
                            var oldBookingAmount = 0;
                            var arr_journal_account = elderly.journal_account;
                            for(var i=0;i<arr_journal_account.length;i++) {
                                //此处已经确定是充值，所以不用管是收入还是支出，其必定是收入
                                if (arr_journal_account[i].voucher_no == recharge_json.voucher_no) {
                                    if(arr_journal_account[i].carry_over_flag == false){
                                        oldBookingAmount = arr_journal_account[i].amount;
                                        arr_journal_account[i].amount = newBookingAmount;
                                    }
                                    else{
                                        isBookingJournalAccountItemCarryOver = true;
                                    }
                                }
                            }

                            if(isBookingJournalAccountItemCarryOver){
                                this.body = app.wrapper.res.error({message: '充值记录记账凭证已经结算，无需撤销!'});
                                yield next;
                                return;
                            }

                            //更新老人分类账
                            elderly.subsidiary_ledger.self = elderly.subsidiary_ledger.self - oldBookingAmount + newBookingAmount;


                            yield recharge.save();
                            steps = 'A';
                            yield elderly.save();
                            //steps += 'A';
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps) {
                                for (var i = 0; i < steps.length; i++) {
                                    switch (i) {
                                        case 0:
                                            recharge.status = raw_recharge_status;
                                            recharge.operated_by = raw_recharge_operated_by;
                                            recharge.operated_by_name = raw_recharge_operated_by_name;
                                            yield recharge.save();
                                            break;
                                        //case 1:
                                        //    elderly.subsidiary_ledger = raw_elderly_subsidiary_ledger;
                                        //    elderly.journal_account = raw_elderly_journal_account;
                                        //    yield elderly.save();
                                        //    break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            /**********************订单相关*****************************/
            {
                method: 'completeOrder',//完成订单
                verb: 'post',
                url: this.service_url_prefix + "/completeOrder/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            //1、订单状态从[财务确认收款]到[交易成功]
                            var orderUpdateData = {order_status: 'A1004', success_on: app.moment()};
                            var ret = yield app.modelFactory().update(orderModelOption.model_name, orderModelOption.model_path, this.params._id, orderUpdateData);
                            //2、更新tenant.open_funcs中对应的func.payed和expired_on
                            var order = yield app.modelFactory().read(orderModelOption.model_name, orderModelOption.model_path, this.params._id);
                            var tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, order.tenantId);

                            var order_items = order.order_items;
                            for (var i = 0; i < order_items.length; i++) {
                                var open_func = app._.findWhere(tenant.open_funcs, {func_id: order_items[i].func_id});

                                if(open_func){
                                    //已经存在的功能
                                    var isAfter = app.moment().isAfter(open_func.expired_on);
                                    if (isAfter) {
                                        //已经过期
                                        console.log('isAfter:true');
                                        open_func.expired_on = app.moment().add(order.duration, 'M');
                                    }
                                    else {
                                        //还未过期
                                        console.log('isAfter:false');
                                        open_func.expired_on = app.moment(open_func.expired_on).add(order.duration, 'M');
                                    }
                                }
                                else{
                                    //增加新功能

                                    open_func = app._.omit(order_items[i].toObject(),['_id','check_in_time']);
                                    console.log(order_items[i]);
                                    console.log(open_func);
                                    open_func.expired_on = app.moment().add(order.duration, 'M');


                                    tenant.open_funcs.push(open_func);
                                    //console.log(open_func);
                                    //console.log(tenant.open_funcs);
                                }

                            }
                            yield tenant.save();
                            this.body = app.wrapper.res.ret(orderUpdateData);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'refundOrder',//订单发起退款
                verb: 'post',
                url: this.service_url_prefix + "/refundOrder/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            //1、订单状态从[交易成功]到[等待退款]
                            var orderUpdateData = {order_status: 'A1006', refund_on: app.moment()};
                            var ret = yield app.modelFactory().update(orderModelOption.model_name, orderModelOption.model_path, this.params._id, orderUpdateData);
                            //2、更新tenant.open_funcs中对应的func.payed和expired_on
                            var order = yield app.modelFactory().read(orderModelOption.model_name, orderModelOption.model_path, this.params._id);
                            var tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, order.tenantId);

                            var order_items = order.order_items;
                            for (var i = 0; i < order_items.length; i++) {
                                var open_func = app._.findWhere(tenant.open_funcs, {func_id: order_items[i].func_id});
                                open_func.expired_on = app.moment(open_func.expired_on).subtract(order.duration, 'M');
                            }
                            yield tenant.save();
                            this.body = app.wrapper.res.ret(orderUpdateData);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            /**********************用户密码相关*****************************/
            {
                method: 'userChangePassword',//用户修改密码
                verb: 'post',
                url: this.service_url_prefix + "/userChangePassword/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var user = yield app.modelFactory().read(userModelOption.model_name, userModelOption.model_path, this.params._id);
                            if(!user){
                                this.body = app.wrapper.res.error({message: '无效的用户!'});
                                yield next;
                                return;
                            }
                            var oldPasswordHash = app.crypto.createHash('md5').update(this.request.body.old_password).digest('hex');
                            if(user.password_hash != oldPasswordHash) {
                                this.body = app.wrapper.res.error({message: '旧密码错误!'});
                                yield next;
                                return;
                            }

                            var newPasswordHash = app.crypto.createHash('md5').update(this.request.body.new_password).digest('hex');
                            user.password_hash = newPasswordHash;
                            user.save();
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'resetUserPassword',//管理中心重设用户密码
                verb: 'post',
                url: this.service_url_prefix + "/resetUserPassword/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var user = yield app.modelFactory().read(userModelOption.model_name, userModelOption.model_path, this.params._id);
                            if(!user){
                                this.body = app.wrapper.res.error({message: '无效的用户!'});
                                yield next;
                                return;
                            }
                            console.log('before update');
                            var newPasswordHash = app.crypto.createHash('md5').update('123456').digest('hex');
                            console.log(newPasswordHash);
                            user.password_hash = newPasswordHash;
                            user.save();
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            }
            /*************************************************************/

        ];

        return this;
    }
}.init();
//.init(option);