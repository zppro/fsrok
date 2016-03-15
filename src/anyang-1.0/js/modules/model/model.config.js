/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular
        .module('app.model')
        .config(modelConfig);

    modelConfig.$inject = ['modelNodeProvider'];
    function modelConfig(modelNodeProvider){
        console.log('modelConfig...');
        modelNodeProvider.setBaseUrl('services/model/manage/');
    }
})();