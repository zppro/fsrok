/**
 * Created by zppro on 16-3-22.
 */

(function() {
    'use strict';

    angular
        .module('biz.manage-center')
        .controller('TenantAccountManageDetailsController', TenantAccountManageDetailsController)
    ;

    TenantAccountManageDetailsController.$inject = ['$scope', '$state','vmh','entityVM'];

    function TenantAccountManageDetailsController($scope, $state, vmh, vm) {


        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        $scope.doesNotExist = function(value,id) {
            console.log(id);
            var db = ['john.doe@mail.com', 'jane.doe@mail.com'];

            // Simulates an asyncronous trip to the server.
            return vmh.q(function(resolve, reject) {
                vmh.timeout(function() {
                    if (db.indexOf(value) < 0) {
                        resolve();
                    } else {
                        reject();
                    }
                }, 500);
            });
        };


        vmh.shareService.d('D1002').then(function(rows){
            $scope.tenantTypes = rows;
        });


        init();

        function init() {
            vm.init();
            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};
            vm.tab2 = {cid: 'contentTab2'};

            vm.load();

        }


        function doSubmit() {

            if ($scope.theForm.$valid) {
                //console.log(vm.model);
                vm.save();
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
                else if ($scope.utils.vtab(vm.tab2.cid)) {
                    vm.tab2.active = true;
                }
            }
        }
    }

})();
