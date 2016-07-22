/**
 * ext_dashboardOfTenant Created by zppro on 16-7-19.
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
            {
                method: 'liveIn',
                verb: 'get',
                url: this.service_url_prefix + "/liveIn/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;
                            var elderly_counts = yield  app.modelFactory().model_totals(app.models['pub_elderly'], {
                                tenantId: tenantId,
                                status: 1,
                                live_in_flag: true
                            });

                            this.body = app.wrapper.res.ret(elderly_counts);
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
                            var tenantId = this.params._id;
                            var begin = app.moment(app.moment().startOf('month').format('YYYY-MM-DD')+" 00:00:00");
                            var end = app.moment(app.moment().endOf('month').format('YYYY-MM-DD')+" 23:59:59");

                            var elderly_totals = yield  app.modelFactory().model_totals(app.models['pub_elderly'], {
                                tenantId: tenantId,
                                status: 1,
                                live_in_flag: true,
                                enter_on: {"$gte": begin, "$lte": end}
                            });

                            this.body = app.wrapper.res.ret(elderly_totals);
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
                            var tenantId = this.params._id;

                            var enter_totals = yield  app.modelFactory().model_totals(app.models['pfta_enter'], {
                                tenantId: tenantId,
                                status: 1
                            });

                            this.body = app.wrapper.res.ret(enter_totals);
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
                            var startAge = this.params.start;
                            var step = this.params.step;
                            var endAge = startAge + step * (step == 10 ? 2 : 4);

                            var ageGroups = [];
                            var startGroup = {title: "&lte" + startAge};
                            ageGroups.push(startGroup);
                            for (var i = startAge; i < endGroup; i = i + step) {
                                ageGroups.push(startGroup);
                            }
                            var endGroup = {title: "&gt" + endAge};//
                            ageGroups.push({title: (i + 1) + '-' + (i + step)});

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
                                    if (ageGroups[i].title.startsWith('&lte')) {
                                        return age <= startAge;
                                    }
                                    else if (ageGroups[i].title.startsWith('&gt')) {
                                        return age > endAge;
                                    }
                                    else {
                                        var arr = ageGroups[i].title.split('-');
                                        return age >= arr[0] && age <= arr[1];
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
                method: 'bedInfo',
                verb: 'get',
                url: this.service_url_prefix + "/bedInfo/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;

                            var rooms = yield  app.modelFactory().model_query(app.models['pfta_room'], {
                                where: {
                                    tenantId: tenantId,
                                    status: 1
                                },
                                select: 'capacity'
                            });

                            var totals = 0;
                            for (var i = 0; i < rooms.length; i++) {
                                totals += rooms[i].capacity;
                            }

                            var liveins = yield  app.modelFactory().model_totals(app.models['pfta_roomOccupancyChangeHistory'], {
                                tenantId: tenantId,
                                in_flag: true,
                                status: 1
                            });

                            var bedInfo = {
                                totals: totals,
                                liveins: liveins,
                                frees: totals - liveins,
                                vacancy_rate: (100 * (totals - liveins) / totals).toFixed(2)
                            };

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
                method: 'vacancyRateMonthly?',
                verb: 'get',
                url: this.service_url_prefix + "/vacancyRateMonthly/:_id/:start/:end",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;

                            var rooms = yield  app.modelFactory().model_query(app.models['pfta_room'], {
                                where: {
                                    tenantId: tenantId,
                                    status: 1
                                },
                                select: 'capacity'
                            });

                            //（入住房间天数/月度天数）*

                            var totals = 0;
                            for (var i = 0; i < rooms.length; i++) {
                                totals += rooms[i].capacity;
                            }

                            var liveins = yield  app.modelFactory().model_totals(app.models['pfta_roomOccupancyChangeHistory'], {
                                tenantId: tenantId,
                                in_flag: true,
                                status: 1
                            });

                            var bedInfo = {
                                totals: totals,
                                liveins: liveins,
                                frees: totals - liveins,
                                vacancy_rate: (100 * (totals - liveins) / totals).toFixed(2)
                            };

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
                method: 'tenantAccountInfo?',
                verb: 'get',
                url: this.service_url_prefix + "/tenantAccountInfo/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;

                            var tenant = yield  app.modelFactory().model_read(app.models['pub_tenant'],tenantId);
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
                method: 'roomCatagory',
                verb: 'get',
                url: this.service_url_prefix + "/roomCatagory/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;
                            var liveins = yield  app.modelFactory().model_totals(app.models['pfta_roomOccupancyChangeHistory'], {
                                tenantId: tenantId,
                                in_flag: true,
                                status: 1
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
                method: 'roomCatagoryMonthly',
                verb: 'get',
                url: this.service_url_prefix + "/roomCatagoryMonthly/:_id/:start/:end",
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
                                select: 'capacity'
                            });

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
                method: 'roomCatagoryManTime',
                verb: 'get',
                url: this.service_url_prefix + "/roomCatagoryManTime/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;
                            var liveins = yield  app.modelFactory().model_totals(app.models['pfta_roomOccupancyChangeHistory'], {
                                tenantId: tenantId,
                                status: 1
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