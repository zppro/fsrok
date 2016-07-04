/**
 * test Created by zppro on 16-6-29.
 * Target:测试日程安排
 * 参考定时：http://nodeclass.com/articles/78767
 */

var schedule = require('node-schedule');

var job_id = 'test';
var job_name =  '测试计划任务';
var job_rule = new schedule.RecurrenceRule();
var printLog = false;

module.exports = {
    needRegister: false,
    register: function (ctx) {
        if (this.needRegister) {
            console.log(job_id + '(' + job_name + ') => is registered.');
            job_rule.second = ctx._.range(1, 60);//每秒执行
            ctx.jobManger.createJob(job_id, job_name, job_rule, ()=> {
                console.log(ctx.moment().format('HH:mm:ss') + ' ' + job_id + '(' + job_name + ') => executed.');
            }, {printLog: printLog});
        }
        else {
            console.log(job_id + '(' + job_name + ') => skip register.');
        }
    }
}