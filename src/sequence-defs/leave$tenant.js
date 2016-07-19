/**
 * enter$tenant Created by zppro on 16-7-7.
 * Target:用来做外出登记号
 */

var object_type = 'leave';
var object_key = 'tenant';
var prefix = 'WC';//可能需要同步到数据库
var suffix = undefined;//可能需要同步到数据库
var date_period_format = 'YYMM';//可能需要同步到数据库
var min = 1; //可能需要同步到数据库
var max = 99;//可能需要同步到数据库
var step = 1;//可能需要同步到数据库

module.exports = {
    object_type: object_type,
    object_key: object_key,
    prefix: prefix,
    date_period_format: date_period_format,
    //date_period: ctx.moment().format(date_period_format),因为是动态的
    suffix: suffix,
    min: min,
    max: max,
    step: step,
    current: min
};