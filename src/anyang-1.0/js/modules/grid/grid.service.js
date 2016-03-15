(function() {
    'use strict';

    angular
        .module('app.grid')
        .service('GridDemoModelSerivce', GridDemoModelSerivce)
        .service('GridUtils',GridUtils);

    GridDemoModelSerivce.$inject = ['Utils'];
    function GridDemoModelSerivce(Utils) {

        this.query = query;
        this.find = find;
        this.save = save;
        this.remove = remove;
        this._demoData_ = [];

        function query(refresh) {
            refresh = this._demoData_.length == 0 || refresh;

            if (refresh) {
                this._demoData_.length = 0;
                var MAX_NUM = 10 * 50;
                for (var i = 0; i < MAX_NUM; ++i) {
                    var id = Utils.rand(0, MAX_NUM);
                    this._demoData_.push({
                        id: i + 1,
                        name: 'Name' + id, // 字符串类型
                        followers: Utils.rand(0, 100 * 1000 * 1000), // 数字类型
                        birthday: moment().subtract(Utils.rand(365, 365 * 50), 'day').toDate(), // 日期类型
                        summary: '这是一个测试' + i,
                        income: Utils.rand(1000, 100000) // 金额类型
                    });
                }
            }

            return this._demoData_;
        }

        function find(id) {
            return _.find(this._demoData_, function (item) {
                return item.id == id;
            });
        }

        function save(id, data) {

            if (id != 'new') {
                //修改
                var dest = _.bind(find, this, id);
                _.extend(dest, data);
            }
            else {
                //添加
                this._demoData_.push(_.defaults(data, {}));
            }
        }

        function remove(ids) {
            console.log(this._demoData_.length);
            this._demoData_ = _.reject(this._demoData_, function (item) {
                return _.contains(ids, item.id);
            });

            console.log(this._demoData_.length);
        }
    }

    function GridUtils() {
        return {
            paging: paging,
            totals: totals,
            hide: hide,
            width: width,
            toggleOrderClass: toggleOrderClass,
            noResultsColspan: noResultsColspan
        };

        function paging(items, vm) {
            if (!items)
                return [];
            var offset = (vm.page.no - 1) * vm.page.size;
            vm.paged = items.slice(offset, offset + vm.page.size)
            return vm.paged;
        }

        function totals(items) {
            if (!items)
                return 0;

            return items.length || 0
        }

        function hide(column) {
            if (!column)
                return true;
            return column.hidden === true;
        }

        function width(column) {
            if (!column)
                return 0;
            return column.width || 100;
        }

        function toggleOrderClass(direction) {
            if (direction === -1)
                return "glyphicon-chevron-down";
            else
                return "glyphicon-chevron-up";
        }

        function noResultsColspan(vm) {
            if (!vm || !vm.columns)
                return 1;
            return 1 + vm.columns.length - _.where(vm.columns, {hidden: true}).length;
        }
    }
})();