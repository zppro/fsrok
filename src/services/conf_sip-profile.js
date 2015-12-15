/**
 * Created by zppro on 15-12-9.
 */

module.exports = {
    init : function()
    {
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
            this.logger.info(this.file+" loaded!");
        }
        this.actions = [
            {
                method:'create',
                verb:'post',
                url: this.service_url_prefix,
                handler: function (app, options) {
                    return function * (next) {
                        self.logger.info(JSON.stringify(this.request.body));


                        this.body = 'ok';
                        yield next;
                    };
                }
            }
        ];

        return this;
    }
}.init();