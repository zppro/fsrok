/**
 * utils.directive Created by zppro on 16-3-24.
 */

(function() {
    'use strict';

    angular
        .module('app.utils')
        .directive('onFinishRender', onFinishRender)
        .directive('requireMultiple',requireMultiple)
    ;

    onFinishRender.$inject = ['$timeout'];
    function onFinishRender ($timeout) {
        var directive = {
            link: link,
            restrict: 'A'
        };
        return directive;

        function link(scope, element, attrs) {
            if (scope.$last === true) {
                var option = angular.fromJson(attrs.onFinishRender);
                if (option && option.type)
                    $timeout(function () {
                        scope.$emit(option.type + 'Finished:' + option.sub || '');
                    });
            }
        }
    }

    function requireMultiple() {
        var directive = {
            link: link,
            restrict: 'A',
            require: 'ngModel'
        };
        return directive;

        function link(scope, element, attrs, ngModel) {
            ngModel.$validators.required = function (value) {
                return angular.isArray(value) && value.length > 0;
            };
        }
    }


})();
