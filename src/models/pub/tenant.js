
var _ = require('underscore');
var mongoose = require('mongoose');
module.isloaded = false;

module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var tenantSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            name: {type: String, required: true, maxlength: 30},
            phone: {type: String, maxlength: 20, unique: true, index: true},
            email: {type: String, maxlength: 30, unique: true, index: true},
            type: {type: String, enum: _.rest(ctx.dictionary.keys["D1002"])},
            active_flag: {type: Boolean, default: false},//开通标志 租户是否可用
            certificate_flag: {type: Boolean, default: false},//认证标志 是否式正式租户
            terms_validity: {
                latest: {type: Date},
                history: [{from: {type: Date, required: true}, to: {type: Date}}]
            }
        });

        tenantSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, tenantSchema, name);
    }
}