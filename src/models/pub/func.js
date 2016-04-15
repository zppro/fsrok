/**
 * Created by zppro on 15-12-14.
 */
var _ = require('underscore');
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;


        var funcSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            func_id: {type: String, required: true, index: {unique: true}},
            func_name: {type: String, required: true},
            subsystem_id: {type: String, required: true},
            subsystem_name: {type: String, required: true},
            charge: {type: Number, default: 0.00},//月费
            orderNo: {type: Number, default: 0}
        });

        funcSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, funcSchema, name);
    }
}