/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/


(function() {
    'use strict';

    angular
        .module('app.routes')
        .config(routesConfig);

    routesConfig.$inject = ['$stateProvider', '$locationProvider', '$urlRouterProvider', 'RouteHelpersProvider'];
    function routesConfig($stateProvider, $locationProvider, $urlRouterProvider, helper){
        
        // Set the following to true to enable the HTML5 Mode
        // You may have to set <base> tag in index and a routing configuration in your server
        $locationProvider.html5Mode(false);

        // defaults to dashboard
        $urlRouterProvider.otherwise('/app/dashboard');


        // 
        // Application Routes
        // -----------------------------------   
        $stateProvider
            .state('app', {
              url: '/app',
              abstract: true,
              templateUrl: helper.basepath('app.html'),
              resolve: helper.resolveFor('modernizr', 'icons','moment','locale_zh-cn')
            })
            .state('app.dashboard', {
              url: '/dashboard',
              title: '数据面板',
              templateUrl: helper.basepath('dashboard.html')
            })
            .state('app.submenu', {
              url: '/submenu',
              title: 'Submenu',
              templateUrl: helper.basepath('submenu.html')
            })
            // 机构养老云开始
            .state('app.organization-pfta', {
                url: '/organization-pfta',
                abstract: true,
                template: '<div class="data-ui-view subsystem-wrapper"></div>'
            })
            .state('app.organization-pfta.oldman-enter-manage', {
                url: '/oldman-enter-manage',
                title: '老人入院管理',
                templateUrl: helper.basepath('organization-pfta/oldman-enter-manage.html')
            })
            .state('app.organization-pfta.oldman-in-manage', {
                url: '/oldman-in-manage',
                title: '老人在院管理',
                templateUrl: helper.basepath('organization-pfta/oldman-in-manage.html')
            })
            .state('app.organization-pfta.oldman-exit-manage', {
                url: '/oldman-exit-manage',
                title: '老人入院管理',
                templateUrl: helper.basepath('organization-pfta/oldman-exit-manage.html')
            })
            .state('app.organization-pfta.oldman-reception-manage', {
                url: '/oldman-reception-manage',
                title: '老人接待管理',
                templateUrl: helper.basepath('organization-pfta/oldman-reception-manage.html')
            })
            .state('app.organization-pfta.oldman-leave-manage', {
                url: '/oldman-leave-manage',
                title: '老人请假管理',
                templateUrl: helper.basepath('organization-pfta/oldman-leave-manage.html')
            })
            .state('app.organization-pfta.financial-enter-payment', {
                url: '/financial-enter-payment',
                title: '入院缴费',
                templateUrl: helper.basepath('organization-pfta/financial-enter-payment.html')
            })
            .state('app.organization-pfta.financial-recharge', {
                url: '/financial-recharge',
                title: '账户充值',
                templateUrl: helper.basepath('organization-pfta/financial-recharge.html')
            })
            .state('app.organization-pfta.financial-arrearage-manage', {
                url: '/financial-arrearage-manage',
                title: '欠费管理',
                templateUrl: helper.basepath('organization-pfta/financial-arrearage-manage.html')
            })
            .state('app.organization-pfta.financial-payment-details', {
                url: '/financial-payment-details',
                title: '交费明细',
                templateUrl: helper.basepath('organization-pfta/financial-payment-details.html')
            })
            .state('app.organization-pfta.financial-exit-settlement', {
                url: '/financial-exit-settlement',
                title: '出院结算',
                templateUrl: helper.basepath('organization-pfta/financial-exit-settlement.html')
            })
            .state('app.organization-pfta.material-inventory-manage', {
                url: '/material-inventory-manage',
                title: '库存管理',
                templateUrl: helper.basepath('organization-pfta/material-inventory-manage.html')
            })
            .state('app.organization-pfta.material-donation-manage', {
                url: '/material-donation-manage',
                title: '捐赠管理',
                templateUrl: helper.basepath('organization-pfta/material-donation-manage.html')
            })
            .state('app.organization-pfta.knowledge-base-manage', {
                url: '/knowledge-base-manage',
                title: '知识库管理',
                templateUrl: helper.basepath('organization-pfta/knowledge-base-manage.html')
            }).state('app.organization-pfta.system-user-manage', {
                url: '/system-user-manage',
                title: '用户管理',
                templateUrl: helper.basepath('organization-pfta/system-user-manage.html')
            })
            .state('app.organization-pfta.system-department-manage', {
                url: '/system-department-manage',
                title: '部门管理',
                templateUrl: helper.basepath('organization-pfta/system-department-manage.html')
            })
            .state('app.organization-pfta.system-district-manage', {
                url: '/system-district-manage',
                title: '片区管理',
                templateUrl: helper.basepath('organization-pfta/system-district-manage.html')
            })
            .state('app.organization-pfta.system-bed-manage', {
                url: '/system-bed-manage',
                title: '床位管理',
                templateUrl: helper.basepath('organization-pfta/system-bed-manage.html')
            })
            .state('app.organization-pfta.system-log', {
                url: '/system-log',
                title: '系统日志',
                templateUrl: helper.basepath('organization-pfta/system-log.html')
            })
            // 管理中心开始
            .state('app.manage-center', {
                url: '/manage-center',
                abstract: true,
                template: '<div class="data-ui-view subsystem-wrapper"></div>'
            })
            .state('app.manage-center.metadata-dictionary-manage', {
                url: '/metadata-dictionary-manage',
                title: '字典管理',
                templateUrl: helper.basepath('manage-center/metadata-dictionary-manage.html')
            })
            .state('app.manage-center.metadata-param', {
                url: '/metadata-param',
                title: '系统参数',
                templateUrl: helper.basepath('manage-center/metadata-param.html')
            })
            .state('app.manage-center.tenant-account-manage', {
                url: '/tenant-account-manage',
                title: '租户管理',
                templateUrl: helper.basepath('manage-center/tenant-account-manage.html'),
                controller: 'GridController'
            })
            //演示中心开始
            .state('app.demo-center', {
                url: '/demo-center',
                abstract: true,
                template: '<div class="data-ui-view subsystem-wrapper"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                }
            })
            .state('app.demo-center.grid-basic', {
                url: '/grid-basic',
                abstract: true,
                template: '<div class="data-ui-view module-wrapper" ></div>'
            })
            .state('app.demo-center.grid-basic.list', {
                url: '/list/:action',
                title: '网格-基本-列表',
                templateUrl: helper.basepath('demo-center/grid-basic-list.html'),
                controller: 'DemoGridController',
                resolve: {
                    entry: helper.buildEntry('app.demo-center.grid-basic.list')
                }
            })
            .state('app.demo-center.grid-basic.details', {
                url: '/details/:action/:id',
                title: '网格-基本-详情',
                templateUrl: helper.basepath('demo-center/grid-basic-details.html'),
                controller: 'DemoGridDetailsController',
                resolve: {
                    entity: helper.buildEntity('app.demo-center.grid-basic.details')
                }
            })
            //
            // Single Page Routes
            // -----------------------------------
            .state('page', {
                url: '/page',
                templateUrl: 'app/pages/page.html',
                resolve: helper.resolveFor('modernizr', 'icons'),
                controller: ['$rootScope', function($rootScope) {
                    $rootScope.app.layout.isBoxed = false;
                }]
            })
            .state('page.login', {
                url: '/login',
                title: 'Login',
                templateUrl: 'app/pages/login.html'
            })
            .state('page.register', {
                url: '/register',
                title: 'Register',
                templateUrl: 'app/pages/register.html'
            })
            .state('page.recover', {
                url: '/recover',
                title: 'Recover',
                templateUrl: 'app/pages/recover.html'
            })
            .state('page.lock', {
                url: '/lock',
                title: 'Lock',
                templateUrl: 'app/pages/lock.html'
            })
            .state('page.404', {
                url: '/404',
                title: 'Not Found',
                templateUrl: 'app/pages/404.html'
            })
          // 
          // CUSTOM RESOLVES
          //   Add your own resolves properties
          //   following this object extend
          //   method
          // ----------------------------------- 
          // .state('app.someroute', {
          //   url: '/some_url',
          //   templateUrl: 'path_to_template.html',
          //   controller: 'someController',
          //   resolve: angular.extend(
          //     helper.resolveFor(), {
          //     // YOUR RESOLVES GO HERE
          //     }
          //   )
          // })
          ;

    } // routesConfig

})();

