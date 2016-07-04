/**
 * financial-enter-payment.controller Created by zppro on 16-5-18.
 * Target:财务入院缴费
 */


(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('FinancialEnterPaymentGridController', FinancialEnterPaymentGridController)
    ;


    FinancialEnterPaymentGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function FinancialEnterPaymentGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.confirmEnterPayment = confirmEnterPayment;

            vm.query();
        }


        function confirmEnterPayment(row) {
            ngDialog.openConfirm({
                template: 'normalConfirmDialog.html',
                className: 'ngdialog-theme-default'
            }).then(function () {
                //A0003->A0005 订单状态从[提交财务审核]到[财务确认收款]
                var data = {current_register_step: 'A0005'};
                var promise = vmh.fetch(vm.modelService.update(row._id, data)).then(function () {
                    row.current_register_step = data.current_register_step;
                });

                vmh.q.all([vmh.translate('notification.NORMAL-SUCCESS'), promise]).then(function (ret) {
                    vmh.notify.alert('<div class="text-center"><em class="fa fa-check"></em> ' + ret[0] + '</div>', 'success');
                });
            });
        }
    }

})();