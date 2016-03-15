/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular
        .module('app.model')
        .run(modelRun)
    ;
    modelRun.$inject = ['modelNode'];
    function modelRun(modelNode) {
        modelNode.factory('pub-tenant');
    }

})();