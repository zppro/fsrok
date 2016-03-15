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
        var setUser = function (user) {
            _user = user;
            $cookieStore.put('user', _user);
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
            logout: function () {
                $cookieStore.remove('user');
                _user = null;
            }
        };
    }

})();