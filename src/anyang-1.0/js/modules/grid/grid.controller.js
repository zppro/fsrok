/**=========================================================
 * Module: grid.controller.js
 * Handle grid elements
 =========================================================*/

(function() {
  'use strict';

  angular
      .module('app.grid')
      .controller('GridController', GridController);

  GridController.$inject = ['$scope', 'GridDemoModelSerivce','modelNode'];
  function GridController($scope, GridDemoModelSerivce,modelNode) {

    activate();

    ////////////////

    function activate() {

      var vm = $scope.vm = {};
      vm.page = {
        size: 10,
        no: 1
      };
      vm.sort = {
        column: 'id',
        direction: -1,
        toggle: function (column) {
          if (column.sortable === false)
            return;

          if (this.column === column.name) {
            this.direction = -this.direction || -1;
          } else {
            this.column = column.name;
            this.direction = -1;
          }
        }
      };
      // 构建模拟数据
      vm.columns = [
        {
          label: 'ID',
          name: 'id',
          type: 'string'
        },
        {
          label: '姓名',
          name: 'name',
          type: 'string'
        },
        {
          label: '粉丝数',
          name: 'followers',
          type: 'number'
        },
        {
          label: '收入',
          name: 'income',
          type: 'currency'
        },
        {
          label: '',
          name: 'actions',
          sortable: false
        }
      ];
      // 供页面中使用的函数
      vm.age = function (birthday) {
        return moment().diff(birthday, 'years');
      };


      vm.items = GridDemoModelSerivce.query();

      console.log(modelNode.services['pub-tenant'].query());

    } // activate
  }

})();
