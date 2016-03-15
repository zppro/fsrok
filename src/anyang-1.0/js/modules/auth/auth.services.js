/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular.module('app.auth')
        .service('Auth', Auth);

    Auth.$inject = ['$cookieStore'];

    function Auth($cookieStore) {
        console.log('Auth');
        var _user = $cookieStore.get('user');
        var setUser = function (user,rememberCode) {
            _user = user;
            $cookieStore.put('user', _user);
            if(rememberCode) {
                $cookieStore.put('code',_user.code);
            }
            else {
                $cookieStore.remove("code");
            }
        };
        return {
            isAuthorized: function (lvl) {
                return _user.role >= lvl;
            },
            setUser: setUser,
            isAuthenticated: function () {
                return _user ? true : false;
            },
            getUser: function () {
                return _user;
            },
            getToken: function () {
                return _user ? _user.token : '';
            },
            setCode:function() {
                $cookieStore.put('code', _user.code);
            },
            getCode: function () {
                return $cookieStore.get('code') || (_user || {code: null}).code;
            },
            logout: function () {
                $cookieStore.remove('user');
                _user = null;
            }
        };
    }

})();