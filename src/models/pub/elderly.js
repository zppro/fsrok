/**
 * elderly Created by zppro on 16-4-21.
 * Target:老人实体
 */
var mongoose = require('mongoose');
module.isloaded = false;

module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        //这里不同租户下的老人应该是互相隔离的，因此不同租户的老人身份证号可以相同，但同一租户的老人身份证号不能相同
        var elderlySchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            operated_by: {type: mongoose.Schema.Types.ObjectId},
            operated_by_name: {type: String},
            status: {type: Number, min: 0, max: 1, default: 1},
            name: {type: String, required: true, maxlength: 20},
            id_no: {type: String, required: true, minlength: 18, maxlength: 18},
            sex: {type: String, required: true, minlength: 1, maxlength: 1, enum: ctx._.rest(ctx.dictionary.keys["D1006"])},
            birthday: {type: Date, required: true},
            marriage: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1007"])},
            home_address:{type:String, required: true, maxlength: 100},
            family_members: [{
                name:{type:String,required: true,maxlength:20},
                sex:{type: String, required: true, minlength: 1, maxlength: 1, enum: ctx._.rest(ctx.dictionary.keys["D1006"])},
                relation_with:{type:String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1012"])},
                phone: {type: String, required: true,maxlength: 20 },
                address:{type:String, maxlength: 100}
            }],
            medical_insurance: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1008"])},
            politics_status: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1009"])},
            inhabit_status: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1010"])},
            financial_status: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1011"])},
            hobbies:[String],//字典D1013
            medical_histories:[String],//字典D1014
            board_summary: {type: String, required: true},
            room_value: {
                districtId: {type: String},
                roomId: {type:  mongoose.Schema.Types.ObjectId},
                bed_no: {type: Number, min: 1}
            },
            room_summary: {type: String},//districtName-roomName-bedNo
            nursing_summary: {type: String, required: true},
            charge_standard: {type: String, required: true},
            charge_items:[{
                item_id: {type: String, required: true},
                item_name: {type: String, required: true},
                period_price: {type: Number, default: 0.00},
                period: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1015"])}
            }],
            live_in_flag: {type: Boolean, default: false},//在院标志,只有该标志为true才是有效的入住老人,正式入院后改为true,出院后又改为false
            enter_code:{type: String, minlength: 6, maxlength: 6},//入院登记号,正式入院后从入院单中复制过来
            enter_on: {type: Date},//入院时间
            begin_exit_flow:{type: Boolean},//开始出院流程，申请出院后设置为true,真正出院后设置为false
            exit_on: {type: Date},//出院时间
            remark: {type: String,maxLength:400},//如果为空则正式入院后从入院单中复制过来
            general_ledger:{type: Number, default: 0.00},//一般在通过流水月结转
            subsidiary_ledger:{
                self:{type: Number, default: 0.00},//自费账户
                gov_subsidy:{type: Number, default: 0.00} //政府补助
            },
            journal_account:[{
                voucher_no:{type: String},
                revenue_and_expenditure_type: {type: String, minlength: 5, maxlength: 5, required: true, enum: ctx._.rest(ctx.dictionary.keys["D3002"])},
                digest: {type: String, required: true},//具体项目摘要
                check_in_time: {type: Date, default: Date.now},
                carry_over_flag:{type: Boolean,default: false},//结转标志 true-已结转 false-未结转
                red_flag:{type: Boolean,default: false},//冲红标志 true-冲红流水 false-正常流水
                amount:{type: Number, default: 0.00}
            }],
            charge_item_change_history:[{
                check_in_time: {type: Date, default: Date.now},
                charge_item_catalog_id:{type:String,required: true},
                old_item_id: {type: String, required: true},
                old_item_name: {type: String, required: true},
                old_period_price: {type: Number, default: 0.00},
                old_period: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1015"])},
                new_item_id: {type: String, required: true},
                new_item_name: {type: String, required: true},
                new_period_price: {type: Number, default: 0.00},
                new_period: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1015"])}
            }],
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pub_tenant'}
        });

        elderlySchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        elderlySchema.pre('validate', function (next) {
            //身份证检测
            next();
        });

        elderlySchema.$$skipPaths = ['family_members', 'room_value','charge_items','subsidiary_ledger','journal_account','charge_item_change_history'];

        return mongoose.model(name, elderlySchema, name);
    }
}
