(function () {
    'use strict';
    angular
        .module('itsyouonline.registration')
        .controller('registrationController', [
            '$scope', '$window', '$cookies', '$mdUtil', 'configService', 'registrationService',
            registrationController]);

    function registrationController($scope, $window, $cookies, $mdUtil, configService, registrationService) {
        var vm = this;
        configService.getConfig(function (config) {
            vm.totpsecret = config.totpsecret;
        });
        vm.register = register;
        vm.resetValidation = resetValidation;
        vm.basicInfoValid = basicInfoValid;
        vm.goToNextTabIfValid = goToNextTabIfValid;
        vm.externalSite = URI($window.location.href).search(true).client_id;
        vm.logo = "";
        vm.twoFAMethod = 'sms';
        vm.selectedTab = 0;
        vm.validateUsername = $mdUtil.debounce(function () {
            $scope.signupform.login.$setValidity("duplicate_username", true);
            $scope.signupform.login.$setValidity("invalid_username_format", true);
            if ($scope.signupform.login.$valid) {
                registrationService
                    .validateUsername(vm.login)
                    .then(function (response) {
                        $scope.signupform.login.$setValidity(response.data.error, response.data.valid);
                    });
            }
        }, 500, true);

        init();

        function init() {
            if (vm.externalSite) {
                registrationService.getLogo(vm.externalSite).then(
                    function(data) {
                        vm.logo = data.logo;
                        renderLogo();
                    }
                );
                window.addEventListener('resize', resizeLogo, false);
                window.addEventListener('orientationchange', resizeLogo, false);
            }
        }

        function renderLogo() {
            if (vm.logo !== "") {
                var img = new Image();
                img.onload = function() {
                    var c = document.getElementById("register-logo");
                    if (!c) {
                        return;
                    }
                    var ctx = c.getContext("2d");
                    ctx.clearRect(0, 0, c.width, c.height);
                    ctx.drawImage(img, 0, 0, c.width, c.height);
                }
                img.src = vm.logo;
            }
        }

        function resizeLogo(e) {
            var formArea = document.getElementById("form-area");
            var logoArea = document.getElementById("register-logo");
            var widthToHeight = 25 / 12;
            var newWidth = formArea.clientWidth - 20;
            if (newWidth < 500) {
                logoArea.width = newWidth;
                logoArea.height = (newWidth) / widthToHeight;
            } else if (newWidth >= 500 && logoArea.width < 500) {
                logoArea.width = 500;
                logoArea.height = 240;
            }
            renderLogo();
        }

        function register() {
            var redirectparams = $window.location.search.replace('?', '');
            registrationService
                .register(vm.twoFAMethod, vm.login, vm.email, vm.password, vm.totpcode, vm.sms, redirectparams)
                .then(function (response) {
                    var url = response.data.redirecturl;
                    if (url === '/') {
                        $cookies.remove('registrationdetails');
                    }
                    $window.location.href = url;
                }, function (response) {
                    switch (response.status) {
                        case 422:
                            var err = response.data.error;
                            switch (err) {
                                case 'invalid_phonenumber':
                                    $scope.signupform.phonenumber.$setValidity(err, false);
                                    break;
                                case 'invalid_totpcode':
                                    $scope.signupform.totpcode.$setValidity(err, false);
                                    break;
                                case 'invalid_password':
                                    $scope.signupform.password.$setValidity(err, false);
                                    break;
                                case 'invalid_username_format':
                                    $scope.signupform.login.$setValidity(err, false);
                                    break;
                                default:
                                    console.error('Unconfigured error:', response.data.error);
                            }
                            break;
                        case 409:
                            $scope.signupform.login.$setValidity('duplicate_username', false);
                            break;
                    }
                });
        }

        function resetValidation(prop) {
            switch (prop) {
                case 'phonenumber':
                    $scope.signupform[prop].$setValidity("invalid_phonenumber", true);
                    break;
                case 'totpcode':
                    $scope.signupform[prop].$setValidity("invalid_totpcode", true);
                    break;
                case 'twoFAMethod':
                    $scope.signupform.totpcode.$setValidity("totpcode", true);
                    $scope.signupform.phonenumber.$setValidity("invalid_phonenumber", true);
                    $scope.signupform.phonenumber.$setValidity("pattern", true);
                    break;
            }
        }

        function basicInfoValid() {
            return $scope.signupform.login
                && $scope.signupform.login.$valid
                && $scope.signupform.email.$valid
                && $scope.signupform.password.$valid
                && $scope.signupform.passwordvalidation.$valid;
        }

        function goToNextTabIfValid() {
            vm.selectedTab = 1;
        }
    }
})();
