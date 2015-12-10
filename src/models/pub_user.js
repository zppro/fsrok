/**
 * Created by zppro on 15-12-10.
 */
var mongoose = require('mongoose');
var typeEnum = {"D1000":['A0001', 'A0002', 'A0003']};


var Pub_UserSchema = new mongoose.Schema({
    check_in_time: {type: Date, default: Date.now},
    status: {type: Number, min: 0, max: 1, default: 1},
    code: {type: String, maxlength: 30, index: {unique: true}},
    name: {type: String, maxlength: 30},
    type: {type: String, enum: typeEnum.D1000},
    system_flag: {type: Number, min: 0, max: 1},
    password_hash: String
});

module.exports = mongoose.model('Pub_User_Model', Pub_UserSchema);