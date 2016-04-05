/**=========================================================
 * Module: demo.controller.js
 * Handle demo elements
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.demo')
        .controller('DemoGridBasicController', DemoGridBasicController)
        .controller('DemoGridBasicDetailsController', DemoGridBasicDetailsController)
        .controller('DemoTreeBasicController', DemoTreeBasicController)
        .controller('DemoTreeExtendController', DemoTreeExtendController)
    ;

    DemoGridBasicController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function DemoGridBasicController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();


        function init() {

            //console.log(vm._subsystem_);
            //console.log(vm._module_);
            //console.log(vm._view_);
            //console.log(vm._action_);
            vm.init({removeDialog: ngDialog});
            vm.query();

        }

    }

    DemoGridBasicDetailsController.$inject = ['$scope', 'vmh', 'entityVM'];

    function DemoGridBasicDetailsController($scope, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;
        //$scope.utils.vinput.$inject = ['$scope'];

        init();

        function init() {
            //console.log(entity._subsystem_);
            //console.log(entity._module_);
            //console.log(entity._view_);
            //console.log(entity._action_);
            //console.log(entity._id_);
            vm.doSubmit = doSubmit;

            vm.tab1 = {cid: 'contentTab1'};
            vm.tab2 = {cid: 'contentTab2'};

            if (vm._id_ != 'new') {


                var defered = vmh.q.defer();
                var promise = defered.promise;

                vmh.timeout(function () {

                    defered.resolve({success: true, error: null});
                    //defered.reject({success: false, error: 'test error'});
                }, 1000);

                promise.then(function (ret) {
                    vm.load();
                }).catch(function (err) {
                    console.log('load error:');
                    console.log(err);
                }).finally(function () {
                    vmh.loadingBar.complete(); // End loading.
                    vmh.blockUI.stop();
                });

                console.log('load...');
                vmh.loadingBar.start();
                vmh.blockUI.start();
            }

        }


        function doSubmit() {

            if ($scope.demoForm.$valid) {
                //console.log(vm.model);
                //var defered = vmh.q.defer();
                //var promise = defered.promise;
                //
                //vmh.timeout(function () {
                //
                //    vm.save();
                //    defered.resolve({success: true, error: null});
                //    //defered.reject({success: false, error: 'test error'});
                //}, 2000);
                //
                //promise.then(function (ret) {
                //    $scope.$state.go(vm.moduleRoute('list'));
                //}).catch(function (err) {
                //}).finally(function () {
                //    vmh.loadingBar.complete(); // End loading.
                //    vmh.blockUI.stop();
                //});
                //
                //vmh.loadingBar.start();
                //vmh.blockUI.start();
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

    DemoTreeBasicController.$inject = ['$scope','$http','tree','vmh', 'instanceVM'];

    function DemoTreeBasicController($scope, $http,tree, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache

            $http
                .get(subsystemURL)
                .success(function (treeNodes) {
                    //##import tip##
                    //单棵树
                    //vm.tree1 = new tree.sTree('tree1', treeNodes);

                    //##import tip##
                    //多棵树
                    vm.trees = [new tree.sTree('tree1', treeNodes), new tree.sTree('tree2', treeNodes, {mode: 'check'})];
                });


            $scope.$on('tree:node:select', function ($event, tree) {
                console.log(tree.selectedNode);
            });
        }

    }

    DemoTreeExtendController.$inject = ['$scope','$http','tree','vmh', 'instanceVM'];

    function DemoTreeExtendController($scope, $http,tree, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache

            $http
                .get(subsystemURL)
                .success(function (treeNodes) {
                    vm.trees = [new tree.sTree('tree1', treeNodes), new tree.sTree('tree2', treeNodes, {
                        mode: 'check'
                        , checkCascade: false
                    })];//{expandLevel: 2}
                    //vm.trees[0].selectedNode = vm.trees[0].findNode('0-2-1'); //by $index
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById('120404');//by _id
                    //vm.trees[0].setNodeChecked([vm.trees[0].findNodeById('120103'),vm.trees[0].findNodeById('120304')]);
                    vm.trees[1].checkedNodes = [vm.trees[1].findNodeById('1201'), vm.trees[1].findNodeById('120304')];
                    console.log(vm.trees[1].checkedNodes);
                });


            $scope.$on('tree:node:select', function ($event, tree) {
                console.log(tree.selectedNode);
            });
        }

    }

})();
