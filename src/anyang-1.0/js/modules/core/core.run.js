(function() {
    'use strict';

    angular
        .module('app.core')
        .run(appRun);

    appRun.$inject = ['$rootScope', '$q','$state', '$stateParams',  '$window', '$translate','$templateCache','$timeout','cfpLoadingBar', 'Colors','Auth','Notify'];
    
    function appRun($rootScope,$q, $state, $stateParams, $window,$translate, $templateCache,$timeout, cfpLoadingBar,Colors,Auth,Notify) {

        // Set reference to access them from any scope
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.$storage = $window.localStorage;
        $rootScope.$translate = $translate;

        // Uncomment this to disable template cache
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            if (toState.name.indexOf('page.')!=-1 ) {
                //所有page开头的状态不需要登录
                // doe she/he try to go to login? - let him/her go
                return;
            }
            if(toState.access_level) {

                if (Auth.isAuthenticated()) {
                    if (toState.name === 'app.dashboard') {
                        return;
                    }
                    // 用户登录了，但没有访问当前视图的权限
                    if (!Auth.isAuthorized(toState.access_level) || !Auth.isPermit(toState.name)) {
                        event.preventDefault();

                        $state.go('app.dashboard');

                        $timeout(function () {
                            cfpLoadingBar.complete();
                        }, 100);

                        return;

                    }
                    return;
                } else {
                    event.preventDefault();
                    $state.go('page.login');
                    return;
                }
            }
         });

        // Allows to use branding color with interpolation
        // {{ colorByName('primary') }}
        $rootScope.colorByName = Colors.byName;

        // cancel click event easily
        $rootScope.cancel = function ($event) {
            $event.stopPropagation();
        };




        // Hooks Example
        // -----------------------------------

        // hook 服务响应


        $rootScope.$on('auth:401',function (event) {
            console.log('auth:401');
            $state.go('page.login');
        });

        $rootScope.$on('server:500',function (event,err) {
            var errCode = '0';
            if (err.indexOf('E11000') == 0) {
                errCode = 'E11000';
            }
            $translate('error.server.mongodb.' + errCode).then(function (errText) {
                Notify.alert('<div class="text-center"><em class="fa fa-error"></em> ' + (errCode == 0 ? errText + ':' + err : errText) + '</div>', 'danger');
            });
        });

        // Hook not found
        $rootScope.$on('$stateNotFound',
            function (event, unfoundState/*, fromState, fromParams*/) {
                console.log(unfoundState.to); // "lazy.state"
                console.log(unfoundState.toParams); // {a:1, b:2}
                console.log(unfoundState.options); // {inherit:false} + default options
            });
        // Hook error
        $rootScope.$on('$stateChangeError',
            function (event, toState, toParams, fromState, fromParams, error) {
                console.log(error);
            });
        // Hook success
        $rootScope.$on('$stateChangeSuccess',
            function (/*event, toState, toParams, fromState, fromParams*/) {
                // display new view from top
                $window.scrollTo(0, 0);
                if($state.current.title){
                    $rootScope.currTitle = $rootScope.app.name + ' - ' + $state.current.title;
                }
                else{
                    $translate($state.current.name+'.TITLE').then(function(translated){
                        $rootScope.currTitle = $rootScope.app.name + ' - ' + translated;
                    });
                }

            });



        // Load a title dynamically
        //$rootScope.currTitle = $state.current.title;
        //$rootScope.pageTitle = function () {
        //    var title = $rootScope.app.name + ' - ' + ($rootScope.currTitle || $rootScope.app.description);
        //    document.title = title;
        //    return title;
        //};

    }

})();

