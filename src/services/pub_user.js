/**
 * Created by zppro on 15-12-10.
 * 操作自身model
 */

module.exports = {
    init : function()
    {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/services/' + this.module_name.split('_').join('/');
        this.model_path = '../models/' + this.module_name.split('_').join('/');

        this.logger = require('log4js').getLogger(this.filename);
        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file+" loaded!");
        }



        this.actions = [
            {
                method:'create',
                verb:'post',
                url: this.service_url_prefix,
                handler: function (app, options) {
                    return function * (next) {
                        try{
                            var ret = yield app.modelFactory().create(self.module_name,self.model_path,this.request.body);
                            this.body = app.wrapper.res.ret(ret);
                            console.log(this.body);
                        }catch(e){
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method:'update',
                verb:'put',
                url: this.service_url_prefix+"/:id",
                handler: function (app, options) {
                    return function * (next) {
                        self.logger.info(JSON.stringify(this.request.body));

                        var pub_user = new Pub_User_Model(this.request.body);
                        this.body = pub_user;
                        yield next;
                    };
                }
            },
            {
                method:'delete',
                verb:'delete',
                url: this.service_url_prefix,
                handler: function (app, options) {
                    return function * (next) {
                        self.logger.info(JSON.stringify(this.request.body));

                        var pub_user = new Pub_User_Model(this.request.body);
                        this.body = JSON.stringify(pub_user);
                        yield next;
                    };
                }
            },
            {
                method:'read',
                verb:'get',
                url: this.service_url_prefix,
                handler: function (app, options) {
                    return function * (next) {
                        self.logger.info(JSON.stringify(this.request.body));

                        var pub_user = new Pub_User_Model(this.request.body);
                        this.body = JSON.stringify(pub_user);
                        yield next;
                    };
                }
            }
        ];

        return this;
    }
}.init();

