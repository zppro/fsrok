/**=========================================================
 * Module: sidebar-menu.js
 * Handle sidebar collapsible elements
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.sidebar')
        .controller('SidebarController', SidebarController);

    SidebarController.$inject = ['$rootScope', '$scope', '$state', '$timeout','SidebarLoader', 'Utils', 'Auth'];
    function SidebarController($rootScope, $scope, $state, $timeout,SidebarLoader, Utils, Auth) {

        activate();

        ////////////////

        function activate() {
            var collapseList = [];

            // demo: when switch from collapse to hover, close all items
            $rootScope.$watch('app.layout.asideHover', function (oldVal, newVal) {
                if (newVal === false && oldVal === true) {
                    closeAllBut(-1);
                }
            });


            // Load subsystem from json file
            // -----------------------------------
            $scope.subsystem = {
                listIsOpen: false,
                init: function () {
                    var self = this;
                    SidebarLoader.getSubsystem(function (items) {
                        items = _.filter(items,checkUserType);
                        $scope.subsystem.available = _.filter(items,checkAuthorition);
                        angular.forEach($scope.subsystem.available, function (item) {
                            if (self.isActive(item)) {
                                $scope.subsystem.selected = item;
                            }
                        });

                        if(!$scope.subsystem.selected && $scope.subsystem.available.length>0) {
                            $scope.subsystem.selected = $scope.subsystem.available[0];
                        }

                        if ($scope.subsystem.selected) {
                            // Load menu from json file
                            SidebarLoader.getMenu($scope.subsystem.selected, sidebarReady);
                        }
                    });
                },
                switchSubsystem: function (item) {
                    $scope.subsystem.selected = item;
                    SidebarLoader.getMenu($scope.subsystem.selected, sidebarReady);
                },
                isActive: function (item) {
                    if (!item) return;
                    return $state.is(item.sref) || $state.includes(item.sref);
                }
            };
            $scope.subsystem.init();


            function sidebarReady(items) {
                $scope.menuItems = items;

                //打开第一层
                //$timeout(function(){
                //    _.each($scope.menuItems,function(item,i){
                //        if(item.submenu){
                //            console.log(i);
                //            if(i==0) {
                //                console.log(item);
                //                $scope.toggleCollapse(i, true);
                //            }
                //        }
                //    });
                //},2000);

            }

            $scope.$on('ngRepeatFinished:sidebar-group', function($event) {
                _.each($scope.menuItems, function (item, i) {
                    if (item.submenu) {
                        if (i == 0) {
                            $scope.toggleCollapse(i, true);
                        }
                    }
                });
            });

            // Handle sidebar and collapse items
            // ----------------------------------

            $scope.getMenuItemPropClasses = function (item) {
                return (item.heading ? 'nav-heading' : '') +
                    (isActive(item) ? ' active' : '');
            };

            $scope.addCollapse = function ($index, item) {
                collapseList[$index] = $rootScope.app.layout.asideHover ? true : !isActive(item);
            };

            $scope.isCollapse = function ($index) {
                return (collapseList[$index]);
            };


            function checkUserType(item) {
                return _.contains(item.usertype, Auth.getUser().type);
            }

            //可以检测subsystem和menu
            function checkAuthorition(item) {
                if (!item.sref || item.sref == '#') {
                    //父节点
                    if (item.submenu) {
                        return _.some(item.submenu, checkAuthorition);
                    }
                    else {
                        return false;
                    }
                }
                else {
                    var state = $state.get(item.sref) || {};
                    return Auth.isAuthorized(state.access_level || 0);
                }
            }

            $scope.isAuthorized = checkAuthorition;

            $scope.toggleCollapse = function ($index, isParentItem) {

                // collapsed sidebar doesn't toggle drodopwn
                if (Utils.isSidebarCollapsed() || $rootScope.app.layout.asideHover) return true;

                // make sure the item index exists
                if (angular.isDefined(collapseList[$index])) {
                    if (!$scope.lastEventFromChild) {
                        collapseList[$index] = !collapseList[$index];
                        closeAllBut($index);
                    }
                }
                else if (isParentItem) {
                    closeAllBut(-1);
                }

                $scope.lastEventFromChild = isChild($index);

                return true;

            };

            // Controller helpers
            // -----------------------------------

            // Check item and children active state
            function isActive(item) {

                if (!item) return;

                if (!item.sref || item.sref === '#') {
                    var foundActive = false;
                    angular.forEach(item.submenu, function (value) {
                        if (isActive(value)) foundActive = true;
                    });
                    return foundActive;
                }
                else
                    return $state.is(item.sref) || $state.includes(item.sref);
            }

            function closeAllBut(index) {
                index += '';
                for (var i in collapseList) {
                    if (index < 0 || index.indexOf(i) < 0)
                        collapseList[i] = true;
                }
            }

            function isChild($index) {
                /*jshint -W018*/
                return (typeof $index === 'string') && !($index.indexOf('-') < 0);
            }

        } // activate
    }

})();
