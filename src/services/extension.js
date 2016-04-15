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


        var orderModelOption = {model_name: 'pub_order', model_path: '../models/pub/order'};
        var tenantModelOption = {model_name: 'pub_tenant', model_path: '../models/pub/tenant'};
        var userModelOption = {model_name: 'pub_user', model_path: '../models/pub/user'};

        this.actions = [
            {
                method: 'completeOrder',//完成订单
                verb: 'post',
                url: this.service_url_prefix + "/completeOrder/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            //1、订单状态从[财务确认收款]到[交易成功]
                            var orderUpdateData = {order_status: 'A1004', success_on: app.moment()};
                            var ret = yield app.modelFactory().update(orderModelOption.model_name, orderModelOption.model_path, this.params._id, orderUpdateData);
                            //2、更新tenant.open_funcs中对应的func.payed和expired_on
                            var order = yield app.modelFactory().read(orderModelOption.model_name, orderModelOption.model_path, this.params._id);
                            var tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, order.tenantId);

                            var order_items = order.order_items;
                            for (var i = 0; i < order_items.length; i++) {
                                var open_func = app._.findWhere(tenant.open_funcs, {func_id: order_items[i].func_id});
                                open_func.payed = true;
                                open_func.expired_on = app.moment().add(order.duration, 'M');
                            }
                            yield tenant.save();
                            this.body = app.wrapper.res.ret(orderUpdateData);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'refundOrder',//订单发起退款
                verb: 'post',
                url: this.service_url_prefix + "/refundOrder/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            //1、订单状态从[交易成功]到[等待退款]
                            var orderUpdateData = {order_status: 'A1006', refund_on: app.moment()};
                            var ret = yield app.modelFactory().update(orderModelOption.model_name, orderModelOption.model_path, this.params._id, orderUpdateData);
                            //2、更新tenant.open_funcs中对应的func.payed和expired_on
                            var order = yield app.modelFactory().read(orderModelOption.model_name, orderModelOption.model_path, this.params._id);
                            var tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, order.tenantId);

                            var order_items = order.order_items;
                            for (var i = 0; i < order_items.length; i++) {
                                var open_func = app._.findWhere(tenant.open_funcs, {func_id: order_items[i].func_id});
                                open_func.payed = false;
                                open_func.expired_on = app.moment().add(-1, 'h');
                            }
                            yield tenant.save();
                            this.body = app.wrapper.res.ret(orderUpdateData);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'userChangePassword',//用户修改密码
                verb: 'post',
                url: this.service_url_prefix + "/userChangePassword/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var user = yield app.modelFactory().read(userModelOption.model_name, userModelOption.model_path, this.params._id);
                            if(!user){
                                this.body = app.wrapper.res.error({message: '无效的用户!'});
                                yield next;
                                return;
                            }
                            var oldPasswordHash = app.crypto.createHash('md5').update(this.request.body.old_password).digest('hex');
                            if(user.password_hash != oldPasswordHash) {
                                this.body = app.wrapper.res.error({message: '旧密码错误!'});
                                yield next;
                                return;
                            }

                            var newPasswordHash = app.crypto.createHash('md5').update(this.request.body.new_password).digest('hex');
                            user.password_hash = newPasswordHash;
                            user.save();
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'resetUserPassword',//管理中心重设用户密码
                verb: 'post',
                url: this.service_url_prefix + "/resetUserPassword/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var user = yield app.modelFactory().read(userModelOption.model_name, userModelOption.model_path, this.params._id);
                            if(!user){
                                this.body = app.wrapper.res.error({message: '无效的用户!'});
                                yield next;
                                return;
                            }
                            console.log('before update');
                            var newPasswordHash = app.crypto.createHash('md5').update('123456').digest('hex');
                            console.log(newPasswordHash);
                            user.password_hash = newPasswordHash;
                            user.save();
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