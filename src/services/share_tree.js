/**
 * Created by zppro on 15-12-16.
 * 参考字典D1003-预定义树
 */
var _ = require('underscore');

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
                method: 'fetch',
                verb: 'get',
                url: this.service_url_prefix + "/A1001",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            self.logger.info('--------------> tree/A1001');
                            this.body = app.wrapper.res.rows(yield app.modelFactory().query('pub_tenant', '../models/pub/tenant',
                                {where: {status: 1}, select: '_id name'}
                            ));
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