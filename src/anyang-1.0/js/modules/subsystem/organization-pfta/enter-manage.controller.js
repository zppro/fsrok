/**
 * system-district-manage.controller Created by zppro on 16-4-19.
 * Target:租户管理片区
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('EnterManageGridController', EnterManageGridController)
        .controller('EnterManageDetailsController', EnterManageDetailsController)
    ;


    EnterManageGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function EnterManageGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }

    EnterManageDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function EnterManageDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;
        vm.elderlyModel = {};//id_no:'330501198106150610'

        init();

        function init() {

            vm.init();

            vmh.parallel([vmh.shareService.d('D1006'),
                vmh.shareService.d('D1007'),
                vmh.shareService.d('D1008'),
                vmh.shareService.d('D1009'),
                vmh.shareService.d('D1010'),
                vmh.shareService.d('D1011')]).then(function (results) {
                vm.selectBinding.sex = results[0];
                vm.selectBinding.marriages = results[1];
                vm.selectBinding.medical_insurances = results[2];
                vm.selectBinding.politics_statuses = results[3];
                vm.selectBinding.inhabit_statuses = results[4];
                vm.selectBinding.financial_statuses = results[5];
            });

            vm.hobbiesPromise = vmh.shareService.d('D1013').then(function(hobbies){
                return hobbies;
            });

            vm.medical_historiesPromise = vmh.shareService.d('D1014').then(function(medical_histories){
                return medical_histories;
            });

            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};
            vm.tab2 = {cid: 'contentTab2'};
            vm.tab3 = {cid: 'contentTab3'};
            vm.load();



        }


        function doSubmit() {

            if ($scope.theForm.$valid) {
                vm.save();
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
                else if ($scope.utils.vtab(vm.tab2.cid)) {
                    vm.tab2.active = true;
                }
                else if ($scope.utils.vtab(vm.tab3.cid)) {
                    vm.tab3.active = true;
                }
            }
        }


    }

})();