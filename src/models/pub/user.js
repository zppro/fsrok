/**
 * Created by zppro on 15-12-14.
 */

var mongoose = require('mongoose');
module.typeEnums = {"D1000":['A0001', 'A0002', 'A0003']};
module.isloaded = false;

var userSchema =  new mongoose.Schema({
    check_in_time: {type: Date, default: Date.now},
    operated_on: {type: Date, default: Date.now},
    status: {type: Number, min: 0, max: 1, default: 1},
    code: {type: String, required: true, maxlength: 30, index: {unique: true}},
    name: {type: String, required: true, maxlength: 30},
    type: {type: String, enum: module.typeEnums.D1000},
    system_flag: {type: Number, min: 0, max: 1},
    password_hash: String
});

userSchema.pre('update', function (next) {
    this.update({},{ $set: { operated_on: new Date() } });
    next();
});

module.exports = function(path) {
    if (module.isloaded) {
        return mongoose.model(path);
    }
    else {
        module.isloaded = true;
        return mongoose.model(path, userSchema, path);
    }
}