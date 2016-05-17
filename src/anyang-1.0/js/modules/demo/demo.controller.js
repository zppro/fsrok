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
        .controller('DemoTreeDirectiveController', DemoTreeDirectiveController)
        .controller('DemoTreeNavController', DemoTreeNavController)
        .controller('DemoTreeTileController', DemoTreeTileController)
        .controller('DemoDropdownController', DemoDropdownController)
        .controller('DemoBoxInputController', DemoBoxInputController)
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
                    vmh.blocker.stop();
                });

                console.log('load...');
                vmh.loadingBar.start();
                vmh.blocker.start();
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
                //    vmh.blocker.stop();
                //});
                //
                //vmh.loadingBar.start();
                //vmh.blocker.start();
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

    DemoTreeBasicController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoTreeBasicController($scope,vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache

            vmh.http
                .get(subsystemURL)
                .success(function (treeNodes) {
                    //##import tip##
                    //单棵树
                    //vm.tree1 = new tree.sTree('tree1', treeNodes);
                    //过滤
                    //vmh.treeFactory.filter(treeNodes,function(node) {
                    //    console.log(node._id);
                    //    return node._id.indexOf('120502') != 0;
                    //});
                    //##import tip##
                    //多棵树
                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes), new vmh.treeFactory.sTree('tree2', treeNodes, {mode: 'check'})];
                });


            $scope.$on('tree:node:select', function ($event,node) {
                console.log(node);
            });
        }

    }

    DemoTreeExtendController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoTreeExtendController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache

            vmh.http
                .get(subsystemURL)
                .success(function (treeNodes) {

                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes),
                        new vmh.treeFactory.sTree('tree2', treeNodes, {mode: 'check', checkCascade: false})
                        ];//{expandLevel: 2}
                    //new vmh.treeFactory.sTree('tree3', angular.copy(treeNodes),{layout: 'dropdown',ngModel:'vm.field'})

                    //vm.trees[0].selectedNode = vm.trees[0].findNode('0-2-1'); //by $index
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById('120404');//by _id
                    //vm.trees[0].setNodeChecked([vm.trees[0].findNodeById('120103'),vm.trees[0].findNodeById('120304')]);
                    vm.trees[1].checkedNodes = [vm.trees[1].findNodeById('1201'), vm.trees[1].findNodeById('120304'), vm.trees[1].findNodeById('120305')];



                });



            $scope.$on('tree:node:select', function ($event, node) {
                //console.log(node);
            });
        }

    }

    DemoTreeDirectiveController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoTreeDirectiveController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache

            vm.treeDataPromise = vmh.http.get(subsystemURL).then(function(res){
                vm.selectedDistrict = '120101';

                vm.checkedDistricts = ['120201','120203'];

                vm.selectedDistrictOfDropDown = ['120301','120304'];

                return res.data;
            });



            $scope.$on('tree:node:select', function ($event,node) {
                console.log(node);
            });
        }

    }

    DemoTreeNavController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoTreeNavController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache

            vm.treeDataPromise = vmh.http.get(subsystemURL).then(function(res){
                vm.selectedDistrict = '120101';

                return res.data;
            });



            $scope.$on('tree:node:select', function ($event,node) {
                console.log(node);
            });
        }

    }

    DemoTreeTileController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoTreeTileController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache

            vm.treeDataPromise = vmh.http.get(subsystemURL).then(function(res){
                vm.selectedDistrict = '120101';

                return res.data;
            });



            $scope.$on('tree:node:select', function ($event,node) {
                console.log(node);
            });
        }

    }

    DemoDropdownController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoDropdownController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            console.log('123');

            vm.dropdownDataPromise = vmh.shareService.d('D1015').then(function(items){
                console.log('then in controller');
                vm.period = items[2].value;
                return items;
            });

            vm.onSelect = onSelect;
        }

        function onSelect(item){
            vm.selected = 'callback received ' + angular.toJson(item);
        }

    }

    DemoBoxInputController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoBoxInputController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();


            vmh.shareService.d('D1006').then(function(sexes){
                vm.selectBinding.sex = sexes;
            });

        }

    }

})();
