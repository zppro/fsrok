/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular
        .module('app.auth')
        .config(authConfig);

    authConfig.$inject = ['$httpProvider'];
    function authConfig($httpProvider){
        console.log('authConfig...');

        var interceptor = ['$q', '$rootScope','Auth', function ($q, $rootScope,Auth) {
            return {
                'request': function(req) {
                    var _url = req.url.toLowerCase();
                    console.log(_url);
                    if (_url.indexOf('services/') == 0 && _url !=='services/share/login/signin') {
                        console.log('model op');
                        req.headers.Authorization =  Auth.getToken();
                        console.log(req.headers);
                    }
                    return req;
                },
                'response': function (resp) {
                    var _url = resp.config.url.toLowerCase();
                    if (_url.indexOf('services/') == 0) {
                        console.log(resp.data);
                        if (resp.data.success) {
                            return resp.data.rows || resp.data.ret;
                        }
                        else {
                            $rootScope.$broadcast('server:500.xx', resp.data.msg);
                            return $q.reject(resp.data.msg);
                        }
                    }
                    return resp;
                },
                'responseError': function (rejection) {
                    // 错误处理
                    switch (rejection.status) {
                        case 401:
                            $rootScope.$broadcast('auth:401');
                            break;
                        case 403:
                            $rootScope.$broadcast('auth:403');
                            break;
                        case 404:
                            $rootScope.$broadcast('page:404');
                            break;
                        case 500:
                            $rootScope.$broadcast('server:500');
                            break;
                    }
                    return $q.reject(rejection);
                }
            };
        }];

        $httpProvider.interceptors.push(interceptor);
    }
})();