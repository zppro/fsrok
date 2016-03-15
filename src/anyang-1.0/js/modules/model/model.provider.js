/**=========================================================
 * Module: ModelProvider.js
 * Provides ModelService functions for node.js
 =========================================================*/
(function() {
    'use strict';
    angular
        .module('app.model')
        .provider('modelNode', ModelNode)
    ;

    function ModelNode() {
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$resource', function ($resource) {
                return {
                    services: {},
                    factory: function (name) {
                        this.services[name] = $resource(baseUrl + name + '/:id', {
                            id: '@' + _.last(name.split('-')) + 'Id'
                        }, {
                            'get': {method: 'GET'},
                            'save': {method: 'POST'},
                            'query': {method: 'GET', isArray: true},
                            'remove': {method: 'DELETE'},
                            'delete': {method: 'DELETE'}
                        });
                    }
                };
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }
})();