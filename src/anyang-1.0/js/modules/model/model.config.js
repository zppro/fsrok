/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular
        .module('app.model')
        .config(modelConfig);

    modelConfig.$inject = ['modelNodeProvider', 'shareNodeProvider','extensionNodeProvider','debugNodeProvider', 'clientDataProvider'];
    function modelConfig(modelNodeProvider, shareNodeProvider,extensionNodeProvider, debugNodeProvider,clientDataProvider) {
        modelNodeProvider.setBaseUrl('services/model/manage/');
        shareNodeProvider.setBaseUrl('services/share/');
        extensionNodeProvider.setBaseUrl('services/extension/');
        debugNodeProvider.setBaseUrl('debug-services/debug/');
        clientDataProvider.setBaseUrl('server/');
    }
})();