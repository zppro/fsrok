/**
 * Created by zppro on 16-3-15.
 */
(function() {
    'use strict';

    angular
        .module('app.core')
        .controller('TopbarController', TopbarController)
        .controller('ModuleHeaderController', ModuleHeaderController)
        .controller('ModuleHeaderForTenantController', ModuleHeaderForTenantController)
    ;

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

    ModuleHeaderController.$inject = ['$scope','vmh'];
    function ModuleHeaderController($scope,vmh) {
        $scope.vmh = vmh;
    }

    ModuleHeaderForTenantController.$inject = ['$scope','vmh'];
    function ModuleHeaderForTenantController($scope,vmh) {
        $scope.vmh = vmh;
    }
})();
