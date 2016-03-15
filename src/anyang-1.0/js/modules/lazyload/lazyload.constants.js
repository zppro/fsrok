(function() {
    'use strict';

    angular
        .module('app.lazyload')
        .constant('APP_REQUIRES', {
            // jQuery based and standalone scripts
            scripts: {
                'modernizr': ['vendor/modernizr/modernizr.js'],
                'icons': ['vendor/fontawesome/css/font-awesome.min.css',
                    'vendor/simple-line-icons/css/simple-line-icons.css'],
                'moment': ['vendor/moment/min/moment-with-locales.min.js']
            },
            // Angular based script (use the right module name)
            modules: [
                 {name: 'locale_zh-cn', files: ['vendor/angular-i18n/angular-locale_zh-cn.js']}
            ]
        })
    ;

})();
