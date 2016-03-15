/**=========================================================
 * Module: helpers.js
 * Provides helper functions for routes definition
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.routes')
        .provider('RouteHelpers', RouteHelpersProvider)
    ;

    RouteHelpersProvider.$inject = ['APP_REQUIRES'];
    function RouteHelpersProvider(APP_REQUIRES) {

        /* jshint validthis:true */
        return {
            // provider access level
            basepath: basepath,
            resolveFor: resolveFor,
            buildVMHelper:buildVMHelper,
            buildEntry: buildEntry,
            buildEntity:buildEntity,
            // controller access level
            $get: function () {
                return {
                    basepath: basepath,
                    resolveFor: resolveFor,
                    buildVMHelper:buildVMHelper,
                    buildEntry: buildEntry,
                    buildEntity: buildEntity
                };
            }
        };

        // Set here the base of the relative path
        // for all app views
        function basepath(uri) {
            return 'app/views/' + uri;
        }

        // Generates a resolve object by passing script names
        // previously configured in constant.APP_REQUIRES
        function resolveFor() {
            var _args = arguments;
            return {
                deps: ['$ocLazyLoad', '$q', function ($ocLL, $q) {
                    // Creates a promise chain for each argument
                    var promise = $q.when(1); // empty promise
                    for (var i = 0, len = _args.length; i < len; i++) {
                        promise = andThen(_args[i]);
                    }
                    return promise;

                    // creates promise to chain dynamically
                    function andThen(_arg) {
                        // also support a function that returns a promise
                        if (typeof _arg === 'function')
                            return promise.then(_arg);
                        else
                            return promise.then(function () {
                                // if is a module, pass the name. If not, pass the array
                                var whatToLoad = getRequired(_arg);
                                // simple error check
                                if (!whatToLoad) return $.error('Route resolve: Bad resource name [' + _arg + ']');
                                // finally, return a promise
                                return $ocLL.load(whatToLoad);
                            });
                    }

                    // check and returns required data
                    // analyze module items with the form [name: '', files: []]
                    // and also simple array of script files (for not angular js)
                    function getRequired(name) {
                        if (APP_REQUIRES.modules)
                            for (var m in APP_REQUIRES.modules)
                                if (APP_REQUIRES.modules[m].name && APP_REQUIRES.modules[m].name === name)
                                    return APP_REQUIRES.modules[m];
                        return APP_REQUIRES.scripts && APP_REQUIRES.scripts[name];
                    }

                }]
            };
        } // resolveFor

        function buildVMHelper() {
            return ['$timeout','blockUI', 'cfpLoadingBar', 'GridDemoModelSerivce', 'GridUtils', 'ViewUtils', function ($timeout,blockUI, cfpLoadingBar, GridDemoModelSerivce, GridUtils, ViewUtils) {
                return {
                    timeout: $timeout,
                    loadingBar: cfpLoadingBar,
                    blockUI: blockUI.instances.get('module-block'),
                    demoModelSerivce: GridDemoModelSerivce,
                    utils: {
                        g: GridUtils,
                        v: ViewUtils
                    }
                };
            }];
        }

        function buildEntry(name,option) {
            option = option || {};
            var arrNames = name.split('.');
            return ['$state', '$stateParams', function ($state, $stateParams) {

                function add() {
                    $state.go(this.moduleRoute('details'), {
                        action: 'add',
                        id: 'new'
                    });
                }

                function edit(id) {
                    $state.go(this.moduleRoute('details'), {
                        action: 'edit',
                        id: id
                    });
                }

                function remove() {
                    var self =  this;
                    _.each(this.selectedRows,function(row) {
                        console.log(self.rows.length);
                        var index = _.indexOf(self.rows, row);
                        if (index != -1) {
                            self.rows.splice(index, 1);
                        }
                    });
                }

                function selectAll($event) {
                    if ($event.target.tagName == "INPUT" && $event.target.type == "checkbox") {
                        var $checkbox = angular.element($event.target);
                        if ($checkbox.prop('checked')) {
                            this.selectedRows = this.paged;
                        }
                        else {
                            this.selectedRows = [];
                        }
                        //console.log(this.selectedRows);
                    }
                }

                function selectRow($event, row) {
                    var data = angular.element($event.target).attr('data');
                    var $checkbox;
                    if (data != 'trBubble') {
                        //set checked
                        $checkbox = angular.element($event.currentTarget).find('td:first input[type="checkbox"]');
                        $checkbox.prop('checked', !$checkbox.prop('checked'));
                    }
                    else if ($event.target.tagName == "INPUT" && $event.target.type == "checkbox") {
                        $checkbox = angular.element($event.target);
                    }

                    if ($checkbox) {
                        var isContains = _.contains(this.selectedRows, row);
                        if ($checkbox.prop('checked') && !isContains) {
                            //加入选中
                            this.selectedRows.push(row);
                        }
                        else if (!$checkbox.prop('checked') && isContains) {
                            this.selectedRows = _.reject(this.selectedRows, function (one) {
                                return one == row;
                            });
                        }
                        //console.log(this.selectedRows);
                    }
                }

                function dblclickRow(id) {
                    edit(id);
                }
                return {
                    _system_: arrNames[0],
                    _subsystem_: arrNames[1],
                    _module_: arrNames[2],
                    _view_: arrNames[3],
                    _action_: $stateParams.action || 'query',
                    systemRoute:systemRoute,
                    subsystemRoute:subsystemRoute,
                    moduleRoute:moduleRoute,
                    viewRoute:viewRoute,
                    name: name || 'no-entryName',
                    pk: option.pk || 'id',
                    page: _.defaults(option, {size: 9, no: 1}),
                    sort: {
                        column: option.columnPK || this.pk,
                        direction: -1,
                        toggle: function (column) {
                            if (column.sortable === false)
                                return;

                            if (this.column === column.name) {
                                this.direction = -this.direction || -1;
                            } else {
                                this.column = column.name;
                                this.direction = -1;
                            }
                        }
                    },
                    columns: [],
                    rows: [],
                    add: add,
                    edit: edit,
                    remove: remove,
                    selectAll: selectAll,
                    selectRow: selectRow,
                    dblclickRow: dblclickRow,
                    openDP: openDP,
                    selectedRows: []
                };
            }];
        };

        function buildEntity(name,option) {
            option = option || {};
            var arrNames = name.split('.');
            return ['$state', '$stateParams', function ($state, $stateParams) {
                function cancel() {
                    $state.go(this.moduleRoute('list'));
                }

                return {
                    _system_: arrNames[0],
                    _subsystem_: arrNames[1],
                    _module_: arrNames[2],
                    _view_: arrNames[3],
                    _action_: $stateParams.action,
                    _id_: $stateParams.id,
                    systemRoute:systemRoute,
                    subsystemRoute:subsystemRoute,
                    moduleRoute:moduleRoute,
                    viewRoute:viewRoute,
                    name: name || 'no-entityName',
                    pk: option.pk || 'id',
                    model: {},
                    cancel: cancel,
                    openDP: openDP
                };
            }];
        };

        function processUrl() {
            var url = arguments.splice(0,1);
            var fragmentsLength = arguments.length-1;

            if (url.indexOf('.....') == 0) {
                return arguments.splice(1).join('.') + '.' + url;
            }
            else if (url.indexOf('....') == 0) {
                return arguments.splice(2).join('.') + '.' + url;
            }
        }

        ///日期popup
        function openDP($event,length,index) {
            $event.preventDefault();
            $event.stopPropagation();
            if(length == undefined){
                this.openedDP = true;
            }
            else {
                if (!this.openedDP) {
                    this.openedDP = _.map(_.range(length), function () {
                        return false;
                    });

                }
                this.openedDP[index] = true;
            }
        }

        function systemRoute(view) {
            return _.union([this._system_], Array.prototype.slice.call(arguments, 0)).join('.');
        }

        function subsystemRoute(view) {
            return _.union([this._system_, this._subsystem_], Array.prototype.slice.call(arguments, 0)).join('.');
        }

        function moduleRoute(view,action) {
            return _.union([this._system_, this._subsystem_, this._module_], Array.prototype.slice.call(arguments, 0)).join('.');
        }

        function viewRoute() {
            return _.union([this._system_, this._subsystem_, this._module_, this._view_], Array.prototype.slice.call(arguments, 0)).join('.');
        }

    }


})();

