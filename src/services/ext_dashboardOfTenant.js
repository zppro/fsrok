/**
 * ext_dashboardOfTenant Created by zppro on 16-7-19.
 * Target:机构扩展
 */
var statHelper = require('rfcore').factory('statHelper');

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
            {
                method: 'liveIn',
                verb: 'get',
                url: this.service_url_prefix + "/liveIn/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield  app.modelFactory().model_read(app.models['pub_tenant'],this.params._id);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            var result = yield app.TenantStatManager.getAmountOfElderlyLiveIn(tenant,self.logger);
                            this.body = app.wrapper.res.ret(result);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'liveInOnCurrentMonth',
                verb: 'get',
                url: this.service_url_prefix + "/liveInOnCurrentMonth/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield  app.modelFactory().model_read(app.models['pub_tenant'],this.params._id);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            var result = yield app.TenantStatManager.getAmountOfElderlyLiveInOnCurrentMonth(tenant,self.logger);
                            this.body = app.wrapper.res.ret(result);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'liveInManTime',
                verb: 'get',
                url: this.service_url_prefix + "/liveInManTime/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield  app.modelFactory().model_read(app.models['pub_tenant'],this.params._id);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }

                            var result = yield app.TenantStatManager.getAmountOfElderlyLiveInManTime(tenant,self.logger);
                            this.body = app.wrapper.res.ret(result);

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'tenantAccountInfo',
                verb: 'get',
                url: this.service_url_prefix + "/tenantAccountInfo/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield  app.modelFactory().model_read(app.models['pub_tenant'],this.params._id);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            this.body = app.wrapper.res.ret(tenant.subsidiary_ledger);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'bedInfo',
                verb: 'get',
                url: this.service_url_prefix + "/bedInfo/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield  app.modelFactory().model_read(app.models['pub_tenant'],this.params._id);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            var bedInfo = yield app.TenantStatManager.getBedInfo(tenant,self.logger);
                            this.body = app.wrapper.res.ret(bedInfo);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'liveinAndAccountAndBedInfo',
                verb: 'get',
                url: this.service_url_prefix + "/liveinAndAccountAndBedInfo/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield  app.modelFactory().model_read(app.models['pub_tenant'],this.params._id);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            var result = {
                                liveIn: yield app.TenantStatManager.getAmountOfElderlyLiveIn(tenant, self.logger),
                                liveInOnCurrentMonth: yield app.TenantStatManager.getAmountOfElderlyLiveInOnCurrentMonth(tenant, self.logger),
                                liveInManTime: yield app.TenantStatManager.getAmountOfElderlyLiveInManTime(tenant, self.logger),
                                account: tenant.subsidiary_ledger,
                                bed: yield app.TenantStatManager.getBedInfo(tenant, self.logger)
                            }
                            this.body = app.wrapper.res.ret(result);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'elderlyAgeGroups',
                verb: 'get',
                url: this.service_url_prefix + "/elderlyAgeGroups/:_id/:start/:step",//start=60,step=10,5
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;
                            var startAge = Number(this.params.start);
                            var step = Number(this.params.step);
                            var endAge = startAge + step * (step == 10 ? 2 : 4);

                            var ageGroups = [];
                            var startGroup = {title: "&lt" + startAge};
                            ageGroups.push(startGroup);

                            for (var i = startAge; i < endAge; i = i + step) {
                                ageGroups.push({title: i + '-' + (i + step - 1)});
                            }
                            var endGroup = {title: "&gte" + endAge};//
                            ageGroups.push(endGroup);


                            var elderlys = yield app.modelFactory().model_query(app.models['pub_elderly'], {
                                where: {
                                    tenantId: tenantId,
                                    status: 1,
                                    live_in_flag: true
                                },
                                select: 'birthday'
                            });

                            for (var i = 0; i < ageGroups.length; i++) {
                                ageGroups[i].value = app._.filter(elderlys, function (o) {
                                    var age = app.moment().diff(o.birthday, 'years');
                                    if (ageGroups[i].title.startsWith('&lt')) {
                                        return age < startAge;
                                    }
                                    else if (ageGroups[i].title.startsWith('&gte')) {
                                        return age >= endAge;
                                    }
                                    else {
                                        var arr = ageGroups[i].title.split('-');
                                        return age >= arr[0] && age < arr[1];
                                    }
                                }).length;
                            }

                            this.body = app.wrapper.res.rows(ageGroups);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'roomVacancyRateMonthly',
                verb: 'get',
                url: this.service_url_prefix + "/roomVacancyRateMonthly/:_id/:start/:end",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;
                            var tenant = yield  app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }

                            var arrTotals = yield app.modelFactory().model_aggregate(app.models['pfta_room'], [
                                {
                                    $match: {
                                        stop_flag: false,
                                        tenantId: tenant._id,
                                        status: 1
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        count: {$sum: '$capacity'}
                                    }
                                },
                                {
                                    $project: {
                                        count: '$count',
                                        _id: 0
                                    }
                                }
                            ]);

                            var s = app.moment(this.params.start);
                            var e = app.moment(this.params.end);

                            var rangeMonth = statHelper.rangeDateAsMonth(s, e);
                            console.log(rangeMonth);
                            yield app.RoomVacancyStatManager.makeTenantSettlementMonthly(tenant, self.logger);
                            var tenantRoomVacancyStatMonthly = yield app.modelFactory().model_query(app.models['pfta_roomVacancyStat'], {
                                where: {
                                    status: 1,
                                    period: 'A0005',//D1015 -月
                                    period_value: {$in: rangeMonth},
                                    tenantId: tenantId
                                }
                                ,
                                select: '-_id period_value amount'
                            });
                            var rows = app._.map(rangeMonth,function(o) {
                                var r = app._.findWhere(tenantRoomVacancyStatMonthly, {period_value: o});

                                return r || {
                                        period_value: o,
                                        amount: 0
                                    };
                            });

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
                method: 'roomCatagoryOfLivein',
                verb: 'get',
                url: this.service_url_prefix + "/roomCatagoryOfLivein/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;
                            var liveins = yield  app.modelFactory().model_totals(app.models['pfta_roomOccupancyChangeHistory'], {
                                tenantId: tenantId,
                                in_flag: true
                            }).populate('roomId','capacity');

                            var roomCatagoryInfo = [];
                            var room_catagories = app.modelVariables.ROOM_CATEGORIES;
                            for(var key in room_catagories) {

                                var catagory = room_catagories[key];
                                var val;
                                if(app._.isArray(catagory)) {
                                    val = app._.reduce(liveins, function (totals, o) {
                                        return totals + (app._.contains(catagory, o.roomId.capacity) ? 1 : 0);
                                    }, 0);
                                }
                                else {
                                    val = app._.reduce(liveins, function (totals, o) {
                                        return totals + (o.roomId.capacity == catagory ? 1 : 0);
                                    }, 0);
                                }

                                roomCatagoryInfo.push({
                                    title: key,
                                    value: val
                                });
                            }

                            this.body = app.wrapper.res.rows(roomCatagoryInfo);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'roomCatagoryOfManTime',
                verb: 'get',
                url: this.service_url_prefix + "/roomCatagoryOfManTime/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;
                            var liveins = yield  app.modelFactory().model_totals(app.models['pfta_roomOccupancyChangeHistory'], {
                                tenantId: tenantId
                            }).populate('roomId','capacity');

                            var roomCatagoryInfo = [];
                            var room_catagories = app.modelVariables.ROOM_CATEGORIES;
                            for(var key in room_catagories) {

                                var catagory = room_catagories[key];
                                var val;
                                if(app._.isArray(catagory)) {
                                    val = app._.reduce(liveins, function (totals, o) {
                                        return totals + (app._.contains(catagory, o.roomId.capacity) ? 1 : 0);
                                    }, 0);
                                }
                                else {
                                    val = app._.reduce(liveins, function (totals, o) {
                                        return totals + (o.roomId.capacity == catagory ? 1 : 0);
                                    }, 0);
                                }

                                roomCatagoryInfo.push({
                                    title: key,
                                    value: val
                                });
                            }

                            this.body = app.wrapper.res.rows(roomCatagoryInfo);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'roomCatagoryOfManTimeMonthly',
                verb: 'get',
                url: this.service_url_prefix + "/roomCatagoryOfManTimeMonthly/:_id/:start/:end",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;

                            var begin = app.moment(app.moment(this.params.start).format('YYYY-MM-DD')+" 00:00:00");
                            var end = app.moment(app.moment(this.params.end).format('YYYY-MM-DD')+" 23:59:59");

                            var liveins = yield  app.modelFactory().model_query(app.models['pfta_roomOccupancyChangeHistory'], {
                                where: {
                                    tenantId: tenantId,
                                    status: 1,
                                    $and: [
                                        {$or: [{in_flag: true}, {check_in_time: {"$lte": end}}]},
                                        {$or: [{in_flag: false}, {check_out_time: {"$gte": begin}}]}
                                    ]
                                },
                                select: 'roomId'
                            }).populate('roomId','capacity');

                            var roomCatagoryInfo = [];
                            var room_catagories = app.modelVariables.ROOM_CATEGORIES;
                            for(var key in room_catagories) {

                                var catagory = room_catagories[key];
                                var val;
                                if(app._.isArray(catagory)) {
                                    val = app._.reduce(liveins, function (totals, o) {
                                        return totals + (app._.contains(catagory, o.roomId.capacity) ? 1 : 0);
                                    }, 0);
                                }
                                else {
                                    val = app._.reduce(liveins, function (totals, o) {
                                        return totals + (o.roomId.capacity == catagory ? 1 : 0);
                                    }, 0);
                                }

                                roomCatagoryInfo.push({
                                    title: key,
                                    value: val
                                });
                            }

                            this.body = app.wrapper.res.rows(roomCatagoryInfo);
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