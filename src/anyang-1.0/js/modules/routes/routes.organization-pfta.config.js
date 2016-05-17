/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/


(function() {
    'use strict';

    angular
        .module('app.routes')
        .config(routesOrganizationPFTAConfig);

    routesOrganizationPFTAConfig.$inject = ['$stateProvider', 'RouteHelpersProvider', 'AUTH_ACCESS_LEVELS','MODEL_VARIABLES'];
    function routesOrganizationPFTAConfig($stateProvider, helper, AUTH_ACCESS_LEVELS,MODEL_VARIABLES) {


        // 机构养老云开始
        $stateProvider
            .state('app.organization-pfta', {
                url: '/organization-pfta',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.USER,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    , deps: helper.resolveFor2('subsystem.organization-pfta')
                }
            })
            .state('app.organization-pfta.enter-manage', {
                url: '/enter-manage',
                title: '入院管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.ENTER-MANAGE'//业务系统使用
                }
            })
            .state('app.organization-pfta.enter-manage.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/enter-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'EnterManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.enter-manage.list', {
                        modelName: 'pfta-enter',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '入院登记号',
                                name: 'code',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '老人',
                                name: 'elderly_summary',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '入院日期',
                                name: 'enter_on',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '预付款',
                                name: 'deposit',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '当前步骤',
                                name: 'current_register_step',
                                type: 'string',
                                width: 80,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D3000/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 40
                            }
                        ]
                    })
                }
            })
            .state('app.organization-pfta.enter-manage.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-pfta/enter-manage-details.html'),
                controller: 'EnterManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.USER,
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.enter-manage.details', {
                        modelName: 'pfta-enter',
                        model: {
                            code: MODEL_VARIABLES.PRE_DEFINED.SERVER_GEN,
                            enter_on: new Date(),
                            period_value_in_advance: 1
                        },
                        blockUI: true
                    })
                }
            })
            .state('app.organization-pfta.oldman-in-manage', {
                url: '/oldman-in-manage',
                title: '老人在院管理',
                templateUrl: helper.basepath('organization-pfta/oldman-in-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.oldman-exit-manage', {
                url: '/oldman-exit-manage',
                title: '老人入院管理',
                templateUrl: helper.basepath('organization-pfta/oldman-exit-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.oldman-reception-manage', {
                url: '/oldman-reception-manage',
                title: '老人接待管理',
                templateUrl: helper.basepath('organization-pfta/oldman-reception-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.oldman-leave-manage', {
                url: '/oldman-leave-manage',
                title: '老人请假管理',
                templateUrl: helper.basepath('organization-pfta/oldman-leave-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.financial-enter-payment', {
                url: '/financial-enter-payment',
                title: '入院缴费',
                templateUrl: helper.basepath('organization-pfta/financial-enter-payment.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.financial-recharge', {
                url: '/financial-recharge',
                title: '账户充值',
                templateUrl: helper.basepath('organization-pfta/financial-recharge.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.financial-arrearage-manage', {
                url: '/financial-arrearage-manage',
                title: '欠费管理',
                templateUrl: helper.basepath('organization-pfta/financial-arrearage-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.financial-payment-details', {
                url: '/financial-payment-details',
                title: '交费明细',
                templateUrl: helper.basepath('organization-pfta/financial-payment-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.financial-exit-settlement', {
                url: '/financial-exit-settlement',
                title: '出院结算',
                templateUrl: helper.basepath('organization-pfta/financial-exit-settlement.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.material-inventory-manage', {
                url: '/material-inventory-manage',
                title: '库存管理',
                templateUrl: helper.basepath('organization-pfta/material-inventory-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.material-donation-manage', {
                url: '/material-donation-manage',
                title: '捐赠管理',
                templateUrl: helper.basepath('organization-pfta/material-donation-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.knowledge-base-manage', {
                url: '/knowledge-base-manage',
                title: '知识库管理',
                templateUrl: helper.basepath('organization-pfta/knowledge-base-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.user-manage', {
                url: '/user-manage',
                title: '用户管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.USER-MANAGE'//业务系统使用
                }
            })
            .state('app.organization-pfta.user-manage.list', {
                url: '/list/:action/:roles',
                templateUrl: helper.basepath('organization-pfta/user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'UserManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.user-manage.list', {
                        modelName: 'pub-user',
                        searchForm: {"status": 1,"type": 'A0002'},//user.type 养老机构用户
                        serverPaging: true,
                        columns: [
                            {
                                label: '用户编码',
                                name: 'code',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '用户名称',
                                name: 'name',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '手机号码',
                                name: 'phone',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '停用',
                                name: 'stop_flag',
                                type: 'bool',
                                width: 40
                            },
                            {
                                label: '角色',
                                name: 'roles',
                                type: 'string',
                                width: 120,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1001/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true},
                        toDetails: ['roles']
                    })
                }
            })
            .state('app.organization-pfta.user-manage.details', {
                url: '/details/:action/:_id/:roles',
                templateUrl: helper.basepath('organization-pfta/user-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'UserManageDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.user-manage.details', {
                        modelName: 'pub-user',
                        model: {type:'A0002'},
                        blockUI: true,
                        toList: ['roles']
                    })
                }
            })
            .state('app.organization-pfta.system-department-manage', {
                url: '/system-department-manage',
                title: '部门管理',
                templateUrl: helper.basepath('organization-pfta/system-department-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.room-manage', {
                url: '/room-manage',
                title: '房间管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {
                    func_id:'menu.organization-pfta.ROOM-MANAGE',//业务系统使用
                    selectFilterObject: {"districts": {"status": 1}}
                }
            })
            .state('app.organization-pfta.room-manage.list', {
                url: '/list/:action/:districtId',
                templateUrl: helper.basepath('organization-pfta/room-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.room-manage.list', {
                        modelName: 'pfta-room',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '片区',
                                name: 'districtId',
                                type: 'string',
                                width: 200,
                                //sortable: true,
                                formatter: 'model-related:pfta-district'
                            },
                            {
                                label: '房间名称',
                                name: 'name',
                                type: 'string',
                                width: 200,
                                sortable: true
                            },
                            {
                                label: '所在层',
                                name: 'floor',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '床位数量',
                                name: 'capacity',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '停用',
                                name: 'stop_flag',
                                type: 'bool',
                                width: 40
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true},
                        toDetails: ['districtId']
                    })
                }
            })
            .state('app.organization-pfta.room-manage.details', {
                url: '/details/:action/:_id/:districtId',
                templateUrl: helper.basepath('organization-pfta/room-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomManageDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.room-manage.details', {
                        modelName: 'pfta-room',
                        model: {
                            capacity: 1
                        },
                        blockUI: true,
                        toList: ['districtId']
                    })
                }
            })
            .state('app.organization-pfta.room-manage.details-batch-add', {
                url: '/details-batch-add/:districtId',
                templateUrl: helper.basepath('organization-pfta/room-manage-details-batch-add.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomManageDetailsBatchAddController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.room-manage.details-batch-add', {
                        modelName: 'pfta-room',
                        model: {
                            capacity: 1
                        },
                        blockUI: true,
                        toList: ['districtId']
                    }),
                    deps: helper.resolveFor2('angularjs-slider')
                }
            })
            .state('app.organization-pfta.room-manage.details-batch-edit', {
                url: '/details-batch-edit/:districtId',
                templateUrl: helper.basepath('organization-pfta/room-manage-details-batch-edit.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomManageDetailsBatchEditController',
                params:{selectedIds:null},
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.room-manage.details-batch-edit', {
                        modelName: 'pfta-room',
                        model: {
                            capacity: 1
                        },
                        blockUI: true,
                        toList: ['districtId']
                    })
                }
            })
            .state('app.organization-pfta.district-manage', {
                url: '/district-manage',
                title: '片区管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.DISTRICT-MANAGE'//业务系统使用
                }
            })
            .state('app.organization-pfta.district-manage.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/district-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,

                controller: 'DistrictManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.district-manage.list', {
                        modelName: 'pfta-district',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '片区名称',
                                name: 'name',
                                type: 'string',
                                width: 320,
                                sortable: true
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ]
                    })
                }
            })
            .state('app.organization-pfta.district-manage.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-pfta/district-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'DistrictManageDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.district-manage.details', {
                        modelName: 'pfta-district'
                        , blockUI: true
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state('app.organization-pfta.charge-standard', {
                url: '/charge-standard',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('organization-pfta/charge-standard.html'),
                        controller: 'ChargeStandardController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.organization-pfta.charge-standard'),
                            deps: helper.resolveFor2('angularjs-slider')
                        }
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.CHARGE-STANDARD'//业务系统使用
                }
            })
            .state('app.organization-pfta.system-log', {
                url: '/system-log',
                title: '系统日志',
                templateUrl: helper.basepath('organization-pfta/system-log.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN
            })
        ;

    } // routesConfig

})();

