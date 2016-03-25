/**
 * Created by zppro on 15-12-10.
 * 操作多个model
 */
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
                method: 'create',
                verb: 'post',
                url: this.service_url_prefix + "/:model",
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
            },
            {
                method: 'read',
                verb: 'get',
                url: this.service_url_prefix + "/:model/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var _id = this.params._id;
                            var modelOption = self.getModelOption(this);
                            if (_id == '$one') {
                                //console.log(yield app.modelFactory().one(modelOption.model_name, modelOption.model_path, {
                                //    where: this.query,
                                //    select: '_id '
                                //}));
                                var theOne = yield app.modelFactory().one(modelOption.model_name, modelOption.model_path, {
                                    where: this.query,
                                    select: '_id '
                                });
                                if(theOne){
                                    this.body = app.wrapper.res.ret(theOne);
                                }
                                else {
                                    this.body = app.wrapper.res.ret({_id: null});
                                }
                            }
                            else {
                                this.body = app.wrapper.res.ret(yield app.modelFactory().read(modelOption.model_name, modelOption.model_path, _id));
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
                method: 'update',
                verb: 'put',
                url: this.service_url_prefix + "/:model/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var modelOption = self.getModelOption(this);
                            var ret = yield app.modelFactory().update(modelOption.model_name, modelOption.model_path, this.params._id, this.request.body);
                            this.body = app.wrapper.res.ret(ret);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'delete',
                verb: 'delete',
                url: this.service_url_prefix + "/:model/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var modelOption = self.getModelOption(this);
                            this.body = app.wrapper.res.ret(yield app.modelFactory().delete(modelOption.model_name, modelOption.model_path, this.params._id));
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'list',
                verb: 'get',
                url: this.service_url_prefix + "/:model",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var modelOption = self.getModelOption(this);
                            this.body = app.wrapper.res.rows(yield app.modelFactory().query(modelOption.model_name, modelOption.model_path));
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'query',
                verb: 'post',
                url: this.service_url_prefix + "/:model/$query",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var modelOption = self.getModelOption(this);
                            this.body = app.wrapper.res.rows(yield app.modelFactory().query(modelOption.model_name, modelOption.model_path, this.request.body));
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'totals',
                verb: 'post',
                url: this.service_url_prefix + "/:model/$totals",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var modelOption = self.getModelOption(this);
                            this.body = app.wrapper.res.ret({totals: (yield app.modelFactory().totals(modelOption.model_name, modelOption.model_path, this.request.body)).length});
                            //this.set('page-totals', 10);response head set
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
        var modelName = ctx.params.model.split('-').join('_');//将 A-B改为A_B
        var modelPath = '../models/' + modelName.split('_').join('/');
        return {model_name: modelName, model_path: modelPath};
    }
}.init();

