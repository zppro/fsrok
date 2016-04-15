/**
 * Created by zppro on 16-3-22.
 */

(function() {
    'use strict';

    angular
        .module('subsystem.manage-center')
        .controller('FuncController', FuncController)
    ;

    FuncController.$inject = ['$scope','vmh', 'instanceVM'];

    function FuncController($scope, vmh, vm) {
        $scope.vm = vm;
        var vmc = $scope.vmc = {};
        var funcService = vm.modelNode.services['pub-func'];
        var tenantService = vm.modelNode.services['pub-tenant'];


        init();


        function init() {

            vm.init();

            vmc.chargedFuncs = [];
            vmc.funcs = {};
            vmc.slider = {
                value: 0,
                options: {
                    floor: 0,
                    ceil: 500,
                    step: 50,
                    showTicksValues: !vmh.browser.msie
                }
            };

            vm.switches.setTenantOpenFuncs = $scope.$stateParams.tenantId ?true:false;

            if (vm.selectFilterObject&&vm.selectFilterObject.tenants) {
                vm.selectBinding.tenants = tenantService.query(vm.selectFilterObject.tenants, '_id name');
            }

            vmh.clientData.getJson('subsystem').then(function (items) {
                vm.selectBinding.subsystems = _.where(items, {mtype: 'business'});
                if (vm.selectBinding.subsystems && vm.selectBinding.subsystems.length > 0) {
                    vmc.selectedSubsystem = vm.selectBinding.subsystems[0];
                    onSubsystemChanged();
                }
            });

            if(vm.switches.setTenantOpenFuncs) {
                vmc.selectedTenantId = $scope.$stateParams.tenantId;//设置选中的租户
            }

            vmc.onTenantIdChanged = onTenantIdChanged;
            vmc.onSubsystemChanged = onSubsystemChanged;
            vmc.createFunc = createFunc;
            vmc.totalCharge = totalCharge;
            vmc.save = save;

            function onTenantIdChanged(){
                $scope.$state.go(vm.moduleRoute(), {tenantId: vmc.selectedTenantId});
            }

            function onSubsystemChanged() {

                var getTenantOpenFuncsPromise;
                if(vm.switches.setTenantOpenFuncs) {
                    getTenantOpenFuncsPromise = vmh.fetch(tenantService.query({_id: vmc.selectedTenantId}, 'open_funcs'));
                }

                vmh.parallel([vmh.clientData.getJson(vmc.selectedSubsystem.menujson), funcService.query({subsystem_id:vmc.selectedSubsystem._id},'func_id charge','orderNo'), getTenantOpenFuncsPromise]).then(function (results) {
                    var totalFuncs = results[0];
                    vmc.chargedFuncs = results[1];
                    var charegedFuncIds = _.map(vmc.chargedFuncs,function(o){return o.func_id});

                    if(vm.switches.setTenantOpenFuncs) {
                        //按租户开通模块情景,需要将totalFuncs按照chargedFuncs进行过滤
                        vmh.treeFactory.pick(totalFuncs, function (theFunc) {
                            return _.contains(charegedFuncIds, theFunc._id);
                        });
                        vmc.marketChargedFuncs = vmc.chargedFuncs;
                        vmc.chargedFuncs = results[2][0].open_funcs;
                    }
                    if (totalFuncs.length > 0) {
                        vm.trees = [new vmh.treeFactory.sTree('tree1', totalFuncs, {mode: 'check'})];
                        vm.trees[0].checkedNodes = _.map(vmc.chargedFuncs, function (o) {
                            return vm.trees[0].findNodeById(o.func_id);
                        }).sort(function (node1, node2) {
                            return node1.attrs.orderNo - node2.attrs.orderNo
                        });
                    }
                    else {
                        vm.trees = [];

                        vmc.funcs = {};
                        totalCharge();
                    }
                });
            }

            function createFunc(node) {
                //console.log(node);
                //console.log(node.name + ':' + node.attrs.orderNo);
                var theOne = _.find(vmc.chargedFuncs, function (o) {
                    return o.func_id == node._id
                });
                var charge = 0, market_charge = 0;
                if (theOne) {
                    market_charge = charge = theOne.charge;
                }
                if (vm.switches.setTenantOpenFuncs) {
                    var theMarketOne = _.find(vmc.marketChargedFuncs, function (o) {
                        return o.func_id == node._id
                    });
                    if (theMarketOne) {
                        market_charge = theMarketOne.charge;
                    }
                }

                vmc.funcs[node._id] = {
                    func_id: node._id,
                    func_name: node.name,
                    subsystem_id: vmc.selectedSubsystem._id,
                    subsystem_name: vmc.selectedSubsystem.name,
                    market_charge: market_charge,
                    charge: charge,
                    orderNo: node.attrs.orderNo
                };
            }

            function totalCharge() {

                //console.log('totalCharge:');
                //console.log(vmc.funcs);

                var totals = 0;
                for (var k in vmc.funcs) {
                    totals += vmc.funcs[k].charge;
                }
                return totals;
            }

            function save() {
                if(vm.switches.setTenantOpenFuncs) {
                    vmh.exec(tenantService.update(vmc.selectedTenantId, {open_funcs: _.toArray(vmc.funcs)}));
                }
                else{
                    vmh.exec(funcService.bulkInsert(_.toArray(vmc.funcs), {subsystem_id: vmc.selectedSubsystem._id}));
                }
            }

            $scope.$on('tree:node:checkChange', function ($event, tree) {
                var _funcs = angular.copy(vmc.funcs);

                var checkedNodeIds = _.map(tree.checkedNodes, function (node) {
                    return node._id
                });


                for (var k in vmc.funcs) {
                    if (!_.contains(checkedNodeIds, k)) {
                        _funcs = _.omit(_funcs, k);
                    }
                }
                vmc.funcs = _funcs;

            });

        }
    }

})();
