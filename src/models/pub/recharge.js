/**
 * recharge Created by zppro on 16-6-27.
 * Target:老人 充值记录
 */

var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var rechargeSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            operated_by: {type: mongoose.Schema.Types.ObjectId},
            operated_by_name: {type: String},
            status: {type: Number, min: 0, max: 1, default: 1},
            enter_code: {type: String, required: true, minlength: 6, maxlength: 6},
            elderlyId:{type: mongoose.Schema.Types.ObjectId, required: true,ref:'pub_elderly'},
            elderly_name: {type: String, required: true, maxlength: 20},
            type:{type: String, minlength: 5, maxlength: 5, required: true, enum: ctx._.rest(ctx.dictionary.keys["D3005"])},
            amount:{type: Number, default: 0.00},
            voucher_no:{type: String},//记账凭证 对应elderly.journal_account
            remark: {type: String,maxLength:400},
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true,ref:'pub_tenant'}
        });


        rechargeSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        //rechargeSchema.virtual('voucher_no_carray_over_flag', {
        //    ref: 'pub_tenantJournalAccount', // The model to use
        //    localField: 'voucher_no', // Find people where `localField`
        //    foreignField: 'voucher_no' // is equal to `foreignField`
        //});


        return mongoose.model(name, rechargeSchema, name);
    }
}