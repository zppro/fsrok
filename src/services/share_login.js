/**
 * Created by zppro on 15-12-16.
 */
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
module.exports = {
    init: function () {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/services/' + this.module_name.split('_').join('/');

        this.logger = require('log4js').getLogger(this.filename);
        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        this.actions = [
            {
                method: 'signin',
                verb: 'post',
                url: this.service_url_prefix + "/signin",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var modelOption = self.getModelOption(this);
                            var passwordHash = crypto.createHash('md5').update(this.request.body.password).digest('hex');
                            var user = yield app.modelFactory().one(modelOption.model_name, modelOption.model_path, {
                                where: {
                                    code: this.request.body.code,
                                    password_hash: passwordHash,
                                    status: 1
                                }, select: "code name"
                            });

                            if (user != null) {
                                //日期字符 保证token当日有效
                                // sign with default (HMAC SHA256)
                                var token = jwt.sign(user, app.conf.secure.authSecret + ':' + (new Date().f('yyyy-MM-dd').toString()));
                                console.log(token);
                                /*
                                 var objectId = new require('mongoose').Types.ObjectId().toString().substr(12);
                                 console.log(objectId.length);

                                 var nounce = crypto.createHash('md5').update(objectId).digest('hex');
                                 console.log(nounce);
                                 */
                                this.body = token;// app.wrapper.res.ret(yield app.modelFactory().create(modelOption.model_name, modelOption.model_path, this.request.body));
                            }
                            else {
                                this.body = app.wrapper.res.error({message: '无效的的登录名密码!'});
                            }

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'signout',
                verb: 'post',
                url: this.service_url_prefix + "/signout",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var modelOption = self.getModelOption(this);
                            this.body = app.wrapper.res.ret(yield app.modelFactory().create(modelOption.model_name, modelOption.model_path, this.request.body));
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            }
        ];

        return this;
    },
    getModelOption: function (ctx) {
        var modelName = 'pub_user';
        var modelPath = '../models/' + modelName.split('_').join('/');
        return {model_name: modelName, model_path: modelPath};
    }
}.init();