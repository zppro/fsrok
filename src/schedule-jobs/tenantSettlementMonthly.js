/**
 * test Created by zppro on 16-7-4.
 * Target:机构月结
 * 参考定时：http://nodeclass.com/articles/78767
 */

var schedule = require('node-schedule');

var job_id = 'tenantSettlementMonthly';
var job_name =  '机构月结';
var printLog = true;

module.exports = {
    needRegister: true,
    register: function (ctx) {
        if (this.needRegister) {

            var job_rule = {hour: 0, minute: 1, date: 1};//每个月第一天的凌晨00：01开始结算
            ctx.jobManger.createJob(job_id, job_name, job_rule, ()=> {
                console.log(ctx.moment().format('HH:mm:ss') + ' ' + job_id + '(' + job_name + ') => executing.');
                ctx.carryOverManager.makeSettlementMonthly().then(function(ret){
                    console.log(ret);
                });
                console.log(ctx.moment().format('HH:mm:ss') + ' ' + job_id + '(' + job_name + ') => executed.');
            }, {printLog: printLog});
        }
        else {
            console.log(job_id + '(' + job_name + ') => skip register.');
        }
    }
}