(function() {
    'use strict';

    angular
        .module('custom', [
            // request the the entire framework
            'anyang',
            // or just modules
            'app.core',
            'app.sidebar'
            /*...*/
        ]);
})();