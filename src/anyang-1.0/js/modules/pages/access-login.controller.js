/**=========================================================
 * Module: access-login.js
 * Demo for login api
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.pages')
        .controller('LoginFormController', LoginFormController);

    LoginFormController.$inject = ['$scope','$http', '$state','Auth'];
    function LoginFormController($scope,$http, $state,Auth) {
        var vm = this;

        activate();

        ////////////////

        function activate() {
            // bind here all data from the form
            vm.account = {};
            // place the message if something goes wrong
            vm.authMsg = '';

            vm.login = function () {
                vm.authMsg = '';

                if (vm.loginForm.$valid) {

                    $http
                        .post('services/share/login/signin', {code: vm.account.email, password: vm.account.password})
                        .then(function (user) {
                            // assumes if ok, response is an object with some data, if not, a string with error
                            // customize according to your api
                            Auth.setUser(user);
                            $state.go('app.dashboard');
                        }, function (err) {
                            vm.authMsg = err;
                        });
                }
                else {
                    // set as dirty if the user click directly to login so we show the validation messages
                    /*jshint -W106*/
                    vm.loginForm.account_email.$dirty = true;
                    vm.loginForm.account_password.$dirty = true;
                }
            };


        }
    }
})();
