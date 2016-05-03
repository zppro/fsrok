/**
 * Created by zppro on 16-3-15.
 */
(function() {
    'use strict';

    angular
        .module('app.core')
        .controller('AppController', AppController)
        .controller('TopbarController', TopbarController)
        .controller('ModuleHeaderController', ModuleHeaderController)
        .controller('ModuleHeaderForTenantController', ModuleHeaderForTenantController)
    ;

    AppController.$inject = ['$rootScope','Auth'];
    function AppController($rootScope){
        //console.log(window.navigator.userLanguage || window.navigator.language);
        moment.locale($rootScope.localeId.replace('_','-').toLowerCase());
    }

    TopbarController.$inject = ['$rootScope','Auth'];

    function TopbarController($rootScope, Auth) {

        activate();

        function activate() {

            //topbar some actions
            $rootScope.app.logout = function ($event) {
                Auth.logout();
                $rootScope.$state.go('page.login');
                $event.stopPropagation();
            };

            $rootScope.app.lock = function ($event) {
                Auth.setCode();
                Auth.logout();
                $rootScope.$state.go('page.lock');
                $event.stopPropagation();
            };

        }
    }

    ModuleHeaderController.$inject = ['$scope','vmh'];
    function ModuleHeaderController($scope,vmh) {
        $scope.vmh = vmh;
    }

    ModuleHeaderForTenantController.$inject = ['$scope','vmh','Auth'];
    function ModuleHeaderForTenantController($scope,vmh,Auth) {
        $scope.vmh = vmh;
        var vm = $scope.vm = {};
        var user = Auth.getUser();
        if(user && user.tenant) {
            vm.tenantName = user.tenant.name;
        }
    }
})();
