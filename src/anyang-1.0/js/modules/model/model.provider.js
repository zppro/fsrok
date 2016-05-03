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
                            '_save': {method: 'POST'},
                            '_remove': {method: 'DELETE'}
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
                    completeOrder: completeOrder,
                    refundOrder: refundOrder,
                    userChangePassword: userChangePassword,
                    resetUserPassword: resetUserPassword
                };

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