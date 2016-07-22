/**
 * dashboard Created by zppro on 16-7-22.
 * Target:机构养老云中系统管理员以上看的数据面板（俯瞰图）
 */
(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('DashboardControllerOfOrganizationOfPFTAController', DashboardControllerOfOrganizationOfPFTAController)
    ;

    DashboardControllerOfOrganizationOfPFTAController.$inject = ['$parse','$scope','vmh', 'instanceVM'];

    function DashboardControllerOfOrganizationOfPFTAController($parse,$scope, vmh, vm) {
        $scope.vm = vm;

        init();

        function init() {

            vm.init();
        }
    }

})();