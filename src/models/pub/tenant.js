
var mongoose = require('mongoose');
module.isloaded = false;

module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;


        //var open_func_schema = require('./func')(ctx,'pub_func').schema;

        var tenantSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            name: {type: String, required: true, maxlength: 30},
            phone: {type: String, maxlength: 20, unique: true, index: true},
            email: {type: String, maxlength: 30, unique: true, index: true},
            type: {type: String, enum: ctx._.rest(ctx.dictionary.keys["D1002"])},
            active_flag: {type: Boolean, default: false},//开通标志 租户是否可用
            certificate_flag: {type: Boolean, default: false},//认证标志 是否式正式租户
            //terms_validity: {
            //    latest: {type: Date},
            //    history: [{from: {type: Date, required: true}, to: {type: Date}}]
            //},
            validate_util: {type: Date, required: true},
            open_funcs: [{
                check_in_time: {type: Date, default: Date.now},//预开通时间
                func_id: {type: String, required: true},
                func_name: {type: String, required: true},
                subsystem_id: {type: String, required: true},
                subsystem_name: {type: String, required: true},
                charge: {type: Number, default: 0.00},//月费
                orderNo: {type: Number, default: 0},//排序序号
                payed: {type: Boolean, default: false},
                expired_on: {type: Date, default: ctx.moment('1970-01-01T00:00:00+0000')}
            }]
        });

        tenantSchema.pre('update', function (next) {
            this.update({}, {
                $set: {
                    operated_on: new Date()
                }
            });
            next();
        });

        tenantSchema.$$skipPaths = ['open_funcs'];

        return mongoose.model(name, tenantSchema, name);
    }
}