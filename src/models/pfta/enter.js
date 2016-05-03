/**
 * Created by zppro on 16-04-20.
 * 养老机构 入院实体
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var enterSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            operated_by: {type: mongoose.Schema.Types.ObjectId},
            operated_by_name: {type: String},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String, required: true, minlength: 21, maxlength: 21, index: {unique: true}},
            enter_on: {type: Date, default: Date.now},
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true},
            elderlyId:{type: mongoose.Schema.Types.ObjectId, required: true},
            current_register_step: {type: String, required: true, enum: ctx._.rest(ctx.dictionary.keys["D3000"])},
            elderly_info_summary: {type: String},
            room_and_board_summary: {type: String},
            service_info_summary: {type: String},
            agent_info:{
                name:{type:String,maxlength:20},
                id_no: {type: String, minlength: 18, maxlength: 18},
                sex:{type: String, minlength: 1, maxlength: 1, enum: ctx._.rest(ctx.dictionary.keys["D1006"])},
                relation_with:{type:String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1012"])},
                phone: {type: String,maxlength: 20},
                home_address:{type:String, maxlength: 100},
                workplace: {type: String, maxlength: 100},
                zip_code:{type: String, maxlength: 6}
            },
            deposit_info: {
                amount: {type: Number, default: 0.00},
                on: {type: Date}
            }
        });

        enterSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        enterSchema.pre('validate', function (next) {
            if (this.code == ctx.modelVariables.SERVER_GEN) {
                //考虑到并发几乎不可能发生，所以将订单编号设定为
                //order.type+[年2月2日2]+6位随机数

                if (this.tenantId) {
                    var tenant = require('./tenant')(ctx, 'pub_tenant').findById(this.tenantId);
                    tenant.needRefreshToken();
                }
                this.code = tenant.token + '-' + ctx.moment().format('YYMMDD') + ctx.rfcore.util.randomN(6);
            }
            next();
        });

        return mongoose.model(name, enterSchema, name);
    }
}