/**
 * pub_elderly$journal_account$voucher_no Created by zppro on 16-6-30.
 * Target:pub_elderly.journal_account中voucher_no使用序列的定义(错误的业务理解，已弃用)
 */

var object_type = 'pub_elderly';
var object_key = 'journal_account.voucher_no';
var prefix = 'E';
var suffix = undefined;
var date_period_format = 'YYMM';
var min = 1;
var max = 99999;
var step = 1;

module.exports = {
    disabled: true,
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