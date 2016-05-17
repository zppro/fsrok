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
        this.service_url_prefix = '/debug-services/' + this.module_name.split('_').join('/');

        option = option || {};

        this.logger = require('log4js').getLogger(this.filename);

        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        var tenantModelOption = {model_name: 'pub_tenant', model_path: '../models/pub/tenant'};
        var districtModelOption = {model_name: 'pfta_district', model_path: '../models/pfta/district'};
        var roomModelOption = {model_name: 'pfta_room', model_path: '../models/pfta/room'};

        this.actions = [
            {
                method: 'tenantInfo',
                verb: 'get',
                url: this.service_url_prefix + "/tenantInfo/:_id/:select",//:select需要提取的字段域用逗号分割 e.g. name,type
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield app.modelFactory().read(tenantModelOption.model_name, tenantModelOption.model_path, this.params._id);
                            var ret = app._.pick(tenant.toObject(),this.params.select.split(','));
                            console.log(ret);
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
            },
            {
                method: 'test-random-token',//立即过期用户开通的所有功能
                verb: 'get',
                url: this.service_url_prefix + "/testRandomToken",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var rows = [];
                            for (var i = 0; i < 1000; i++) {
                                rows.push(app.uid(6));
                            }
                            console.log(rows.length);
                            rows = app._.uniq(rows);
                            console.log(rows.length);
                            this.body = app.wrapper.res.rows(rows);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'test-district-room-tree',//构建区域-房间树
                verb: 'get',
                url: this.service_url_prefix + "/test-district-room-tree",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var tenantId = '56cedebf7768e0eb161e1787';
                            var floorSuffix = 'F';
                            var bedNoSuffix = '#床';
                            var districts = yield app.modelFactory().query(districtModelOption.model_name, districtModelOption.model_path, {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name '
                            });

                            var rooms = yield app.modelFactory().query(roomModelOption.model_name, roomModelOption.model_path, {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name capacity floor districtId'
                            });

                            var districtFloorOfRooms = yield app.modelFactory().query(roomModelOption.model_name, roomModelOption.model_path, {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: '-_id floor districtId'
                            });

                            console.log(1);
                            var roomNameGroupByFloorAndDistrict = app._.chain(rooms).groupBy(function (o) {
                                return o.districtId + '$' + o.floor
                            }).map(function (o,k) {
                                var arr = app._.chain(o).map(function (o2) {
                                    var _idOfFloor = k + '$' + o2.floor;
                                    var nameOfFloor = o2.floor + floorSuffix;
                                    //console.log(roomNameGroupByFloorAndDistrict[_idOfFloor][0]);
                                    var children = app._.chain(app._.range(1, o2.capacity + 1)).map(function (o3) {
                                        return {_id: _idOfFloor + '$' + o3, name: o3 + bedNoSuffix};
                                    }).value();
                                    return {_id: o2._id, name: o2.name, children: children};
                                }).uniq('name').value();
                                var ret = {k: k, v: arr};
                                //console.log(ret);
                                return ret;
                            }).value();

                            console.log(2);
                            //console.log(roomNameGroupByFloorAndDistrict);

                            //districtFloorOfRooms = app._.map(districtFloorOfRooms,function(o){return o.toObject();})
                            //console.log(districtFloorOfRooms);
                            var floorGroupByDistrict = app._.chain(districtFloorOfRooms).groupBy('districtId').map(function (o,k) {
                                var arr = app._.chain(o).map(function (o2) {
                                    var _idOfFloor = k + '$' + o2.floor;
                                    var nameOfFloor = o2.floor+floorSuffix;
                                    var children = (app._.find(roomNameGroupByFloorAndDistrict, function (o3) {
                                        return o3.k == _idOfFloor;
                                    }) || {}).v;
                                    return {_id:_idOfFloor,name:nameOfFloor,children:children};
                                }).uniq('name').value();

                                var ret = {k: k, v: arr};
                                return ret;
                            }).value();

                            console.log(floorGroupByDistrict[0]);
                            //console.log(floorGroupByDistrict[0].children);
                            //console.log('-------------');



                            console.log(3);

                            var rows = app._.map(districts,function(o) {
                                var children = (app._.find(floorGroupByDistrict, function (o2) {
                                    return o2.k == o._id;
                                }) || {}).v;

                                //console.log(children);
                                return {_id: o._id, name: o.name, children: children};
                            });
                            //console.log(rows[0]);
                            this.body = app.wrapper.res.rows(rows);
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