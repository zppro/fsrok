/**
 * Created by zppro on 15-12-10.
 */
var Pub_User_Model = require('../models/pub_user');

module.exports = function (app,options){

    var logger = require('log4js').getLogger(__filename.substr(__filename.lastIndexOf('/')+1));
    if(!logger){
        console.log('logger not loaded in '+__filename);
    }
    else{
        logger.info(__filename);
    }

    return function * (next) {
        ///body {"caller":"主叫号码","callee":"被叫号码"}
        //日志
        logger.info(JSON.stringify(this.request.body));

        console.log(__filename);
        var pub_user = new Pub_User_Model(this.request.body);

        this.body = JSON.stringify(pub_user);

        yield next;
    };
};