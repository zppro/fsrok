/**
 * Created by zppro on 16-3-22.
 */

(function() {
    'use strict';

    angular
        .module('biz.manage-center')
        .controller('TenantUserManageGridController', TenantUserManageGridController)
        .controller('TenantUserManageDetailsController', TenantUserManageDetailsController)
    ;

    TenantUserManageGridController.$inject = ['$scope', 'tree', 'ngDialog', 'vmh', 'entryVM'];

    function TenantUserManageGridController($scope, tree, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();


        function init() {



            //console.log(vm._subsystem_);
            //console.log(vm._module_);d
            //console.log(vm._view_);
            //console.log(vm._action_);
            vm.init({removeDialog: ngDialog});

            if($scope.$stateParams.tenantId) {
                vm.searchForm.tenantId = $scope.$stateParams.tenantId;
            }
            else {
                vm.searchForm.tenantId = {$exists: true};
            }

            vmh.shareService.t('A1001').then(function (treeNodes) {
                console.log(treeNodes);
                vm.trees = [new tree.sTree('tree1', treeNodes, {mode: 'grid'})];
                vm.trees[0].selectedNode = vm.trees[0].findNodeById($scope.$stateParams.tenantId);
            });

            vm.query();

            $scope.$on('tree:node:select', function ($event, tree) {
                console.log(tree.selectedNode);
                var selectNodeId = tree.selectedNode._id;
                if ($scope.$stateParams.tenantId != selectNodeId) {
                    $scope.$state.go(vm.viewRoute(), {tenantId: tree.selectedNode._id});

                }
            });
        }
    }

    TenantUserManageDetailsController.$inject = ['$scope', '$state','vmh','entityVM'];

    function TenantUserManageDetailsController($scope, $state, vmh, vm) {


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
