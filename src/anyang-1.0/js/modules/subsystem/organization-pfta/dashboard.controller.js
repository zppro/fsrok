/**
 * dashboard Created by zppro on 16-7-22.
 * Target:机构养老云中系统管理员以上看的数据面板（俯瞰图）
 */
(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('DashboardControllerOfOrganizationOfPFTAController', DashboardControllerOfOrganizationOfPFTAController)
    ;

    DashboardControllerOfOrganizationOfPFTAController.$inject = ['$parse', '$scope', '$echarts','vmh', 'instanceVM'];

    function DashboardControllerOfOrganizationOfPFTAController($parse, $scope, $echarts,vmh, vm) {
        $scope.vm = vm;

        init();

        function init() {

            vm.init();

            $scope.pie_id = $echarts.generateInstanceIdentity();
            $scope.pie_config = {
                title: {
                    text: '年龄分布',
                    subtext: 'XXX机构',
                    x: 'center'
                },
                tooltip: {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    orient: 'vertical',
                    left: 'left',
                    data: ["60岁以下", "60-69岁", "70-79岁", '80岁及以上']
                },
                series: [
                    {
                        name: '访问来源',
                        type: 'pie',
                        radius: '55%',
                        center: ['50%', '60%'],
                        data: [
                            {value: 335, name: '60岁以下'},
                            {value: 310, name: '60-69岁'},
                            {value: 234, name: '70-79岁'},
                            {value: 135, name: '80岁及以上'}
                        ],
                        itemStyle: {
                            emphasis: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };


        }
    }

})();