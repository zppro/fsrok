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
        .filter('orderClass',orderClass);

    paging.$inject = ['GridUtils'];
    totals.$inject = ['GridUtils'];
    hide.$inject = ['GridUtils'];
    width.$inject = ['GridUtils'];
    orderClass.$inject = ['GridUtils'];


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




})();
