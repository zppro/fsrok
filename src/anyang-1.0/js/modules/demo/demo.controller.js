/**=========================================================
 * Module: demo.controller.js
 * Handle demo elements
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.demo')
        .controller('DemoGridController', DemoGridController)
        .controller('DemoGridDetailsController', DemoGridDetailsController)
        .controller('DemoTreeController', DemoTreeController)
    ;

    DemoGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function DemoGridController($scope, ngDialog, vmh, vm) {

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

    DemoGridDetailsController.$inject = ['$scope', 'vmh', 'entityVM'];

    function DemoGridDetailsController($scope, vmh, vm) {

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

    DemoTreeController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoTreeController($scope,  vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {

            //console.log(vm._subsystem_);
            //console.log(vm._module_);
            //console.log(vm._view_);
            //console.log(vm._action_);
            vm.init();

        }

    }

})();
