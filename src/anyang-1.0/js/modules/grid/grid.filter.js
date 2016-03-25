/**
 * Created by zppro on 16-2-26.
 */

(function() {
    'use strict';

    angular
        .module('app.grid')
        .filter('paging', paging)
        .filter('totals',totals)
        .filter('hide',hide)
        .filter('width',width)
        .filter('orderClass',orderClass)
        .filter('formatter',formatter)
        .filter('orFilter',orFilter)
    ;

    paging.$inject = ['GridUtils'];
    totals.$inject = ['GridUtils'];
    hide.$inject = ['GridUtils'];
    width.$inject = ['GridUtils'];
    orderClass.$inject = ['GridUtils'];
    formatter.$inject = ['GridUtils'];
    orFilter.$inject = ['GridUtils'];

    function paging(GridUtils) {
        return GridUtils.paging;
    }

    function totals(GridUtils){
        return GridUtils.totals;
    }

    function hide(GridUtils) {
        return GridUtils.hide;
    }

    function width(GridUtils) {
        return GridUtils.width;
    }

    function orderClass(GridUtils) {
        return GridUtils.toggleOrderClass;
    }

    function formatter(GridUtils){
        return GridUtils.formatter;
    }

    function orFilter(GridUtils) {
        return GridUtils.orFilter;
    }

})();
