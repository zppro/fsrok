/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular.module('app.auth')
        .service('Auth', Auth);

    Auth.$inject = ['$cookieStore'];

    function Auth($cookieStore) {
        var _user = $cookieStore.get('user');
        var setUser = function (user, rememberCode) {
            _user = user;
            if (_user.roles && _user.roles.length > 0) {
                _user.role = 0;
                _.each(_user.roles, function (o) {
                    _user.role += parseInt(o);
                });
            }
            $cookieStore.put('user', _user);
            if (rememberCode) {
                $cookieStore.put('code', _user.code);
            }
            else {
                $cookieStore.remove("code");
            }
        };
        return {
            setUser: setUser,
            isAuthorized: function (lvl) {
                //调试时可以在此切换默认用户角色
                return ((_user || {}).role || 1) >= lvl;
            },
            isPermit: function (func_id) {
                this.ensureUser();
                if(_user && _user.tenant && _user.tenant.open_funcs) {
                    var func = _.find(_user.tenant.open_funcs, function (o) {
                        return o.func_id == func_id;
                    });
                    if (func) {
                        return moment(func.expired_on).diff(moment()) >= 0;
                    }
                    else {
                        return false;
                    }
                }
                return true;
            },
            isAuthenticated: function () {
                return _user ? true : false;
            },
            getUser: function () {
                if(_user) {
                    _user = $cookieStore.get('user');
                }
                return _user;
            },
            getToken: function () {
                return _user ? _user.token : '';
            },
            setCode: function () {
                $cookieStore.put('code', _user.code);
            },
            getCode: function () {
                return $cookieStore.get('code') || (_user || {code: null}).code;
            },
            logout: function () {
                $cookieStore.remove('user');
                _user = null;
            },
            ensureUser:function() {
                _user = _user || $cookieStore.get('user');
            }
        };
    }

})();