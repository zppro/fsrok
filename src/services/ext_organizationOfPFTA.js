/**
 * ext_organizationOfPFTA Created by zppro on 16-7-12.
 * Target:机构扩展
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

        this.actions = [
            /**********************杂项*****************************/
            /**********************接待管理*****************************/
            {
                method: 'receptionVisiterSyncElderlyFamilyMembers',
                verb: 'post',
                url: this.service_url_prefix + "/receptionVisiterSyncElderlyFamilyMembers/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var reception,elderly;
                        try {
                            reception = yield app.modelFactory().model_read(app.models['pfta_reception'], this.params._id);
                            if (!reception || reception.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到接待记录!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], reception.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            console.log('receptionVisiterSyncElderlyFamilyMembers 前置检查完成');

                            var member;
                            for(var i=0;i< elderly.family_members.length;i++) {
                                if (elderly.family_members[i].name == reception.visit_info.name) {
                                    member = elderly.family_members[i];
                                    break;
                                }
                            }

                            if(!member) {
                                elderly.family_members.push(app._.extend({}, reception.toObject().visit_info));
                            }
                            else{

                                reception.visit_info.id_no && (member.id_no = reception.visit_info.id_no);
                                reception.visit_info.sex && (member.sex = reception.visit_info.sex);
                                reception.visit_info.relation_with && (member.relation_with = reception.visit_info.relation_with);
                                reception.visit_info.phone && (member.phone = reception.visit_info.phone);
                                reception.visit_info.address && (member.address = reception.visit_info.address);
                            }

                            yield elderly.save();

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            /**********************外出管理*****************************/
            {
                method: 'leaveAccompanierSyncElderlyFamilyMembers',
                verb: 'post',
                url: this.service_url_prefix + "/leaveAccompanierSyncElderlyFamilyMembers/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var leave,elderly;
                        try {
                            leave = yield app.modelFactory().model_read(app.models['pfta_leave'], this.params._id);
                            if (!leave || leave.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到外出记录!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], leave.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            console.log('receptionAccompanierSyncElderlyFamilyMembers 前置检查完成');


                            var member;
                            for(var i=0;i< elderly.family_members.length;i++) {
                                if (elderly.family_members[i].name == leave.accompany_info.name) {
                                    member = elderly.family_members[i];
                                    break;
                                }
                            }

                            if(!member) {
                                elderly.family_members.push(app._.extend({}, leave.toObject().accompany_info));
                            }
                            else{

                                leave.accompany_info.id_no && (member.id_no = leave.accompany_info.id_no);
                                leave.accompany_info.sex && (member.sex = leave.accompany_info.sex);
                                leave.accompany_info.relation_with && (member.relation_with = leave.accompany_info.relation_with);
                                leave.accompany_info.phone && (member.phone = leave.accompany_info.phone);
                                leave.accompany_info.address && (member.address = leave.accompany_info.address);
                            }

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