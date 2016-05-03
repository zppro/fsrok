/**
 * elderly Created by zppro on 16-4-21.
 * Target:老人实体
 */


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
                name:{type:String,maxlength:20},
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
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true},
            remark: {type: String,maxLength:400}
        });

        elderlySchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        elderlySchema.pre('validate', function (next) {
            //身份证检测
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
