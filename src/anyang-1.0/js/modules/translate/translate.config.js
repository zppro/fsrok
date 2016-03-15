(function() {
    'use strict';

    angular
        .module('app.translate')
        .config(translateConfig)
        ;
    translateConfig.$inject = ['$translateProvider'];
    function translateConfig($translateProvider) {

        $translateProvider.useStaticFilesLoader(
            //{prefix: 'app/i18n/', suffix: '.json'}
            {
                files: [
                    {prefix: 'app/i18n/', suffix: '.json'},
                    {prefix: 'app/i18n/route-', suffix: '.json'}
                ]
            }
        );//modified by zppro 2016.3.1 多文件支持
        $translateProvider.preferredLanguage('zh_CN');
        $translateProvider.useLocalStorage();
        $translateProvider.usePostCompiling(true);
    }
})();