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
        var remoteServiceRoot;
        /* jshint validthis:true */
        return {
            // provider access level
            setRemoteServiceRoot: setRemoteServiceRoot,
            remoteServiceUrl: remoteServiceUrl,
            basepath: basepath,
            resolveFor: resolveFor,
            resolveFor2: resolveFor2,
            buildVMHelper: buildVMHelper,
            buildEntryVM: buildEntryVM,
            buildEntityVM: buildEntityVM,
            buildInstanceVM:buildInstanceVM,
            // controller access level
            $get: function () {
                return {
                    remoteServiceUrl: remoteServiceUrl,
                    basepath: basepath,
                    resolveFor: resolveFor,
                    resolveFor2: resolveFor2,
                    buildVMHelper: buildVMHelper,
                    buildEntryVM: buildEntryVM,
                    buildEntityVM: buildEntityVM,
                    uildInstanceVM: buildInstanceVM
                };
            }
        };

        ////以下接口方法

        function setRemoteServiceRoot(url){
            remoteServiceRoot = url;
        }

        function remoteServiceUrl(url) {
            return remoteServiceRoot + url;
        }

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

        function resolveFor2() {
            var _args = arguments;
            return ['$ocLazyLoad', '$q', function ($ocLL, $q) {
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
        } // resolveFor2

        function buildVMHelper() {
            return ['$timeout', '$q', '$http', 'blockUI', 'cfpLoadingBar', 'shareNode','GridUtils', 'ViewUtils', function ($timeout, $q, $http, blockUI, cfpLoadingBar, shareNode, GridUtils, ViewUtils) {

                return {
                    q: $q,
                    timeout: $timeout,
                    http: $http,
                    loadingBar: cfpLoadingBar,
                    blockUI: blockUI.instances.get('module-block'),
                    shareService: shareNode,
                    utils: {
                        g: GridUtils,
                        v: ViewUtils
                    }
                };
            }];
        }

        function buildEntryVM(name, option) {
            option = option || {};
            var arrNames = name.split('.');
            return ['$state', '$stateParams', '$q', '$translate', '$timeout', '$http', 'modelNode', 'Notify', 'GridDemoModelSerivce', function ($state, $stateParams, $q, $translate, $timeout, $http, modelNode, Notify, GridDemoModelSerivce) {
                var modelService = option.modelName ? modelNode.services[option.modelName] : GridDemoModelSerivce;

                function init(option) {
                    //remote data get
                    var self = this;
                    _.filter(this.columns, function (column) {
                        if (column && column.formatter) {
                            var f = column.formatter
                            if (_.isFunction(f)) {
                                column.formatterData = f();
                            }
                            else if (_.isString(f)) {
                                if (f == 'bool') {
                                    column.formatterData = {"1": "是", "0": "否", "true": "是", "false": "否"};
                                }
                                else if (f.indexOf('dictionary-local:') == 0) {
                                    ///dictionary-remote:{v1:k1,v2:k2}
                                    var jsonStr = _.rest(f.split(':')).join(':');
                                    column.formatterData = angular.fromJson(jsonStr);
                                }
                                else if (f.indexOf('dictionary-remote:') == 0) {
                                    ///dictionary-remote:{url}
                                    var url = _.rest(f.split(':')).join(':');
                                    $http.get(url).then(function (ret) {
                                        //column.formatterData = column.formatterData || {};
                                        //_.each(ret, function (v, k) {
                                        //    if (_.isObject(v)) {
                                        //        column.formatterData [k] = v.name;
                                        //    }
                                        //});
                                        //console.log(column.formatterData);

                                        column.formatterData = formatDictionary(ret)
                                    });
                                }
                            }
                        }
                    });

                    //依赖lazyload的模块：1Controller注入，2 通过init(option)传入到entry
                    this.removeDialog = option.removeDialog;
                }

                function add() {
                    $state.go(this.moduleRoute('details'), {
                        action: 'add',
                        _id: 'new'
                    });
                }

                function edit(id) {
                    $state.go(this.moduleRoute('details'), {
                        action: 'edit',
                        _id: id
                    });
                }

                function remove() {
                    var self = this;
                    if (self.selectedRows.length == 0) {

                        return $translate('notification.REMOVE-WARNING-NONE').then(function (ret) {
                            Notify.alert('<div class="text-center"><em class="fa fa-warning"></em> ' + ret + '</div>', 'warning');
                        });
                    }

                    var promise = self.removeDialog.openConfirm({
                        template: 'removeConfirmDialogId',
                        className: 'ngdialog-theme-default'
                    }).then(function () {
                        //没有选中提醒???

                        if (option.modelName) {
                            _.each(self.selectedRows, function (row) {
                                return modelService.remove({_id: row._id}).$promise.then(function () {
                                    var index = _.indexOf(self.rows, row);
                                    if (index != -1) {
                                        self.rows.splice(index, 1);
                                    }
                                });
                            })
                        }
                        else {
                            _.each(self.selectedRows, function (row) {
                                console.log(self.rows.length);
                                var index = _.indexOf(self.rows, row);
                                if (index != -1) {
                                    self.rows.splice(index, 1);
                                }
                            });
                        }
                    });

                    return $q.all([$translate('notification.REMOVE-SUCCESS'), promise]).then(function (ret) {
                        Notify.alert('<div class="text-center"><em class="fa fa-check"></em> ' + ret[0] + '</div>', 'success');
                    });
                }

                function find(id) {
                    return modelService.find(id);
                }

                function query() {
                    var self = this;
                    if (self.serverPaging) {
                        self.rows = modelService.page(self.page, self.search, self.sort.column);
                        //服务端totals在查询数据时计算
                        modelService.totals(self.search).$promise.then(function (ret) {
                            self.page.totals = ret.totals;
                        });
                    }
                    else {
                        if (self.modelName) {
                            self.rows = modelService.query(self.search);
                        }
                        else {
                            self.rows = modelService.query();
                        }
                    }
                }

                function paging() {
                    if (this.serverPaging) {
                        this.query();
                    }
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

                var vm;
                return vm = {
                    _system_: arrNames[0],
                    _subsystem_: arrNames[1],
                    _module_: arrNames[2],
                    _view_: arrNames[3],
                    _action_: $stateParams.action || 'query',
                    _modelService_: modelService,
                    systemRoute: systemRoute,
                    subsystemRoute: subsystemRoute,
                    moduleRoute: moduleRoute,
                    viewRoute: viewRoute,
                    viewTranslatePath: viewTranslatePath,
                    name: name || 'no-entryName',
                    pk: option.pk || '_id',
                    serverPaging: option.serverPaging,
                    page: _.defaults(option.page || {}, {size: 9, no: 1}),
                    sort: {
                        column: option.columnPK || this.pk,
                        direction: -1,
                        toggle: function (column) {
                            if (column.sortable) {
                                if (this.column === column.name) {
                                    this.direction = -this.direction || -1;
                                } else {
                                    this.column = column.name;
                                    this.direction = -1;
                                }

                                if (vm.serverPaging) {
                                    vm.query();
                                }
                            }
                        }
                    },
                    columns: option.columns || [],
                    rows: [],
                    init: init,
                    removeDialog: ['ngDialog', function (ngDialog) {
                        return ngDialog;
                    }],
                    add: add,
                    edit: edit,
                    remove: remove,
                    query: query,
                    paging: paging,
                    selectAll: selectAll,
                    selectRow: selectRow,
                    dblclickRow: dblclickRow,
                    openDP: openDP,
                    selectedRows: []
                };
            }];
        };

        function buildEntityVM(name, option) {
            option = option || {};
            var arrNames = name.split('.');
            return ['$state', '$stateParams','$q', '$timeout','$translate', 'blockUI', 'modelNode','Notify', 'GridDemoModelSerivce', function ($state, $stateParams,$q,$timeout,$translate,blockUI,modelNode,Notify, GridDemoModelSerivce) {
                var modelService = option.modelName ? modelNode.services[option.modelName] : GridDemoModelSerivce;

                function init() {
                    //remote data get

                    //
                    //需要的对象传入，2 通过init(option)传入到entry

                }

                function cancel() {
                    $state.go(this.moduleRoute('list'));
                }

                function load() {
                    if (this._id_ == 'new') {
                        return;
                    }

                    this.model = option.modelName ? modelService.get({_id: this._id_}) : modelService.find(this._id_);

                    //loading效果
                    if (option.modelName) {
                        this.model.$promise.finally(function () {
                            if (option.blockUI) {
                                blockUI.instances.get('module-block').stop();
                            }
                        });
                        if (option.blockUI) {
                            blockUI.instances.get('module-block').start();
                        }
                    }
                }

                function save() {
                    var promise;
                    var self = this;
                    if (option.modelName) {
                        if (self._id_ == 'new') {
                            //create
                            promise = modelService.save({}, self.model).$promise;
                        }
                        else {
                            promise = modelService.update({id: self._id_}, self.model).$promise;
                        }
                    }
                    else {
                        //demo
                        var defered = $q.defer();
                        promise = defered.promise;

                        $timeout(function () {

                            if (self._id_ == 'new') {
                                //create
                                modelService.save({}, self.model);
                            }
                            else {
                                modelService.update({id: self._id_}, self.model);
                            }

                            defered.resolve({success: true, error: null});
                            //defered.reject({success: false, error: 'test error'});
                        }, 1000);

                    }

                    if (option.blockUI) {
                        blockUI.instances.get('module-block').start();
                    }

                    return $q.all([$translate('notification.SAVE-SUCCESS'), promise]).then(function (ret) {
                        console.log('success:' + ret);
                        Notify.alert('<div class="text-center"><em class="fa fa-check"></em> ' + ret[0] + '</div>', 'success');
                        $state.go(self.moduleRoute('list'));
                        console.log('--------------end success----------------')
                    }).finally(function () {
                        if (option.blockUI) {
                            blockUI.instances.get('module-block').stop();
                        }
                    });
                }

                function notExist(data) {
                    var self = this;
                    return $q(function (resolve, reject) {
                        if (option.modelName) {
                            modelService.one(data).$promise.then(function (theOne) {
                                //找到一条记录
                                if (theOne._id) {
                                    if (self._id_ == 'new') {
                                        reject();
                                    }
                                    else {
                                        theOne._id == self._id_ ? resolve() : reject();
                                    }
                                }
                                else {
                                    resolve();
                                }

                            });
                        }
                        else {
                            var theOne = modelService.one(data);
                            if (theOne) {
                                //找到一条记录
                                if (self._id_ == 'new') {
                                    //新增找到一条记录则不满足条件
                                    reject();
                                }
                                else {
                                    //修改找到一条记录，需要判断是不是自身,如果不是自身则不满足条件
                                    theOne.id == self._id_ ? resolve() : reject();
                                }
                            }
                            else {
                                resolve();
                            }
                        }
                    });
                }

                return {
                    _system_: arrNames[0],
                    _subsystem_: arrNames[1],
                    _module_: arrNames[2],
                    _view_: arrNames[3],
                    _action_: $stateParams.action,
                    _id_: $stateParams._id,
                    _modelService_: modelService,
                    systemRoute: systemRoute,
                    subsystemRoute: subsystemRoute,
                    moduleRoute: moduleRoute,
                    viewRoute: viewRoute,
                    viewTranslatePath: viewTranslatePath,
                    name: name || 'no-entityName',
                    pk: option.pk || '_id',
                    model: {},
                    init: init,
                    cancel: cancel,
                    load: load,
                    save: save,
                    notExist: notExist,
                    openDP: openDP
                };
            }];
        };

        function buildInstanceVM(name,option){
            option = option || {};
            var arrNames = name.split('.');
            return ['$state', '$stateParams','$q', '$timeout','$translate', 'blockUI', 'modelNode','Notify', function ($state, $stateParams,$q,$timeout,$translate,blockUI,modelNode,Notify) {
                var modelService = modelNode.services[option.modelName];

                function init() {
                    //remote data get

                    //
                    //需要的对象传入，2 通过init(option)传入到entry

                }

                return {
                    _system_: arrNames[0],
                    _subsystem_: arrNames[1],
                    _module_: arrNames[2],
                    systemRoute: systemRoute,
                    subsystemRoute: subsystemRoute,
                    moduleRoute: moduleRoute,
                    moduleTranslatePath: moduleTranslatePath,
                    name: name || 'no-instanceName',
                    init: init
                };
            }];
        }

        ////以下帮助方法
        //日期popup
        function openDP($event, length, index) {
            $event.preventDefault();
            $event.stopPropagation();
            if (length == undefined) {
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

        function systemRoute() {
            return _.union([this._system_], Array.prototype.slice.call(arguments, 0)).join('.');
        }

        function subsystemRoute() {
            return _.union([this._system_, this._subsystem_], Array.prototype.slice.call(arguments, 0)).join('.');
        }

        function moduleRoute() {
            return _.union([this._system_, this._subsystem_, this._module_], Array.prototype.slice.call(arguments, 0)).join('.');
        }

        function viewRoute() {
            return _.union([this._system_,this._subsystem_, this._module_, this._view_], Array.prototype.slice.call(arguments, 0)).join('.');
        }

        function moduleTranslatePath() {
            //去掉_system_
            return _.union([this._subsystem_, this._module_], Array.prototype.slice.call(arguments, 0)).join('.');
        }

        function viewTranslatePath() {
            //去掉_system_
            return _.union([this._subsystem_, this._module_, this._view_], Array.prototype.slice.call(arguments, 0)).join('.');
        }



        function formatDictionary(rawDictionary){
            var o = {};
            _.each(rawDictionary, function (v, k) {
                if (_.isObject(v)) {
                    o[k] = v.name;
                }
            });
            return o;
        }

    }


})();

