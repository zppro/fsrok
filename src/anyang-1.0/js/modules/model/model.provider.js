/**=========================================================
 * Module: ModelProvider.js
 * Provides ModelService functions for node.js
 =========================================================*/
(function() {
    'use strict';
    angular
        .module('app.model')
        .provider('modelNode', ModelNode)
        .provider('shareNode', ShareNode)
        .provider('extensionNode', ExtensionNode)
        .provider('debugNode',DebugNode)
        .provider('clientData',ClientData)
    ;

    function ModelNode() {
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$rootScope', '$resource', function ($rootScope, $resource) {
                return {
                    services: {},
                    factory: function (name) {
                        this.services[name] = $resource(baseUrl + name + '/:_id', {
                            _id: '@_id'
                        }, {
                            'get': {method: 'GET', headers: {'_$resource$_': true}},
                            'list': {method: 'GET', isArray: true, headers: {'_$resource$_': true}},
                            '_query': {method: 'POST', isArray: true, headers: {'_$resource$_': true}},
                            '_post': {method: 'POST', headers: {'_$resource$_': true}},
                            '_update': {method: 'PUT', headers: {'_$resource$_': true}},
                            '_save': {method: 'POST', headers: {'_$resource$_': true}},
                            '_remove': {method: 'DELETE', headers: {'_$resource$_': true}}
                            //'delete': {method: 'DELETE'}
                        });
                        this.services[name].save = function (params, successFn, errorFn) {
                            return this._save(null, params, successFn, errorFn)
                        };
                        this.services[name].update = function (_id, params, successFn, errorFn) {
                            return this._update({_id: _id}, params, successFn, errorFn)
                        };
                        this.services[name].disable = function (_id, successFn, errorFn) {
                            return this._update({_id: _id}, {status: 0}, successFn, errorFn);
                        };
                        this.services[name].remove = function (_id, successFn, errorFn) {
                            return this._remove({_id: _id}, null, successFn, errorFn);
                        };
                        this.services[name].one = function (params, successFn, errorFn) {
                            return this.get(_.extend(params, {_id: '$one'}), successFn, errorFn)
                        };
                        this.services[name].page = function (page, where, select, sort, successFn, errorFn) {
                            return this._query({_id: '$query'}, {
                                page: page,
                                where: where,
                                select: select,
                                sort: sort
                            }, successFn, errorFn);
                        };
                        this.services[name].query = function (where, select, sort, successFn, errorFn) {
                            return this._query({_id: '$query'}, {
                                where: where,
                                select: select,
                                sort: sort
                            }, successFn, errorFn);
                        };
                        this.services[name].totals = function (where, successFn, errorFn) {
                            return this._post({_id: '$totals'}, where, successFn, errorFn)
                        };
                        this.services[name].bulkInsert = function (rows, removeWhere, successFn, errorFn) {
                            return this._post({_id: '$bulkInsert'}, {
                                removeWhere: removeWhere,
                                rows: rows
                            }, successFn, errorFn)
                        };
                        this.services[name].bulkUpdate = function (conditions,batchModel, successFn, errorFn) {
                            return this._update({_id: '$bulkUpdate'}, {
                                conditions: conditions,
                                batchModel: batchModel
                            }, successFn, errorFn)
                        };
                    }
                };
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function ShareNode(){
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$rootScope', '$q', '$http', '$resource', 'treeFactory', function ($rootScope, $q, $http, $resource, treeFactory) {

                return {
                    shareDictionary: {},
                    shareTree: {},
                    d: function (id, forceRefresh) {
                        var promise;
                        if (forceRefresh || this.shareDictionary[id] == undefined) {
                            var self = this;
                            promise = $http.get(baseUrl + 'dictionary/' + id + '/array').then(function (rows) {
                                self.shareDictionary[id] = rows;
                                return self.shareDictionary[id];
                            });
                        }
                        else {
                            promise = $q.when(this.shareDictionary[id]);
                        }
                        return promise;
                    },
                    tmg: function (id, select, where, forceRefresh) {//tmg 本地过滤
                        var promise;
                        var cacheKey = 'get-'+id
                        if (forceRefresh || angular.isUndefined(this.shareTree[cacheKey])) {
                            var self = this;
                            if (select && (select.indexOf('_id ') == -1 || select.indexOf(' _id') == -1)) {
                                select = '_id ' + select;
                            }
                            promise = $http.get(baseUrl + 'tree/' + id + '/' + (select || '_id name')).then(function (nodes) {
                                self.shareTree[cacheKey] = nodes;
                                return self.shareTree[cacheKey];
                            });
                        }
                        else {
                            promise = $q.when(this.shareTree[cacheKey]);
                        }

                        return where ? promise.then(function (nodes) {
                            var clone = angular.copy(nodes);
                            for (var key in where) {
                                treeFactory.filter(clone, function (node) {
                                    if (node[key]) {
                                        var filterData = where[key];
                                        if (_.isString(filterData)) {
                                            return node[key] == filterData;
                                        }
                                        else if (_.isArray(filterData)) {
                                            return _.contains(filterData, node[key]);
                                        }
                                    }
                                    return true;
                                });
                            }
                            return clone;
                        }) : promise;
                    },
                    tmp: function (id, select, where, forceRefresh) {//tmg 本地过滤
                        var promise;
                        var cacheKey = 'post-' + id + objectHash(where);
                        if (forceRefresh || angular.isUndefined(this.shareTree[cacheKey])) {
                            var self = this;
                            if (select && (select.indexOf('_id ') == -1 || select.indexOf(' _id') == -1)) {
                                select = '_id ' + select;
                            }
                            promise = $http.post(baseUrl + 'tree/' + id, {
                                where: where,
                                select: select
                            }).then(function (nodes) {
                                self.shareTree[cacheKey] = nodes;
                                return self.shareTree[cacheKey];
                            });
                        }
                        else {
                            promise = $q.when(this.shareTree[cacheKey]);
                        }

                        return promise;
                    }
                };
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function ExtensionNode(){
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$rootScope', '$q', '$http', function ($rootScope, $q, $http) {

                return {
                    tenantInfo: tenantInfo,
                    roomStatusInfo: roomStatusInfo,
                    updateRoomStatusInfo: updateRoomStatusInfo,
                    submitApplicationToExit: submitApplicationToExit,
                    submitToAuditItemReturn: submitToAuditItemReturn,
                    submitToAuditSettlement: submitToAuditSettlement,
                    submitToConfirmExit: submitToConfirmExit,
                    advancePaymentItemsWhenExitSettlement: advancePaymentItemsWhenExitSettlement,
                    chargeItemsRecordedWhenExitSettlement: chargeItemsRecordedWhenExitSettlement,
                    chargeItemsUnRecordedWhenExitSettlement: chargeItemsUnRecordedWhenExitSettlement,
                    exitSettlement: exitSettlement,
                    completeExit: completeExit,
                    completeEnter: completeEnter,
                    disableEnterRelatedAction: disableEnterRelatedAction,
                    checkBeforeAddEnter: checkBeforeAddEnter,
                    queryElderly: queryElderly,
                    elderlyInfo: elderlyInfo,
                    changeElderlyRoomBed: changeElderlyRoomBed,
                    changeElderlyChargeItem: changeElderlyChargeItem,
                    checkCanChangeBookingOrUnbookingRecharge: checkCanChangeBookingOrUnbookingRecharge,
                    bookingRecharge: bookingRecharge,
                    disableRechargeAndUnbooking: disableRechargeAndUnbooking,
                    changeRechargeBookingAmount: changeRechargeBookingAmount,
                    completeOrder: completeOrder,
                    refundOrder: refundOrder,
                    userChangePassword: userChangePassword,
                    resetUserPassword: resetUserPassword
                };

                function tenantInfo(tenantId,select) {
                    return $http.get(baseUrl + 'tenantInfo/' + tenantId + '/' + select);
                }

                function roomStatusInfo(tenantId) {
                    return $http.get(baseUrl + 'roomStatusInfo/' + tenantId);
                }

                function updateRoomStatusInfo(tenantId,roomId,bed_no,elderlyId) {
                    return $http.post(baseUrl + 'updateRoomStatusInfo', {
                        tenantId: tenantId,
                        roomId: roomId,
                        bed_no: bed_no,
                        elderlyId: elderlyId
                    });
                }

                function submitApplicationToExit(elderlyId,data) {
                    return $http.post(baseUrl + 'submitApplicationToExit/' + elderlyId, data);
                }

                function submitToAuditItemReturn(exitId){
                    return $http.post(baseUrl + 'submitToAuditItemReturn/' + exitId);
                }

                function submitToAuditSettlement(exitId,data){
                    return $http.post(baseUrl + 'submitToAuditSettlement/' + exitId, data);
                }

                function submitToConfirmExit(exitId,data){
                    return $http.post(baseUrl + 'submitToConfirmExit/' + exitId, data);
                }

                function advancePaymentItemsWhenExitSettlement(exitId){
                    return $http.get(baseUrl + 'advancePaymentItemsWhenExitSettlement/' + exitId);
                }

                function chargeItemsRecordedWhenExitSettlement(exitId){
                    return $http.get(baseUrl + 'chargeItemsRecordedWhenExitSettlement/' + exitId);
                }

                function chargeItemsUnRecordedWhenExitSettlement(exitId){
                    return $http.get(baseUrl + 'chargeItemsUnRecordedWhenExitSettlement/' + exitId);
                }

                function exitSettlement(exitId,data) {
                    return $http.post(baseUrl + 'exitSettlement/' + exitId, data);
                }

                function completeExit(exitId, data) {
                    return $http.post(baseUrl + 'completeExit/' + exitId, data);
                }

                function completeEnter(enterId) {
                    return $http.post(baseUrl + 'completeEnter/' + enterId);
                }

                function disableEnterRelatedAction(enterId){
                    return $http.post(baseUrl + 'disableEnterRelatedAction/' + enterId);
                }

                function checkBeforeAddEnter(id_no,tenantId) {
                    return $http.get(baseUrl + 'checkBeforeAddEnter/' + tenantId + '/' + id_no);
                }

                function queryElderly(tenantId,keyword,where,select,sort) {
                    return $http.post(baseUrl + 'q/elderly', {tenantId: tenantId, keyword: keyword,  data: {
                        where: where,
                        select: select,
                        sort: sort
                    }});
                }

                function elderlyInfo(elderlyId,select) {
                    return $http.get(baseUrl + 'elderlyInfo/' + elderlyId + '/' + select);
                }

                function changeElderlyRoomBed(tenantId,elderlyId,roomId,bed_no) {
                    return $http.post(baseUrl + 'changeElderlyRoomBed', {
                        tenantId: tenantId,
                        elderlyId: elderlyId,
                        roomId: roomId,
                        bed_no: bed_no
                    });
                }

                function changeElderlyChargeItem(tenantId,elderlyId,charge_item_catalog_id,old_charge_item_id,new_charge_item) {
                    return $http.post(baseUrl + 'changeElderlyChargeItem', {
                        tenantId: tenantId,
                        elderlyId: elderlyId,
                        charge_item_catalog_id: charge_item_catalog_id,
                        old_charge_item_id: old_charge_item_id,
                        new_charge_item: new_charge_item
                    });
                }

                function checkCanChangeBookingOrUnbookingRecharge(rechargeId){
                    return $http.get(baseUrl + 'checkCanChangeBookingOrUnbookingRecharge/' + rechargeId);
                }

                function bookingRecharge(rechargeId,data){
                    return $http.post(baseUrl + 'bookingRecharge/' + rechargeId, data);
                }

                function disableRechargeAndUnbooking(rechargeId,data){
                    return $http.post(baseUrl + 'disableRechargeAndUnbooking/' + rechargeId, data);
                }

                function changeRechargeBookingAmount(rechargeId,data){
                    return $http.post(baseUrl + 'changeRechargeBookingAmount/' + rechargeId, data);
                }

                function completeOrder(orderId) {
                    return $http.post(baseUrl + 'completeOrder/' + orderId);
                }

                function refundOrder(orderId) {
                    return $http.post(baseUrl + 'refundOrder/' + orderId);
                }

                function userChangePassword(userId,data) {
                    return $http.post(baseUrl + 'userChangePassword/' + userId, data);
                }

                function resetUserPassword(userId) {
                    return $http.post(baseUrl + 'resetUserPassword/' + userId);
                }
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function DebugNode() {
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$rootScope', '$q', '$http', function ($rootScope, $q, $http) {

                return {
                    tenantInfo: tenantInfo
                };

                function tenantInfo(tenantId, select) {
                    return $http.get(baseUrl + 'tenantInfo/' + tenantId + '/' + select);
                }
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function ClientData() {
        var baseUrl;

        function setBaseUrl(url) {
            baseUrl = url;
        }

        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$rootScope', '$q', '$http', function ($rootScope, $q, $http) {

                return {
                    getJson: function (name) {
                        var arr = name.split('.');
                        if (arr[arr.length - 1] != 'json') {
                            name += '.json'
                        }
                        var promise = $http.get(baseUrl + name).then(function(res){
                            return res.data;
                        });
                        return promise;
                    }
                };
            }]
        };
    }


})();