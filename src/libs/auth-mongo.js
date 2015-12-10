/**
 * Created by zppro on 15-12-9.
 */

'use strict';
var crypto = require('crypto');
var jwt = require('jsonwebtoken');


module.exports = function auth(app){
    return function * () {


        var passwordHash = crypto.createHash('md5').update(this.request.body.Password).digest('hex');
        var sqlStr = 'select * from Pub_User where UserCode=\'' + this.request.body.UserCode + '\' and PasswordHash=\'' + passwordHash + '\'';

        var recordset = {"userId":"test","userName":"测试"};

        if (recordset != null) {
            var token = jwt.sign({userId: recordset.UserId, userName: recordset.UserName}, app.conf.secure.authSecret);
            console.log('token:' + token);
            this.body = token;
        }
        else {
            this.body = 'UnAuthorized!';
            this.status = 401;
            return;
        }
    };
};