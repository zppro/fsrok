/**=========================================================
 * Module: angular-grid.js
 * Example for Angular Grid
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.tables')
        .controller('AngularGridController', AngularGridController);

    AngularGridController.$inject = ['$http'];
    function AngularGridController($http) {
        var vm = this;

        activate();

        ////////////////

        function activate() {

            // Basic
            var columnDefs = [
                {displayName: 'Athlete', field: 'athlete', width: 150},
                {displayName: 'Age', field: 'age', width: 90},
                {displayName: 'Country', field: 'country', width: 120},
                {displayName: 'Year', field: 'year', width: 90},
                {displayName: 'Date', field: 'date', width: 110},
                {displayName: 'Sport', field: 'sport', width: 110},
                {displayName: 'Gold', field: 'gold', width: 100},
                {displayName: 'Silver', field: 'silver', width: 100},
                {displayName: 'Bronze', field: 'bronze', width: 100},
                {displayName: 'Total', field: 'total', width: 100}
            ];

            vm.gridOptions = {
                columnDefs: columnDefs,
                rowData: null,
                ready: function(api){
                  api.sizeColumnsToFit();
                }
            };

            // Filter Example
            var irishAthletes = ['John Joe Nevin','Katie Taylor','Paddy Barnes','Kenny Egan','Darren Sutherland', 'Margaret Thatcher', 'Tony Blair', 'Ronald Regan', 'Barack Obama'];

            var columnDefsFilter = [
                {displayName: 'Athlete', field: 'athlete', width: 150, filter: 'set',
                    filterParams: { cellHeight: 20, values: irishAthletes} },
                {displayName: 'Age', field: 'age', width: 90, filter: 'number'},
                {displayName: 'Country', field: 'country', width: 120},
                {displayName: 'Year', field: 'year', width: 90},
                {displayName: 'Date', field: 'date', width: 110},
                {displayName: 'Sport', field: 'sport', width: 110},
                {displayName: 'Gold', field: 'gold', width: 100, filter: 'number'},
                {displayName: 'Silver', field: 'silver', width: 100, filter: 'number'},
                {displayName: 'Bronze', field: 'bronze', width: 100, filter: 'number'},
                {displayName: 'Total', field: 'total', width: 100, filter: 'number'}
            ];

            vm.gridOptions1 = {
                columnDefs: columnDefsFilter,
                rowData: null,
                enableFilter: true,
                ready: function(api){
                  api.sizeColumnsToFit();
                }

            };


            // Pinning Example

            vm.gridOptions2 = {
                columnDefs: columnDefs,
                rowData: null,
                pinnedColumnCount: 2,
                ready: function(api){
                  api.sizeColumnsToFit();
                }
            };

            //-----------------------------
            // Get the data from SERVER
            //-----------------------------

            $http.get('server/ag-owinners.json')
                .then(function(res){
                    // basic
                    vm.gridOptions.rowData = res.data;
                    vm.gridOptions.api.onNewRows();
                    // filter
                    vm.gridOptions1.rowData = res.data;
                    vm.gridOptions1.api.onNewRows();
                    // pinning
                    vm.gridOptions2.rowData = res.data;
                    vm.gridOptions2.api.onNewRows();
                });

        }
    }
})();
