(function() {
    'use strict';

    angular
        .module('app.settings')
        .run(settingsRun);

    settingsRun.$inject = ['$rootScope', '$localStorage','SETTING_KEYS'];

    function settingsRun($rootScope, $localStorage,SETTING_KEYS) {

        // Global Settings
        // -----------------------------------
        $rootScope.app = {
            name: 'anyang',
            description: '$$',//安养养老管理系统
            year: ((new Date()).getFullYear()),
            layout: {
                isFixed: true,
                isCollapsed: false,
                isBoxed: false,
                isRTL: false,
                horizontal: false,
                isFloat: false,
                asideHover: false,
                theme: null
            },
            useFullLayout: false,
            hiddenFooter: false,
            offsidebarOpen: false,
            asideToggled: false,
            viewAnimation: 'ng-fadeInUp',
            subsystem: {
                organization_pfta: {currentSubsystemSref: SETTING_KEYS.SREF_ORGANIZATION_PFTA},
                manage_center: {currentSubsystemSref: SETTING_KEYS.SREF_MANAGE_CENTER}
            }
        };

        // Setup the layout mode
        $rootScope.app.layout.horizontal = ( $rootScope.$stateParams.layout === 'app-h');

        // Restore layout settings [*** UNCOMMENT TO ENABLE ***]
        // if( angular.isDefined($localStorage.layout) )
        //   $rootScope.app.layout = $localStorage.layout;
        // else
        //   $localStorage.layout = $rootScope.app.layout;
        //
        // $rootScope.$watch('app.layout', function () {
        //   $localStorage.layout = $rootScope.app.layout;
        // }, true);

        // Close submenu when sidebar change from collapsed to normal
        $rootScope.$watch('app.layout.isCollapsed', function (newValue) {
            if (newValue === false)
                $rootScope.$broadcast('closeSidebarMenu');
        });

        //初始化标题
        $rootScope.currTitle = $rootScope.app.name + ' - ' + ($rootScope.currTitle || $rootScope.app.description);
    }

})();
