/**=========================================================
 * Module: demo.controller.js
 * Handle demo elements
 =========================================================*/

(function() {
  'use strict';

  angular
      .module('app.demo')
      .controller('DemoGridController', DemoGridController)
      .controller('DemoGridDetailsController', DemoGridDetailsController);

  DemoGridController.$inject = ['$scope','vmh','entry'];

  function DemoGridController($scope,vmh,vm) {

    $scope.vm = vm;
    $scope.utils = vmh.utils.g;

    init();



    function init() {

      //console.log(entry._subsystem_);
      //console.log(entry._module_);
      //console.log(entry._view_);
      //console.log(entry._action_);

      // 构建模拟数据
      vm.columns = [
        {
          label: 'ID',
          name: 'id',
          type: 'string',
          width: 60
        },
        {
          label: '姓名',
          name: 'name',
          type: 'string',
          width: 200
        },
        {
          label: '生日',
          name: 'birthday',
          type: 'date',
          width: 120
        },
        {
          label: '粉丝数',
          name: 'followers',
          type: 'number',
          hidden: true
        },
        {
          label: '收入',
          name: 'income',
          type: 'currency'
        },
        {
          label: '',
          name: 'actions',
          sortable: false,
          width: 60
        }
      ];

      vm.rows = vmh.demoModelSerivce.query();

    }

  }

  DemoGridDetailsController.$inject = ['$scope', '$state', '$q', '$timeout','vmh','entity'];

  function DemoGridDetailsController($scope, $state, $q, $timeout,vmh, vm) {

    var vm = $scope.vm = vm;
    $scope.utils = vmh.utils.v;
    $scope.utils.vinput.$inject = ['$scope'];

    init();

    function init() {
        //console.log(entity._subsystem_);
        //console.log(entity._module_);
        //console.log(entity._view_);
        //console.log(entity._action_);
        //console.log(entity._id_);
        vm.save = save;

        vm.tab1 = {cid: 'contentTab1'};
        vm.tab2 = {cid: 'contentTab2'};

        load(vm._id_);

    }

    function load(id) {

      if(id != 'new') {
        var defered = $q.defer();
        var promise = defered.promise;

        $timeout(function () {

          defered.resolve({success: true, error: null});
          //defered.reject({success: false, error: 'test error'});
        }, 1000);

        promise.then(function (ret) {
          vm.model = vmh.demoModelSerivce.find(id);
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

    function save() {

      if ($scope.demoForm.$valid) {
        //console.log(vm.model);
        var defered = $q.defer();
        var promise = defered.promise;

        $timeout(function () {

            vmh.demoModelSerivce.save(vm._id_,vm.model);
            defered.resolve({success: true, error: null});
          //defered.reject({success: false, error: 'test error'});
        }, 2000);

        promise.then(function (ret) {
          $state.go(vm.moduleRoute('list'));
        }).catch(function (err) {
        }).finally(function () {
          vmh.loadingBar.complete(); // End loading.
          vmh.blockUI.stop();
        });

        vmh.loadingBar.start();
        vmh.blockUI.start();
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
