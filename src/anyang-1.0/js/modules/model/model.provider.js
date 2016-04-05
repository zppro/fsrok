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
                            '_totals': {method: 'POST', headers: {'_$resource$_': true}},
                            'update': {method: 'PUT', headers: {'_$resource$_': true}}
                            //'save': {method: 'POST'},
                            //, 'remove': {method: 'DELETE'},
                            //'delete': {method: 'DELETE'}
                        });
                        this.services[name].one = function (params, successFn, errorFn) {
                            return this.get(_.extend(params, {_id: '$one'}), successFn, errorFn)
                        };
                        this.services[name].page = function (page, where, sort, select, successFn, errorFn) {
                            return this._query({_id: '$query'}, {
                                page: page,
                                where: where,
                                sort: sort,
                                select: select,
                            }, successFn, errorFn)
                        };
                        this.services[name].query = function (where, sort, select, successFn, errorFn) {
                            return this._query({_id: '$query'}, {
                                where: where,
                                sort: sort,
                                select: select
                            }, successFn, errorFn)
                        };
                        this.services[name].totals = function (where, successFn, errorFn) {
                            return this._totals({_id: '$totals'}, where, successFn, errorFn)
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
            $get: ['$rootScope', '$q', '$http', '$resource', function ($rootScope, $q, $http, $resource) {
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
                    t: function (id, forceRefresh) {
                        var promise;
                        if (forceRefresh || angular.isUndefined(this.shareTree[id])) {
                            var self = this;
                            promise = $http.get(baseUrl + 'tree/' + id).then(function (rows) {
                                self.shareTree[id] = rows;
                                return self.shareTree[id];
                            });
                        }
                        else {
                            promise = $q.when(this.shareTree[id]);
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
})();