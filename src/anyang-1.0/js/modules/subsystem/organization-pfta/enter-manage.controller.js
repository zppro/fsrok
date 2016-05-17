/**
 * system-district-manage.controller Created by zppro on 16-4-19.
 * Target:租户管理片区
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('EnterManageGridController', EnterManageGridController)
        .controller('EnterManageDetailsController', EnterManageDetailsController)
    ;


    EnterManageGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function EnterManageGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }

    EnterManageDetailsController.$inject = ['$scope','ngDialog','ORG_PFTA_CHARGE_ITEM', 'vmh', 'entityVM'];

    function EnterManageDetailsController($scope, ngDialog,ORG_PFTA_CHARGE_ITEM, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        var elderlyService = vm.modelNode.services['pub-elderly'];

        vm.elderlyModel = {};//id_no:'330501198106150610'

        init();

        function init() {

            vm.init();

            vm.doSubmit = doSubmit;
            vm.setBoardSummary = setBoardSummary;
            vm.setNursingSummary = setNursingSummary;
            vm.isSelected = isSelected;
            vm.sumPeriodPrice = sumPeriodPrice;
            vm.addElderlyFamilyMember = addElderlyFamilyMember;
            vm.editElderlyFamilyMember = editElderlyFamilyMember;
            vm.saveElderlyFamilyMember = saveElderlyFamilyMember;
            vm.cancelElderlyFamilyMember = cancelElderlyFamilyMember;
            vm.removeElderlyFamilyMember = removeElderlyFamilyMember;
            vm.checkElderlyFamilyMemberAll = checkElderlyFamilyMemberAll;
            vm.tab1 = {cid: 'contentTab1'};
            vm.tab2 = {cid: 'contentTab2'};
            vm.tab3 = {cid: 'contentTab3'};
            vm.tab4 = {cid: 'contentTab4'};


            vmh.parallel([
                vmh.shareService.d('D1006'),
                vmh.shareService.d('D1007'),
                vmh.shareService.d('D1008'),
                vmh.shareService.d('D1009'),
                vmh.shareService.d('D1010'),
                vmh.shareService.d('D1011'),
                vmh.shareService.d('D1012'),
                vmh.shareService.d('D1015'),
                vmh.extensionService.tenantInfo(vm.tenantId, 'charge_standard,charge_items'),
                vmh.clientData.getJson('charge-item-organization-pfta'),
                vm.load()
            ]).then(function (results) {
                vm.selectBinding.sex = results[0];
                vm.selectBinding.marriages = results[1];
                vm.selectBinding.medical_insurances = results[2];
                vm.selectBinding.politics_statuses = results[3];
                vm.selectBinding.inhabit_statuses = results[4];
                vm.selectBinding.financial_statuses = results[5];
                vm.selectBinding.relationsWithTheElderly = results[6];
                vm.period_map = {};
                _.each(results[7], function (o) {
                    vm.period_map[o.value] = o.name;
                });

                vm.elderlyModel.charge_standard = results[8].charge_standard;
                var charge_items = results[8].charge_items;
                vm.selectedStandard = _.findWhere(results[9], {_id: vm.elderlyModel.charge_standard});
                if (vm.selectedStandard) {

                    //将预订义收费标准模板替换为当前租户的收费标准
                    _.each(vm.selectedStandard.children, function (item) {
                        item.children = _.chain(item.children).map(function (o) {
                            var theChargeItem = _.findWhere(charge_items, {item_id: o._id});
                            if (o.data) {
                                theChargeItem = _.defaults(theChargeItem, {data: o.data});
                            }
                            return theChargeItem;
                        }).compact().value();
                    });

                    //伙食信息
                    var board_charge_item = _.findWhere(vm.selectedStandard.children, {_id: ORG_PFTA_CHARGE_ITEM.BOARD + '-' + vm.elderlyModel.charge_standard});
                    if (board_charge_item) {
                        vm.selectBinding.board_infos = board_charge_item.children;
                    }

                    //护理信息
                    var nursing_charge_item = _.findWhere(vm.selectedStandard.children, {_id: ORG_PFTA_CHARGE_ITEM.NURSING + '-' + vm.elderlyModel.charge_standard});
                    if (nursing_charge_item) {
                        vm.selectBinding.nursing_infos = nursing_charge_item.children;
                    }
                }

                //默认选中设置
                if (!vm.model.board_info && vm.selectBinding.board_infos.length == 1) {
                    vm.model.board_info = vm.selectBinding.board_infos[0].item_id;
                    vm.elderlyModel.board_summary = vm.selectBinding.board_infos[0].item_name;
                }


            })
            ;


            console.log(vm.model);
            if('$promise' in vm.model)
                console.log('2q3')

            vm.treeDataPromiseOfRoom = vmh.shareService.tmp('T3003', 'name', {
                tenantId: vm.tenantId,
                floorSuffix: 'F',
                bedNoSuffix: '#床'
            });

            vm.hobbiesPromise = vmh.shareService.d('D1013').then(function (hobbies) {
                vmh.utils.v.changeProperyName(hobbies, [{o: 'value', n: '_id'}]);
                return hobbies;
            });

            vm.medical_historiesPromise = vmh.shareService.d('D1014').then(function (medical_histories) {
                vmh.utils.v.changeProperyName(medical_histories, [{o: 'value', n: '_id'}]);
                return medical_histories;
            });

            vm.selectBinding.periodValues = _.range(1, 7);
            vm.load().then(function () {
                //if (!vm.model.period_value_in_advance) {
                //    vm.elderlyModel.f = 1;
                //}

                if (!vm.elderlyModel.family_members) {
                    vm.elderlyModel.family_members = [];
                }

                if(vm.model.elderlyId) {
                    vmh.fetch(elderlyService.get({_id: vm.model.elderlyId})).then(function (ret) {
                        vm.elderlyModel = ret;

                        //手工选中
                        _.each(vm.elderlyModel.charge_items,function(item) {
                            vm.selectionOfManualSelectable[item.item_id] = true;
                        });

                        //vm.treeDataPromiseOfRoom = vm.treeDataPromiseOfRoom;

                    });
                }
            });

            //vm.selectedBedNo = '5715e885b8a6a9fd24582211$101$2';

            $scope.$on('tree:node:select', function ($event, node,treeObject) {

                if (node.capacity) {
                    vm.roomCapacity = node.capacity;//房间类型选择
                    var arr = node._id.split('$');
                    vm.elderlyModel.room_value = {
                        districtId: arr[0],
                        roomId: arr[1],
                        bed_no: arr[2]
                    };

                    var $index = node.attrs.index;

                    var arrIndex = node.attrs.index.split(treeObject.levelSplitChar);
                    var data = treeObject.treeData;
                    vm.elderlyModel.room_summary = '';
                    for(var i=0;i<arrIndex.length;i++){
                        var currentNode = data[arrIndex[i]];
                        if(currentNode) {
                            vm.elderlyModel.room_summary += currentNode.name;
                            if(currentNode.children) {
                                vm.elderlyModel.room_summary += treeObject.levelSplitChar;
                                data = currentNode.children;
                            }
                        }
                    }
                }
            });

            vm.selected_charge_item_object = {};//对应vm.elderlyModel.charge_items 这个array
            vm.selectionOfManualSelectable = {};//item_id:true/false;
            vm.selectedChargeItem = {};

        }


        function isSelected(charge_item) {
            var selected = false;
            if (charge_item.data) {
                if (charge_item.data.capacity) {
                    //房间类型
                    if (angular.isArray(charge_item.data.capacity)) {
                        selected = _.contains(_.range(charge_item.data.capacity[0], charge_item.data.capacity[1]), vm.roomCapacity)
                    }
                    else {
                        selected = charge_item.data.capacity == vm.roomCapacity;
                    }
                }
                else if (charge_item.data.manual_seletable) {
                    //手工可选择
                    selected = vm.selectionOfManualSelectable[charge_item.item_id];
                }
            }
            else {
                selected = _.contains([vm.model.board_info, vm.model.nursing_info], charge_item.item_id);
            }

            if (selected) {
                vm.selectedChargeItem[charge_item.item_id] = charge_item.period_price;
                vm.selected_charge_item_object[charge_item.item_id] = charge_item;
            }
            else{
                delete vm.selectedChargeItem[charge_item.item_id];
                delete vm.selected_charge_item_object[charge_item.item_id];
            }
            return selected;
        }

        function setBoardSummary(board_info){
            vm.elderlyModel.board_summary = board_info.item_name;
        }

        function setNursingSummary(nursing_info){
            vm.elderlyModel.nursing_summary = nursing_info.item_name;
        }

        function doSubmit() {

            //获取charge_items


            if ($scope.theForm.$valid) {

                vm.elderlyModel.tenantId = vm.model.tenantId;
                vm.elderlyModel.charge_items = [];
                for(var charge_item_id in vm.selected_charge_item_object) {
                    vm.elderlyModel.charge_items.push(_.omit(vm.selected_charge_item_object[charge_item_id], '_id'));
                }

                var promise_elderly;
                if(!vm.model.elderlyId){
                    //老人信息没有保存，增加老人信息
                    console.log('create elderly...')
                    promise_elderly = vmh.fetch(elderlyService.save(vm.elderlyModel)).then(function(ret){
                        vm.model.elderlyId = ret._id;
                    });
                }
                else {
                    console.log('update elderly...')
                    promise_elderly = vmh.fetch(elderlyService.update(vm.model.elderlyId, vm.elderlyModel));
                }

                promise_elderly.then(function(ret){



                    if(!vm.model.agent_info && vm.elderlyModel.family_members.length>0) {
                        vm.model.agent_info = _.omit(vm.elderlyModel.family_members[0], '_id');
                    }

                    vm.model.current_register_step = 'A0001';//登记入院信息
                    vm.model.elderly_summary = vm.elderlyModel.name;
                    vm.model.sum_period_price = vm.sumPeriodPrice();//期间费用汇总计算列

                    console.log('save enter...');
                    vm.save();
                });
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
                else if ($scope.utils.vtab(vm.tab2.cid)) {
                    vm.tab2.active = true;
                }
                else if ($scope.utils.vtab(vm.tab3.cid)) {
                    vm.tab3.active = true;
                }
                else if ($scope.utils.vtab(vm.tab4.cid)) {
                    vm.tab4.active = true;
                }
            }
        }

        function sumPeriodPrice() {
            var totals = 0;
            for (var item_id in vm.selectedChargeItem) {
                totals += vm.selectedChargeItem[item_id];
            }
            return totals;
        }

        function addElderlyFamilyMember() {
            if (!vm.$gridEditingOfElderlyFamilyMember) {
                vm.elderlyModel.family_members.push({sex: 'N', isNew: true, $editing: true})
                vm.$gridEditingOfElderlyFamilyMember = true;
            }
        }

        function editElderlyFamilyMember(row) {
            vm.editingRow = angular.copy(row);
            row.$editing = true;
            vm.$gridEditingOfElderlyFamilyMember = true;
        }

        function saveElderlyFamilyMember(row) {
            if(row.isNew) {
                row.isNew = false;
            }
            else{
                vm.editingRow = null;
            }
            row.$editing = false;
            vm.$gridEditingOfElderlyFamilyMember = false;
        }

        function cancelElderlyFamilyMember(row) {
            if(row.isNew) {
                vm.elderlyModel.family_members.splice(vm.elderlyModel.family_members.length - 1, 1);
            }
            else {
                _.extend(row, vm.editingRow);
            }
            row.$editing = false;
            vm.$gridEditingOfElderlyFamilyMember = false;
        }

        function removeElderlyFamilyMember() {
            var haveSelected = _.some(vm.elderlyModel.family_members, function (row) {
                return row.checked
            });
            if (!haveSelected) {

                return vmh.translate('notification.SELECT-NONE-WARNING').then(function (ret) {
                    vmh.notify.alert('<div class="text-center"><em class="fa fa-warning"></em> ' + ret + '</div>', 'warning');
                });
            }

            ngDialog.openConfirm({
                template: 'removeConfirmDialog.html',
                className: 'ngdialog-theme-default'
            }).then(function () {
                for(var i=0;i<vm.elderlyModel.family_members.length;i++) {
                    var row = vm.elderlyModel.family_members[i];
                    if (row.checked) {
                        vm.elderlyModel.family_members.splice(i, 1);
                        i--;
                    }
                }
            });
        }

        function checkElderlyFamilyMemberAll($event) {
            var rowCheckState = true;
            if ($event.target.tagName == "INPUT" && $event.target.type == "checkbox") {
                var $checkbox = angular.element($event.target);
                rowCheckState = $checkbox.prop('checked');
            }

            for(var i=0;i<vm.elderlyModel.family_members.length;i++) {
                vm.elderlyModel.family_members[i].checked = rowCheckState;
            }
        }
    }

})();