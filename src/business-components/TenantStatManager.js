/**
 * TenantStatManger Created by zppro on 16-7-29.
 * Target:租客统计管理
 */

var log4js = require('log4js');
var co = require('co');
var statHelper = require('rfcore').factory('statHelper');


module.exports = {
    init: function (ctx) {
        console.log('init TenantStatManger... ');
        this.ctx = ctx;
        return this;
    },
    getAmountOfElderlyLiveIn: function (tenant, logger) {
        var self = this;
        return co(function *() {

            var elderly_totals = yield self.ctx.modelFactory().model_totals(self.ctx.models['pub_elderly'], {
                tenantId: tenant._id,
                status: 1,
                live_in_flag: true
            });

            return elderly_totals.length;
        });
    },
    getAmountOfElderlyLiveInOnCurrentMonth: function (tenant, logger) {
        var self = this;
        return co(function *() {

            var begin = self.ctx.moment(self.ctx.moment().startOf('month').format('YYYY-MM-DD')+" 00:00:00");
            var end = self.ctx.moment(self.ctx.moment().endOf('month').format('YYYY-MM-DD')+" 23:59:59");

            var elderly_totals = yield self.ctx.modelFactory().model_totals(self.ctx.models['pub_elderly'], {
                tenantId: tenant._id,
                status: 1,
                live_in_flag: true,
                enter_on: {"$gte": begin, "$lte": end}
            });

            return elderly_totals.length;
        });
    },
    getAmountOfElderlyLiveInManTime: function (tenant, logger) {
        var self = this;
        return co(function *() {

            var enter_totals = yield self.ctx.modelFactory().model_totals(self.ctx.models['pfta_enter'], {
                tenantId: tenant._id,
                status: 1
            });

            return enter_totals.length;
        });
    },
    getBedInfo: function (tenant, logger) {
        var self = this;
        return co(function *() {

            var arrTotals = yield self.ctx.modelFactory().model_aggregate(self.ctx.models['pfta_room'], [
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
            var totals = arrTotals[0].count;

            var arrLiveIns = yield  self.ctx.modelFactory().model_totals(self.ctx.models['pfta_roomOccupancyChangeHistory'], {
                tenantId: tenant._id,
                in_flag: true
            });
            var liveins = arrLiveIns.length;

            return {
                totals: totals,
                liveins: liveins,
                frees: totals - liveins,
                vacancy_rate: (100 * (totals - liveins) / totals).toFixed(1)
            };
        });
    }
};