(function() {
    'use strict';

    angular
        .module('app.sidebar')
        .service('SidebarLoader', SidebarLoader);

    SidebarLoader.$inject = ['$http'];
    function SidebarLoader($http) {
        this.getSubsystem = getSubsystem;
        this.getMenu = getMenu;

        ////////////////
        function getSubsystem(onReady, onError) {
            var subsystemJson = 'server/sidebar-subsystem.json',
                subsystemURL  = subsystemJson + '?v=' + (new Date().getTime()); // jumps cache

            onError = onError || function() { alert('Failure loading subsystem'); };

            $http
                .get(subsystemURL)
                .success(onReady)
                .error(onError);
        }

        function getMenu(subsystemItem,onReady, onError) {
            var menuURL = subsystemItem.menujson + '?v=' + (new Date().getTime()); // jumps cache
            onError = onError || function () {
                    alert('Failure loading menu');
                };

            $http
                .get(menuURL)
                .success(onReady)
                .error(onError);
        }
    }
})();