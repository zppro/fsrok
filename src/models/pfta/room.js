/**
 * Created by zppro on 16-04-19.
 * 养老机构 房间实体（楼房）
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var roomSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            name: {type: String, required: true, maxlength: 30},
            floor: {type: Number, min: -99, max: 99},
            number_in_floor: {type: Number, min: 1, max: 99},
            capacity: {type: Number, required: true, min: 1},
            stop_flag: {type: Boolean, default: false},
            districtId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pfta_district'},
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pub_tenant'}
        });

        roomSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, roomSchema, name);
    }
}