/**
 * Created by zppro on 15-12-16.
 * 参考字典D1003-预定义树
 */

module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/services/' + this.module_name.split('_').join('/');

        option = option || {};

        this.logger = require('log4js').getLogger(this.filename);

        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        var tenantModelOption = {model_name: 'pub_tenant', model_path: '../models/pub/tenant'};

        this.actions = [
            {
                method: 'expireTenantOpenFuncs',//立即过期用户开通的所有功能
                verb: 'post',
                url: this.service_url_prefix + "/expireTenantOpenFuncs/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, this.params._id);

                            for (var i = 0; i < tenant.open_funcs.length; i++) {
                                tenant.open_funcs[i].expired_on = app.moment();
                            }
                            yield tenant.save();
                            this.body = app.wrapper.res.default();
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
    }
}.init();
//.init(option);