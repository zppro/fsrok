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

        this.actions = [
            {
                method: 'fetch',
                verb: 'get',
                url: this.service_url_prefix + "/T1001/:select",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            this.body = app.wrapper.res.rows(yield app.modelFactory().query('pub_tenant', '../models/pub/tenant',
                                {where: {status: 1}, select: this.params.select || '_id name'}
                            ));
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'fetch',
                verb: 'get',
                url: this.service_url_prefix + "/T1005/:select",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            console.log('--------------> tree/T1005');
                            var distinctTypes = yield app.modelFactory().distinct('pub_order', '../models/pub/order', {select: 'type'});
                            var result = [];
                            var tenantGroupOption = {
                                TP: {
                                    name:'养老机构',
                                    where: {
                                        "type": {"$in": ['A0001', 'A0002', 'A0003']}
                                    }
                                },
                                TA: {
                                    name:'代理商',
                                    where: {
                                        "type": {"$in": ['A1001', 'A1002']}
                                    }
                                }
                            };

                            for(var i=0;i<distinctTypes.length;i++) {
                                var node = {_id: distinctTypes[i], name: tenantGroupOption[distinctTypes[i]].name};
                                node.children = yield app.modelFactory().query('pub_tenant', '../models/pub/tenant',
                                    {
                                        where: app._.defaults(tenantGroupOption[distinctTypes[i]].where, {status: 1}),
                                        select: this.params.select || '_id name'
                                    }
                                );
                                result.push(node);
                            }

                            this.body = app.wrapper.res.rows(result);
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