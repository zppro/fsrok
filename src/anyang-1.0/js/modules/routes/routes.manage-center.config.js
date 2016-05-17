/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/


(function() {
    'use strict';

    angular
        .module('app.routes')
        .config(routesManageCenterConfig);

    routesManageCenterConfig.$inject = ['$stateProvider', 'RouteHelpersProvider', 'AUTH_ACCESS_LEVELS','MODEL_VARIABLES'];
    function routesManageCenterConfig($stateProvider, helper, AUTH_ACCESS_LEVELS,MODEL_VARIABLES) {


        // 管理中心开始
        $stateProvider
            .state('app.manage-center', {
                url: '/manage-center',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                //template: '<div class="data-ui-view subsystem-wrapper"></div>',
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    , deps: helper.resolveFor2('subsystem.manage-center')
                }
            })
            .state('app.manage-center.pension-agency-account-manage', {
                url: '/pension-agency-account-manage',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {
                    selectFilterObject: {"type": ['A0001', 'A0002', 'A0003']}
                }
            })
            .state('app.manage-center.pension-agency-account-manage.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('manage-center/tenant-account-manage-list.html'),//复用页面
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                controller: 'GridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.manage-center.pension-agency-account-manage.list', {
                        modelName: 'pub-tenant',
                        searchForm: {"type": {"$in": ['A0001', 'A0002', 'A0003']}},
                        transTo: {
                            "user": 'app.manage-center.pension-agency-user-manage.list',
                            "openFuncs": 'app.manage-center.pension-agency-open-funcs',
                            "order":'app.manage-center.pension-agency-order-manage.list'
                        },
                        //切换客户端还是服务端分页
                        serverPaging: true,
                        columns: [
                            {
                                label: '养老机构名称',
                                name: 'name',
                                type: 'string',
                                width: 200,
                                sortable: true
                            },
                            {
                                label: '有效期至',
                                name: 'validate_util',
                                type: 'date',
                                width: 80
                            },
                            {
                                label: '开通',
                                name: 'active_flag',
                                type: 'bool',
                                width: 40
                            },
                            {
                                label: '认证',
                                name: 'certificate_flag',
                                type: 'bool',
                                width: 40
                            },
                            {
                                label: '手机号码',
                                name: 'phone',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '邮箱地址',
                                name: 'email',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '类型',
                                name: 'type',
                                type: 'string',
                                sortable: true,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1002/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 80
                            }
                        ]
                    })
                }
            })
            .state('app.manage-center.pension-agency-account-manage.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('manage-center/tenant-account-manage-details.html'),
                controller: 'TenantAccountManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                resolve: {
                    entityVM: helper.buildEntityVM('app.manage-center.pension-agency-account-manage.details', {
                        modelName: 'pub-tenant'
                        , blockUI: true
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state('app.manage-center.pension-agency-user-manage', {
                url: '/pension-agency-user-manage',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {

                    selectFilterObject: {"tenants": {"type": {"$in": ['A0001', 'A0002', 'A0003']}}},
                    //treeFilterObject: {"type": ['A0001', 'A0002', 'A0003']}//使用tmg时的过滤 treeFilter[key]==treeNode[key]
                    treeFilterObject: {"type": {"$in": ['A0001', 'A0002', 'A0003']}} //使用tmp时的过滤
                }
            })
            .state('app.manage-center.pension-agency-user-manage.list', {
                url: '/list/:action/:tenantId',
                templateUrl: helper.basepath('manage-center/tenant-user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                controller: 'TenantUserManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.manage-center.pension-agency-user-manage.list', {
                        modelName: 'pub-user',
                        searchForm: {"status": 1,"type": 'A0002'},//user.type 养老机构用户
                        //切换客户端还是服务端分页
                        serverPaging: true,
                        columns: [
                            {
                                label: '所属',
                                name: 'tenantId',
                                type: 'string',
                                width: 120,
                                //sortable: true,
                                formatter: 'model-related:pub-tenant'
                            },
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
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '手机号码',
                                name: 'phone',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '停用',
                                name: 'stop_flag',
                                type: 'bool',
                                width: 40
                            },
                            {
                                label: '类型',
                                name: 'type',
                                type: 'string',
                                sortable: true,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1000/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true},
                        toDetails: ['tenantId']
                    })
                }
            })
            .state('app.manage-center.pension-agency-user-manage.details', {
                url: '/details/:action/:_id/:tenantId',
                templateUrl: helper.basepath('manage-center/tenant-user-manage-details.html'),
                controller: 'TenantUserManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                resolve: {
                    entityVM: helper.buildEntityVM('app.manage-center.pension-agency-user-manage.details', {
                        modelName: 'pub-user',
                        model: {type:'A0002'},
                        blockUI: true,
                        toList: ['tenantId']
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state('app.manage-center.pension-agency-open-funcs', {
                url: '/pension-agency-open-funcs/:tenantId',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('manage-center/func.html'),
                        controller: 'FuncController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.manage-center.pension-agency-open-funcs'),
                            deps: helper.resolveFor2('angularjs-slider')
                        }
                    }
                },
                data: {
                    selectFilterObject: {"tenants": {"type": {"$in": ['A0001', 'A0002', 'A0003']}}}
                }
            })
            .state('app.manage-center.pension-agency-order-manage', {
                url: '/pension-agency-order-manage',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {

                    selectFilterObject: {"tenants": {"type": {"$in": ['A0001', 'A0002', 'A0003']}}},
                    //treeFilterObject: {"type": ['A0001', 'A0002', 'A0003']}//使用tmg时的过滤 treeFilter[key]==treeNode[key]
                    treeFilterObject: {"type": {"$in": ['A0001', 'A0002', 'A0003']}} //使用tmp时的过滤
                }
            })
            .state('app.manage-center.pension-agency-order-manage.list', {
                url: '/list/:action/:tenantId',
                templateUrl: helper.basepath('manage-center/tenant-order-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                controller: 'TenantOrderManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.manage-center.pension-agency-order-manage.list', {
                        modelName: 'pub-order',
                        searchForm: {"type": 'TP'},//养老机构产生的订单
                        //切换客户端还是服务端分页
                        serverPaging: true,
                        rowHeight: 60,
                        columns: [
                            {
                                label: '所属',
                                name: 'tenantId',
                                type: 'string',
                                width: 120,
                                //sortable: true,
                                formatter: 'model-related:pub-tenant'
                            },
                            {
                                label: '订单编号',
                                name: 'full_code',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '下单时间',
                                name: 'check_in_time',
                                type: 'date',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '开通时间',
                                name: 'success_on',
                                type: 'date',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '单价',
                                name: 'period_charge',
                                type: 'currency',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '数量(月)',
                                name: 'duration',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '总价',
                                name: 'total_charge',
                                type: 'currency',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '订单状态',
                                name: 'order_status',
                                type: 'string',
                                sortable: true,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1005/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true},
                        toDetails: ['tenantId']
                    })
                }
            })
            .state('app.manage-center.pension-agency-order-manage.details', {
                url: '/details/:action/:_id/:tenantId',
                templateUrl: helper.basepath('manage-center/tenant-order-manage-details.html'),
                controller: 'TenantOrderManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                resolve: {
                    entityVM: helper.buildEntityVM('app.manage-center.pension-agency-order-manage.details', {
                        modelName: 'pub-order',
                        model: {
                            code: MODEL_VARIABLES.PRE_DEFINED.SERVER_GEN,
                            type: 'TP',
                            period_charge: 0,
                            duration: 1
                        },
                        blockUI: true,
                        toList: ['tenantId']
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state('app.manage-center.agent-account-manage', {
                url: '/agent-account-manage',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {
                    selectFilterObject: {"type": ['A1001', 'A1002']}
                }
            })
            .state('app.manage-center.agent-account-manage.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('manage-center/tenant-account-manage-list.html'),//复用页面
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                controller: 'GridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.manage-center.agent-account-manage.list', {
                        modelName: 'pub-tenant',
                        searchForm: {"type": {"$in": ['A1001', 'A1002']}},
                        transTo: {
                            "user": 'app.manage-center.agent-user-manage.list',
                            "openFuncs": 'app.manage-center.agent-open-funcs',
                            "order": 'app.manage-center.agent-order-manage.list'
                        },
                        //切换客户端还是服务端分页
                        serverPaging: true,
                        columns: [
                            {
                                label: '代理商名称',
                                name: 'name',
                                type: 'string',
                                width: 200,
                                sortable: true
                            },
                            {
                                label: '有效期至',
                                name: 'validate_util',
                                type: 'date',
                                width: 80
                            },
                            {
                                label: '开通',
                                name: 'active_flag',
                                type: 'bool',
                                width: 40
                            },
                            {
                                label: '认证',
                                name: 'certificate_flag',
                                type: 'bool',
                                width: 40
                            },
                            {
                                label: '手机号码',
                                name: 'phone',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '邮箱地址',
                                name: 'email',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '类型',
                                name: 'type',
                                type: 'string',
                                sortable: true,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1002/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 80
                            }
                        ]
                    })
                }
            })
            .state('app.manage-center.agent-account-manage.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('manage-center/tenant-account-manage-details.html'),
                controller: 'TenantAccountManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                resolve: {
                    entityVM: helper.buildEntityVM('app.manage-center.agent-account-manage.details', {
                        modelName: 'pub-tenant'
                        , blockUI: true
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state('app.manage-center.agent-user-manage', {
                url: '/agent-user-manage',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {
                    //selectFilterObject: {"type": ['A1001', 'A1002']},
                    selectFilterObject: {"tenants": {"type": {"$in": ['A1001', 'A1002']}}},//tenant.type
                    //treeFilterObject: {"type": ['A1001', 'A1002']}//使用tmg时的过滤 treeFilter[key]==treeNode[key]
                    treeFilterObject: {"type": {"$in": ['A1001', 'A1002']}} //使用tmp时的过滤
                }
            })
            .state('app.manage-center.agent-user-manage.list', {
                url: '/list/:action/:tenantId',
                templateUrl: helper.basepath('manage-center/tenant-user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                controller: 'TenantUserManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.manage-center.agent-user-manage.list', {
                        modelName: 'pub-user',
                        searchForm: {"status": 1,"type": 'A0003'},//user.type 代理商用户
                        //切换客户端还是服务端分页
                        serverPaging: true,
                        columns: [
                            {
                                label: '所属',
                                name: 'tenantId',
                                type: 'string',
                                width: 120,
                                //sortable: true,
                                formatter: 'model-related:pub-tenant'
                            },
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
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '手机号码',
                                name: 'phone',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '停用',
                                name: 'stop_flag',
                                type: 'bool',
                                width: 40
                            },
                            {
                                label: '类型',
                                name: 'type',
                                type: 'string',
                                sortable: true,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1000/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true},
                        toDetails: ['tenantId']
                    })
                }
            })
            .state('app.manage-center.agent-user-manage.details', {
                url: '/details/:action/:_id/:tenantId',
                templateUrl: helper.basepath('manage-center/tenant-user-manage-details.html'),
                controller: 'TenantUserManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                resolve: {
                    entityVM: helper.buildEntityVM('app.manage-center.agent-user-manage.details', {
                        modelName: 'pub-user',
                        model: {type: 'A0003'},//D1000
                        blockUI: true,
                        toList: ['tenantId']
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state('app.manage-center.agent-open-funcs', {
                url: '/agent-open-funcs/:tenantId',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('manage-center/func.html'),
                        controller: 'FuncController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.manage-center.agent-open-funcs'),
                            deps: helper.resolveFor2('angularjs-slider')
                        }
                    }
                },
                data: {
                    selectFilterObject: {"tenants": {"type": {"$in": ['A1001', 'A1002']}}}
                }
            })
            .state('app.manage-center.agent-order-manage', {
                url: '/agent-order-manage',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {
                    selectFilterObject: {"tenants": {"type": {"$in": ['A1001', 'A1002']}}},
                    //treeFilterObject: {"type": ['A1001', 'A1002']}//使用tmg时的过滤 treeFilter[key]==treeNode[key]
                    treeFilterObject: {"type": {"$in": ['A1001', 'A1002']}} //使用tmp时的过滤
                }
            })
            .state('app.manage-center.agent-order-manage.list', {
                url: '/list/:action/:tenantId',
                templateUrl: helper.basepath('manage-center/tenant-order-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                controller: 'TenantOrderManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.manage-center.agent-order-manage.list', {
                        modelName: 'pub-order',
                        searchForm: {"type": 'TA'},//代理产生的订单
                        //切换客户端还是服务端分页
                        serverPaging: true,
                        rowHeight: 60,
                        columns: [
                            {
                                label: '所属',
                                name: 'tenantId',
                                type: 'string',
                                width: 120,
                                //sortable: true,
                                formatter: 'model-related:pub-tenant'
                            },
                            {
                                label: '订单编号',
                                name: 'full_code',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '下单时间',
                                name: 'check_in_time',
                                type: 'date',
                                width: 80
                            },
                            {
                                label: '开通时间',
                                name: 'success_on',
                                type: 'date',
                                width: 80
                            },
                            {
                                label: '单价',
                                name: 'period_charge',
                                type: 'currency',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '数量(月)',
                                name: 'duration',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '总价',
                                name: 'total_charge',
                                type: 'currency',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '订单状态',
                                name: 'order_status',
                                type: 'string',
                                sortable: true,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1005/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true},
                        toDetails: ['tenantId']
                    })
                }
            })
            .state('app.manage-center.agent-order-manage.details', {
                url: '/details/:action/:_id/:tenantId',
                templateUrl: helper.basepath('manage-center/tenant-order-manage-details.html'),
                controller: 'TenantOrderManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                resolve: {
                    entityVM: helper.buildEntityVM('app.manage-center.agent-order-manage.details', {
                        modelName: 'pub-order',
                        model: {
                            code: MODEL_VARIABLES.PRE_DEFINED.SERVER_GEN,
                            type: 'TA',
                            period_charge: 0,
                            duration: 1
                        },
                        blockUI: true,
                        toList: ['tenantId']
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state('app.manage-center.platform-user-manage', {
                url: '/platform-user-manage',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                }
            })
            .state('app.manage-center.platform-user-manage.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('manage-center/tenant-user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                controller: 'TenantUserManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.manage-center.platform-user-manage.list', {
                        modelName: 'pub-user',
                        searchForm: {"status": 1,"type": 'A0001'},//user.type 平台用户
                        //切换客户端还是服务端分页
                        serverPaging: true,
                        columns: [
                            {
                                label: '所属',
                                name: 'tenantId',
                                type: 'string',
                                width: 120,
                                hidden: true
                            },
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
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '手机号码',
                                name: 'phone',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '停用',
                                name: 'stop_flag',
                                type: 'bool',
                                width: 40
                            },
                            {
                                label: '类型',
                                name: 'type',
                                type: 'string',
                                sortable: true,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1000/object')
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
            .state('app.manage-center.platform-user-manage.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('manage-center/tenant-user-manage-details.html'),
                controller: 'TenantUserManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                resolve: {
                    entityVM: helper.buildEntityVM('app.manage-center.platform-user-manage.details', {
                        modelName: 'pub-user',
                        model: {type: 'A0001'},//D1000
                        blockUI: true
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state('app.manage-center.func', {
                url: '/func',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('manage-center/func.html'),
                        controller: 'FuncController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.manage-center.func'),
                            deps: helper.resolveFor2('angularjs-slider')
                        }
                    }
                }
            })
            .state('app.manage-center.order-receipt-confirmation', {
                url: '/order-receipt-confirmation',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                }
            })
            .state('app.manage-center.order-receipt-confirmation.list', {
                url: '/list/:action/:tenantId',
                templateUrl: helper.basepath('manage-center/order-receipt-confirmation-list.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                controller: 'OrderReceiptConfirmationGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.manage-center.order-receipt-confirmation.list', {
                        modelName: 'pub-order',
                        searchForm: {"order_status": {"$in": ['A1002', 'A1003', 'A1004']}},//等待客户付款,财务确认收款,交易成功
                        transTo: {
                            "TP": 'app.manage-center.pension-agency-order-manage.details',
                            "TA": 'app.manage-center.agent-order-manage.details'
                        },
                        //切换客户端还是服务端分页
                        serverPaging: true,
                        rowHeight: 60,
                        columns: [
                            {
                                label: '所属',
                                name: 'tenantId',
                                type: 'string',
                                width: 120,
                                //sortable: true,
                                formatter: 'model-related:pub-tenant'
                            },
                            {
                                label: '订单编号',
                                name: 'full_code',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '下单时间',
                                name: 'check_in_time',
                                type: 'date',
                                width: 80
                            },
                            {
                                label: '开通时间',
                                name: 'success_on',
                                type: 'date',
                                width: 80
                            },
                            {
                                label: '单价',
                                name: 'period_charge',
                                type: 'currency',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '数量(月)',
                                name: 'duration',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '总价',
                                name: 'total_charge',
                                type: 'currency',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '订单状态',
                                name: 'order_status',
                                type: 'string',
                                sortable: true,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1005/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true},
                        toDetails: ['tenantId']
                    })
                }
            })
            .state('app.manage-center.order-refund-confirmation', {
                url: '/order-refund-confirmation',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/manage-center/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                }
            })
            .state('app.manage-center.order-refund-confirmation.list', {
                url: '/list/:action/:tenantId',
                templateUrl: helper.basepath('manage-center/order-refund-confirmation-list.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                controller: 'OrderRefundConfirmationGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.manage-center.order-refund-confirmation.list', {
                        modelName: 'pub-order',
                        searchForm: {"order_status": {"$in": ['A1006', 'A1007']}},//等待退款,退款成功
                        transTo: {
                            "TP": 'app.manage-center.pension-agency-order-manage.details',
                            "TA": 'app.manage-center.agent-order-manage.details'
                        },
                        //切换客户端还是服务端分页
                        serverPaging: true,
                        rowHeight: 60,
                        columns: [
                            {
                                label: '所属',
                                name: 'tenantId',
                                type: 'string',
                                width: 120,
                                //sortable: true,
                                formatter: 'model-related:pub-tenant'
                            },
                            {
                                label: '订单编号',
                                name: 'full_code',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '下单时间',
                                name: 'check_in_time',
                                type: 'date',
                                width: 80
                            },
                            {
                                label: '开通时间',
                                name: 'success_on',
                                type: 'date',
                                width: 80
                            },
                            {
                                label: '单价',
                                name: 'period_charge',
                                type: 'currency',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '数量(月)',
                                name: 'duration',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '总价',
                                name: 'total_charge',
                                type: 'currency',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '订单状态',
                                name: 'order_status',
                                type: 'string',
                                sortable: true,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1005/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true},
                        toDetails: ['tenantId']
                    })
                }
            })
            .state('app.manage-center.metadata-dictionary-manage', {
                url: '/metadata-dictionary-manage',
                title: '字典管理',
                templateUrl: helper.basepath('manage-center/metadata-dictionary-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN
            })
            .state('app.manage-center.metadata-param', {
                url: '/metadata-param',
                title: '系统参数',
                templateUrl: helper.basepath('manage-center/metadata-param.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN
            })
        ;

    } // routesConfig

})();

