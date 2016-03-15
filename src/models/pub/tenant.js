
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
            name: {type: String, required: true, maxlength: 30, index: {unique: true}},
            mobile: {type: String, maxlength: 20},
            email: {type: String, maxlength: 30},
            subsystem: {type: String, enum: _.rest(ctx.dictionary.keys["D1001"])},
            type: {type: String, enum: _.rest(ctx.dictionary.keys["D1002"])},
            active_flag: {type: Number, min: 0, max: 1, default: 0},
            certificate_flag:{type: Number, min: 0, max: 1, default: 0}
        });

        tenantSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, tenantSchema, name);
    }
}