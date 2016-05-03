/**
 * system-district-manage.controller Created by zppro on 16-4-19.
 * Target:租户管理房间
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('RoomManageGridController', RoomManageGridController)
        .controller('RoomManageDetailsController', RoomManageDetailsController)
    ;


    RoomManageGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function RoomManageGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            if (vm.switches.leftTree) {
                vmh.shareService.tmp('T3001/pfta-district', 'name', vm.treeFilterObject).then(function (treeNodes) {
                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes, {mode: 'grid'})];
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById($scope.$stateParams.districtId);
                });

                $scope.$on('tree:node:select', function ($event, node) {
                    //console.log(tree.selectedNode);
                    var selectNodeId = node._id;
                    if ($scope.$stateParams.districtId != selectNodeId) {
                        $scope.$state.go(vm.viewRoute(), {districtId: selectNodeId});

                    }
                });
            }

            vm.query();
        }
    }

    RoomManageDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function RoomManageDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init();

            vm.selectBinding.districts = vm.modelNode.services['pfta-district'].query(_.defaults(vm.selectFilterObject.districts, vm.selectFilterObject.common), '_id name');

            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};

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
            }
        }


    }

})();