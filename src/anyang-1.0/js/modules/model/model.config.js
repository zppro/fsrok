/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular
        .module('app.model')
        .config(modelConfig);

    modelConfig.$inject = ['modelNodeProvider', 'shareNodeProvider','extensionNodeProvider', 'clientDataProvider'];
    function modelConfig(modelNodeProvider, shareNodeProvider,extensionNodeProvider, clientDataProvider) {
        modelNodeProvider.setBaseUrl('services/model/manage/');
        shareNodeProvider.setBaseUrl('services/share/');
        extensionNodeProvider.setBaseUrl('services/extension/');
        clientDataProvider.setBaseUrl('server/');
    }
})();