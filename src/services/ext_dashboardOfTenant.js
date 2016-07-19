/**
 * ext_dashboardOfTenant Created by zppro on 16-7-19.
 * Target:机构扩展
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

        this.actions = [
            {
                method: 'livein',
                verb: 'get',
                url: this.service_url_prefix + "/livein/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;
                            var elderly_counts = yield  app.modelFactory().model_totals(app.models['pub_elderly'], {
                                tenantId: tenantId,
                                status: 1,
                                live_in_flag: true
                            });

                            this.body = app.wrapper.res.ret(elderly_counts);
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