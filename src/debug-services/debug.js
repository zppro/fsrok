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
        this.service_url_prefix = '/debug-services/' + this.module_name.split('_').join('/');

        option = option || {};

        this.logger = require('log4js').getLogger(this.filename);

        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        var tenantModelOption = {model_name: 'pub_tenant', model_path: '../models/pub/tenant'};
        var tenantJournalAccountModelOption = {model_name: 'pub_tenantJournalAccount', model_path: '../models/pub/tenantJournalAccount'};
        var districtModelOption = {model_name: 'pfta_district', model_path: '../models/pfta/district'};
        var elderlyModelOption = {model_name: 'pub_elderly', model_path: '../models/pub/elderly'};
        var enterModelOption = {model_name: 'pfta_enter', model_path: '../models/pfta/enter'};
        var roomModelOption = {model_name: 'pfta_room', model_path: '../models/pfta/room'};
        var roomStatusModelOption = {model_name: 'pfta_roomStatus', model_path: '../models/pfta/roomStatus'};
        var roomStatusChangeHistoryModelOption = {model_name: 'pfta_roomStatusChangeHistory', model_path: '../models/pfta/roomStatusChangeHistory'};

        this.actions = [
            {
                method: 'testEach',
                verb: 'get',
                url: this.service_url_prefix + "/testEach",//:select需要提取的字段域用逗号分割 e.g. name,type
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var elderlyId = '573b1592820aeb8d211bc357';
                            var elderly = yield app.modelFactory().read(elderlyModelOption.model_name, elderlyModelOption.model_path, elderlyId);
                            if (!elderly) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }
                            var item_id = 'charge-item.organization-pfta.nursing-s1.SELF-CARE';
                            var charge_item = app._.findWhere(elderly.charge_items, {item_id: item_id});
                            if (charge_item) {
                                console.log(charge_item);
                            }
                            else {
                                console.log('not found');
                            }
                            this.body = app.wrapper.res.ret(charge_item);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'tenantInfo',
                verb: 'get',
                url: this.service_url_prefix + "/tenantInfo/:_id/:select",//:select需要提取的字段域用逗号分割 e.g. name,type
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, this.params._id);
                            var ret = app._.pick(tenant.toObject(),this.params.select.split(','));
                            console.log(ret);
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
                method: 'enterInfoWithPopulate',
                verb: 'get',
                url: this.service_url_prefix + "/enterInfoWithPopulate/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var enter = yield app.modelFactory().read(enterModelOption.model_name, enterModelOption.model_path, this.params._id)
                                .populate('tenantId','-_id name').populate('elderlyId','-_id name');

                            console.log(enter.toObject());
                            this.body = app.wrapper.res.ret(enter);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'rechargeWithPopulate',
                verb: 'get',
                url: this.service_url_prefix + "/rechargeWithPopulate",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            console.log(334);
                            var recharges = yield app.modelFactory().model_query(app.models['pub_recharge'])
                            .populate('elderlyId','name');
                            console.log(334);
                            //console.log(recharges.toObject());
                            this.body = app.wrapper.res.rows(recharges);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'roomStatusInfoWithPopulate',
                verb: 'get',
                url: this.service_url_prefix + "/roomStatusInfoWithPopulate/:tenantId",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var roomStatuses = yield app.modelFactory().model_query(app.models['pfta_roomStatus'], {where: {tenantId: this.params.tenantId}})
                                .populate('tenantId', '-_id name')
                                .populate({
                                    path: 'occupied.elderlyId',
                                    select: 'name'
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
                method: 'expireTenantOpenFuncs',//立即过期用户开通的所有功能
                verb: 'post',
                url: this.service_url_prefix + "/expireTenantOpenFuncs/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, this.params._id);

                            for (var i = 0; i < tenant.open_funcs.length; i++) {
                                tenant.open_funcs[i].expired_on = app.moment();
                            }
                            yield tenant.save();
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
                method: 'test-random-token',//立即过期用户开通的所有功能
                verb: 'get',
                url: this.service_url_prefix + "/testRandomToken",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var rows = [];
                            for (var i = 0; i < 1000; i++) {
                                rows.push(app.uid(6));
                            }
                            console.log(rows.length);
                            rows = app._.uniq(rows);
                            console.log(rows.length);
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
                method: 'test-district-room-tree',//构建区域-房间树
                verb: 'get',
                url: this.service_url_prefix + "/test-district-room-tree",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var tenantId = '56cedebf7768e0eb161e1787';
                            var floorSuffix = 'F';
                            var bedNoSuffix = '#床';
                            var districts = yield app.modelFactory().query(districtModelOption.model_name, districtModelOption.model_path, {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name '
                            });

                            var rooms = yield app.modelFactory().query(roomModelOption.model_name, roomModelOption.model_path, {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name capacity floor districtId'
                            });

                            var districtFloorOfRooms = yield app.modelFactory().query(roomModelOption.model_name, roomModelOption.model_path, {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: '-_id floor districtId'
                            });

                            console.log(1);
                            var roomNameGroupByFloorAndDistrict = app._.chain(rooms).groupBy(function (o) {
                                return o.districtId + '$' + o.floor
                            }).map(function (o,k) {
                                var arr = app._.chain(o).map(function (o2) {
                                    var _idOfFloor = k + '$' + o2.floor;
                                    var nameOfFloor = o2.floor + floorSuffix;
                                    //console.log(roomNameGroupByFloorAndDistrict[_idOfFloor][0]);
                                    var children = app._.chain(app._.range(1, o2.capacity + 1)).map(function (o3) {
                                        return {_id: _idOfFloor + '$' + o3, name: o3 + bedNoSuffix};
                                    }).value();
                                    return {_id: o2._id, name: o2.name, children: children};
                                }).uniq('name').value();
                                var ret = {k: k, v: arr};
                                //console.log(ret);
                                return ret;
                            }).value();

                            console.log(2);
                            //console.log(roomNameGroupByFloorAndDistrict);

                            //districtFloorOfRooms = app._.map(districtFloorOfRooms,function(o){return o.toObject();})
                            //console.log(districtFloorOfRooms);
                            var floorGroupByDistrict = app._.chain(districtFloorOfRooms).groupBy('districtId').map(function (o,k) {
                                var arr = app._.chain(o).map(function (o2) {
                                    var _idOfFloor = k + '$' + o2.floor;
                                    var nameOfFloor = o2.floor+floorSuffix;
                                    var children = (app._.find(roomNameGroupByFloorAndDistrict, function (o3) {
                                        return o3.k == _idOfFloor;
                                    }) || {}).v;
                                    return {_id:_idOfFloor,name:nameOfFloor,children:children};
                                }).uniq('name').value();

                                var ret = {k: k, v: arr};
                                return ret;
                            }).value();

                            console.log(floorGroupByDistrict[0]);
                            //console.log(floorGroupByDistrict[0].children);
                            //console.log('-------------');



                            console.log(3);

                            var rows = app._.map(districts,function(o) {
                                var children = (app._.find(floorGroupByDistrict, function (o2) {
                                    return o2.k == o._id;
                                }) || {}).v;

                                //console.log(children);
                                return {_id: o._id, name: o.name, children: children};
                            });
                            //console.log(rows[0]);
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
                method: 'clearEnter',//构建区域-房间树
                verb: 'delete',
                url: this.service_url_prefix + "/restore-enter-to-uncomplete",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var enterId = '573b1592820aeb8d211bc35d';
                            var tenantJournalAccountItemId = '5743d1da0cd9136520d74dd7';
                            var roomStatusId = '5743d1da0cd9136520d74dd5';
                            var roomStatusChangeHistoryId = '5743d1da0cd9136520d74dd6';

                            var enter = yield app.modelFactory().read(enterModelOption.model_name, enterModelOption.model_path, enterId);
                            if(!enter){
                                this.body = app.wrapper.res.error({message: '无法找到入院记录!'});
                                yield next;
                                return;
                            }

                            var tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, enter.tenantId);
                            if(!tenant){
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }

                            var elderly = yield app.modelFactory().read(elderlyModelOption.model_name, elderlyModelOption.model_path, enter.elderlyId);
                            if(!elderly){
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }


                            //1、重置租户明细账

                            var tenantJournalAccountItem = yield app.modelFactory().read(tenantJournalAccountModelOption.model_name,tenantJournalAccountModelOption.model_path,tenantJournalAccountItemId);
                            tenant.subsidiary_ledger.self -= tenantJournalAccountItem.amount;
                            tenant.save();
                            //2、删除租户流水记录
                            yield app.modelFactory().delete(tenantJournalAccountModelOption.model_name,tenantJournalAccountModelOption.model_path,tenantJournalAccountItemId);


                            //删除房间状态变化信息和房间状态变化历史
                            yield app.modelFactory().delete(roomStatusModelOption.model_name,roomStatusModelOption.model_path,'5743c9089d03a6791cf8e1d1');
                            yield app.modelFactory().delete(roomStatusChangeHistoryModelOption.model_name,roomStatusChangeHistoryModelOption.model_path,'5743c9089d03a6791cf8e1d2');

                            //老人恢复到未入住状态
                            elderly.live_in_flag = false;
                            elderly.enter_code = undefined;
                            elderly.enter_on = undefined;
                            elderly.remark = undefined;
                            //老人流水删除及明细账清空
                            elderly.subsidiary_ledger.self = 0;
                            elderly.journal_account = [];
                            yield elderly.save();

                            //入院记录恢复到财务确认收款
                            enter.current_register_step = 'A0005';
                            yield enter.save();

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
                method: 'transferRoomStatusHistory',//构建区域-房间树
                verb: 'post',
                url: this.service_url_prefix + "/transferRoomStatusHistory",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var districts = yield app.modelFactory().model_query(app.models["pfta_district"]);
                            var rows =  yield app.modelFactory().model_query(app.models["pfta_roomStatusChangeHistory"],{select:'-_id'})
                                .populate('elderlyId','name id_no').populate('roomId','_id districtId floor name');

                            var dictOfDistrict = {};
                            for(var i=0;i<districts.length;i++) {
                                var district = districts[i].toObject();
                                dictOfDistrict[district._id] = district.name;
                            }

                            for(var i=0;i<rows.length;i++) {
                                var row = rows[i].toObject();

                                var entity = {
                                    check_in_time: row.check_in_time,
                                    roomId: row.roomId._id,
                                    room_summary: dictOfDistrict[row.roomId.districtId] + "-"+ row.roomId.floor+'F-'+row.roomId.name+'-'+row.bed_no+'#床',
                                    elderlyId: row.elderlyId._id,
                                    elderly_summary: row.elderlyId.name + ' ' + row.elderlyId.id_no,
                                    in_flag: row.in_flag,
                                    tenantId: row.tenantId
                                };


                                //console.log(entity);
                                yield app.modelFactory().model_create(app.models["pfta_roomOccupancyChangeHistory"], entity);
                            }

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
                method: 'testCopyBirthday',
                verb: 'post',
                url: this.service_url_prefix + "/testCopyBirthday",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var elderly = yield app.modelFactory().model_read(app.models["pub_elderly"],'573b1592820aeb8d211bc357');
                            var exit = yield app.modelFactory().model_read(app.models["pfta_exit"],'57678c195b4198b123c146d3');

                            exit.elderly_birthday = elderly.birthday;
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
                method: 'modifyNormalFlag',
                verb: 'post',
                url: this.service_url_prefix + "/modifyNormalFlag",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            //var tenantJournalAccounts = yield app.modelFactory().model_query(app.models["pub_tenantJournalAccount"]);
                            //for (var i = 0; i < tenantJournalAccounts.length; i++) {
                            //    tenantJournalAccounts[i].red_flag = false;
                            //    tenantJournalAccounts[i].normal_flag = undefined;
                            //    yield tenantJournalAccounts[i].save();
                            //}
                            //var elderlys = yield app.modelFactory().model_query(app.models["pub_elderly"], {where: {status: 1}});
                            //for (var i = 0; i < elderlys.length; i++) {
                            //
                            //    var journal_accounts = elderlys[i].journal_account;
                            //
                            //    for (var j = 0; j < journal_accounts.length; j++) {
                            //        journal_accounts[j].red_flag = false;
                            //        journal_accounts[j].normal_flag = undefined;
                            //    }
                            //    yield elderlys[i].save();
                            //}

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
                method: 'transferPftaToPub',
                verb: 'post',
                url: this.service_url_prefix + "/transferPftaToPub",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var recharges = yield app.modelFactory().model_query(app.models["pfta_recharge"]);
                            for (var i = 0; i < recharges.length; i++) {

                                var data = recharges[i].toObject();
                                //data._id = undefined;

                                console.log(data);

                                yield app.modelFactory().model_create(app.models["pub_recharge"],data);
                            }

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
                method: 'checkCanBookingRed',//检查是否是系统内部记账，如果是则需要在前台做好提醒不需要冲红，但不强制禁止冲红
                verb: 'post',
                url: this.service_url_prefix + "/checkCanBookingRed/:voucher_no_to_red",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var recharge_to_red,tenantJournalAccount_to_red, tenant;

                        try {
                            var tenantId = this.request.body.tenantId;
                            var voucher_no_to_red = this.params.voucher_no_to_red;

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            console.log('前置检查完成');

                            recharge_to_red = yield app.modelFactory().model_one(app.models['pub_recharge'], {
                                where: {
                                    status: 1,
                                    voucher_no: voucher_no_to_red,
                                    tenantId: tenantId
                                }
                            });

                            tenantJournalAccount_to_red = yield app.modelFactory().model_one(app.models['pub_tenantJournalAccount'], {
                                where: {
                                    status: 1,
                                    voucher_no: voucher_no_to_red,
                                    tenantId: tenantId
                                }
                            });


                            var can_not_find_recharge_to_red = !recharge_to_red || recharge_to_red.status == 0;
                            var can_not_find_tenantJournalAccount_to_red = !tenantJournalAccount_to_red || tenantJournalAccount_to_red.status == 0;

                            if (can_not_find_recharge_to_red && can_not_find_tenantJournalAccount_to_red) {

                                this.body = app.wrapper.res.error({message: '无法找到需要冲红的流水记录!'});
                                yield next;
                                return;
                            }

                            if(!can_not_find_recharge_to_red){
                                elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], recharge_to_red.elderlyId);
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

                                var journal_account = elderly.journal_account;
                                for(var i=0;i<journal_account.length;i++){
                                    if(journal_account[i].voucher_no == voucher_no_to_red && !journal_account[i].carry_over_flag)
                                    {
                                        this.body = app.wrapper.res.error({message: '当前充值流水没有结转，无法冲红，可以修改或删除!'});
                                        yield next;
                                        return;
                                    }
                                }
                            }

                            this.body = app.wrapper.res.ret({itCan: true, isSystemInnerBooking: !can_not_find_tenantJournalAccount_to_red});
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                        }
                        yield next;
                    };
                }
            },
            {
                method: 'initTenantBIZData',
                verb: 'post',
                url: this.service_url_prefix + "/initTenantBIZData/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], this.params._id);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }

                            tenant.general_ledger = 0;
                            tenant.subsidiary_ledger && (tenant.subsidiary_ledger.self = tenant.subsidiary_ledger.gov_subsidy = tenant.subsidiary_ledger.social_donation = 0);

                            yield tenant.save();

                            yield app.modelFactory().model_bulkDelete(app.models['pub_tenantJournalAccount'], {tenantId: this.params._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pub_elderly'], {tenantId: tenant._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pfta_roomStatus'], {tenantId: tenant._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pfta_roomOccupancyChangeHistory'], {tenantId: tenant._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pub_recharge'], {tenantId: tenant._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pfta_exit'], {tenantId: tenant._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pfta_enter'], {tenantId: tenant._id});


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
                method: 'restoreElderlyChargeItems',
                verb: 'post',
                url: this.service_url_prefix + "/restoreElderlyChargeItems",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var elderlyId = '578880020ce2869913ea2de3';
                            var elderly = yield app.modelFactory().read(elderlyModelOption.model_name, elderlyModelOption.model_path, elderlyId);
                            if (!elderly) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            //恢复的收费项目
                            elderly.charge_items.push({
                                item_id: 'charge-item.organization-pfta.board-s1.NUTRITION',
                                item_name: '营养餐',
                                period_price: 200,
                                period: 'A0005'
                            });

                            elderly.charge_items.push({
                                item_id: 'charge-item.organization-pfta.room-s1.DOMITORY-ROOM',
                                item_name: '多人间',
                                period_price: 300,
                                period: 'A0005'
                            });

                            elderly.charge_items.push({
                                item_id: 'charge-item.organization-pfta.nursing-s1.SELF-CARE',
                                item_name: '自理老人',
                                period_price: 0,
                                period: 'A0005'
                            });

                            yield elderly.save();

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            }
        ];


        return this;
    }
}.init();
//.init(option);