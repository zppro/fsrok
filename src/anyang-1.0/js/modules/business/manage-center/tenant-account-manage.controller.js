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



        init();

        function init() {
            vm.init();

            vmh.shareService.d('D1002').then(function(rows) {
                vm.selectBinding.tenantTypes = _.filter(rows, function (row) {
                    var filterType = vm.selectFilterObject.type;
                    if (_.isString(filterType)) {
                        return filterType == row.value;
                    }
                    else if (_.isArray(filterType)) {
                        return _.contains(filterType, row.value);
                    }
                    return true;
                });

            });


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
