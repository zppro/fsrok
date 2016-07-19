/**
 * charge-standard Created by zppro on 16-5-6.
 * Target:用途
 */
(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('ChargeStandardController', ChargeStandardController)
    ;

    ChargeStandardController.$inject = ['$parse','$scope','vmh', 'instanceVM'];

    function ChargeStandardController($parse,$scope, vmh, vm) {
        $scope.vm = vm;
        var tenantService = vm.modelNode.services['pub-tenant'];
        var tenantChargeItemCustomizedService = vm.modelNode.services['pub-tenantChargeItemCustomized'];

        init();


        function init() {

            vm.init();

            vm.chargeItems = {};
            vm.slider = {
                value: 0,
                options: {
                    floor: 0,
                    ceil: 9999
                }
            };

            vm.charges = {};

            vm.chargeItemDataPromise = vmh.clientData.getJson('charge-item-organization-pfta').then(function (items) {
                vm.selectBinding.standards = items;
                if (vm.selectBinding.standards.length > 0) {
                    return vmh.parallel([
                        vmh.extensionService.tenantChargeItemCustomizedAsTree(vm.model['tenantId']),
                        vmh.fetch(tenantService.query({_id: vm.model['tenantId']}, 'charge_standard charge_items'))
                    ]).then(function (results) {
                        //console.log(results[0]);
                        var ret = results[1];
                        var selectedStandard = _.findWhere(vm.selectBinding.standards, {_id: ret[0].charge_standard});
                        if (!selectedStandard) {
                            selectedStandard = vm.selectBinding.standards[0];
                        }

                        if (selectedStandard) {
                            vm.selectedStandardId = selectedStandard._id;
                        }

                        if(results[0].children.length>0) {
                            selectedStandard.children.push(results[0]);
                        }


                        vm.chargeItems = ret[0].charge_items;
                        setCheckedChargeItems();

                        return vmh.promiseWrapper(selectedStandard.children);
                    });
                }
            });

            vm.dropdownDataPromise = vmh.shareService.d('D1015');

            vm.onStandardChanged = onStandardChanged;
            vm.createChargeItem = createChargeItem;
            vm.saveChargeStandard = saveChargeStandard;

            function onStandardChanged() {
                var selectedStandard = _.findWhere(vm.selectBinding.standards, {_id: vm.selectedStandardId});
                if(selectedStandard){
                    vm.chargeItemDataPromise = vmh.promiseWrapper(selectedStandard.children);
                    setCheckedChargeItems();
                }
            }


            function setCheckedChargeItems(){
                vm.checkedChargeItems = _.map(vm.chargeItems,function(o){
                    o._id = o.item_id;
                    return o;
                });
                _.each(vm.checkedChargeItems,function(item) {
                    vm.charges[item.item_id] = {
                        item_id: item.item_id,
                        item_name: item.item_name,
                        period_price: item.period_price,
                        period: item.period
                    };
                });
            }


            function createChargeItem(node) {
                var theOne = vm.charges[node._id];
                if (!theOne) {
                    console.log(node);
                    vm.charges[node._id] = {
                        item_id: node._id,
                        item_name: node.name,
                        period_price: 0,
                        period: 'A0005'
                    }
                }
                //console.log(vm.charges);
            }

            function saveChargeStandard() {

                var checkedIds = _.map(vm.checkedChargeItems,function(o){return o._id});
                console.log(checkedIds);

                vm.saveCharges = _.filter(vm.charges,function(o){
                    return _.contains(checkedIds,o.item_id);
                });

                vmh.exec(tenantService.update(vm.model['tenantId'], {
                    charge_standard: vm.selectedStandardId,
                    charge_items: _.values(vm.saveCharges)
                }));
            }

        }
    }

})();