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


    TenantUserManageGridController.$inject = ['$scope', 'treeFactory', 'ngDialog', 'vmh', 'entryVM'];

    function TenantUserManageGridController($scope, treeFactory, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();


        function init() {



            //console.log(vm._subsystem_);
            //console.log(vm._module_);d
            //console.log(vm._view_);
            //console.log(vm._action_);
            vm.init({removeDialog: ngDialog});

            //if($scope.$stateParams.tenantId) {
            //    vm.searchForm.tenantId = $scope.$stateParams.tenantId;
            //}
            //else {
            //    vm.searchForm.tenantId = {$exists: true};
            //}
            //console.log(vm.treeFilterObject);
            if(vm.switches.leftTree) {
                vmh.shareService.t('T1001', 'name type', vm.treeFilterObject).then(function (treeNodes) {
                    vm.trees = [new treeFactory.sTree('tree1', treeNodes, {mode: 'grid'})];
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById($scope.$stateParams.tenantId);
                });

                $scope.$on('tree:node:select', function ($event, tree) {
                    //console.log(tree.selectedNode);
                    var selectNodeId = tree.selectedNode._id;
                    if ($scope.$stateParams.tenantId != selectNodeId) {
                        $scope.$state.go(vm.viewRoute(), {tenantId: tree.selectedNode._id});

                    }
                });
            }
            vm.query();
        }
    }

    TenantUserManageDetailsController.$inject = ['$scope', '$state','vmh','entityVM'];

    function TenantUserManageDetailsController($scope, $state, vmh, vm) {


        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init();
            if (vm.selectFilterObject.tenants) {
                vm.selectBinding.tenants = vm.modelNode.services['pub-tenant'].query(vm.selectFilterObject.tenants, null, '_id name');
            }
            vmh.shareService.d('D1001').then(function (rows) {
                vm.selectBinding.roles = rows;
            });

            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};
            //vm.tab2 = {cid: 'contentTab2'};

            vm.load();

            console.log(vm);
        }


        function doSubmit() {

            if ($scope.theForm.$valid) {
                vm.save();
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }

                //else if ($scope.utils.vtab(vm.tab2.cid)) {
                //    vm.tab2.active = true;
                //}
            }
        }
    }

})();
