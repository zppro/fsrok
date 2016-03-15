/**
 * Created by zppro on 16-3-15.
 */
(function() {
    'use strict';

    angular
        .module('app.core')
        .controller('TopbarController', TopbarController);

    TopbarController.$inject = ['$rootScope', '$state', 'Auth'];

    function TopbarController($rootScope, $state, Auth) {

        activate();

        function activate() {

            //topbar some actions
            $rootScope.app.logout = function ($event) {

                Auth.logout();
                $state.go('page.login');
                $event.stopPropagation();
            };

            $rootScope.app.lock = function ($event) {
                Auth.setCode();
                Auth.logout();
                $state.go('page.lock');
                $event.stopPropagation();
            };

        }
    }
})();
