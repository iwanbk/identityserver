(function () {
    'use strict';
    angular.module('loginApp', ['ngMaterial', 'ngCookies', 'ngMessages', 'ngRoute', 'ngSanitize', 'monospaced.qrcode', 'itsyouonline.shared',
        'itsyouonline.header', 'itsyouonline.footer', 'itsyouonline.user', 'itsyouonline.validation'])
        .config(['$mdThemingProvider', themingConfig])
        .config(['$httpProvider', httpConfig])
        .config(['$routeProvider', routeConfig])
        .factory('authenticationInterceptor', ['$q', '$window', authenticationInterceptor]);

    function themingConfig($mdThemingProvider) {
        $mdThemingProvider.definePalette('blueish', {
            '50': '#f7fbfd',
            '100': '#badeed',
            '200': '#8ec8e2',
            '300': '#55add3',
            '400': '#3ca1cd',
            '500': '#4d738a',
            '600': '#2a7ea3',
            '700': '#236b8a',
            '800': '#1d5872',
            '900': '#17455a',
            'A100': '#f7fbfd',
            'A200': '#badeed',
            'A400': '#3ca1cd',
            'A700': '#236b8a',
            'contrastDefaultColor': 'light',
            'contrastDarkColors': '50 100 200 300 400 A100 A200 A400'
        });
        $mdThemingProvider
            .theme('default')
            .primaryPalette('blueish');
    }

    function httpConfig($httpProvider) {
        $httpProvider.interceptors.push('authenticationInterceptor');
        //initialize get if not there
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }
        //disable IE ajax request caching
        $httpProvider.defaults.headers.get['If-Modified-Since'] = '0';
    }

    function authenticationInterceptor($q, $window) {
        return {
            'responseError': function (response) {
                if (response.status === 401 || response.status === 403 || response.status === 419) {
                    $window.location.href = '/login';
                } else if (response.status.toString().startsWith('5')) {
                    $window.location.href = 'error' + response.status;
                }

                return $q.reject(response);
            }
        };
    }

    function routeConfig($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'components/login/views/loginform.html',
                controller: 'loginController',
                controllerAs: 'vm'
            })
            .when('/2fa', {
                templateUrl: 'components/login/views/twoFactorAuthentication.html',
                controller: 'twoFactorAuthenticationController',
                controllerAs: 'vm'
            })
            .when('/forgotpassword', {
                templateUrl: 'components/login/views/forgotpassword.html',
                controller: 'forgotPasswordController',
                controllerAs: 'vm'
            })
            .when('/resetpassword/:code', {
                templateUrl: 'components/login/views/resetpassword.html',
                controller: 'resetPasswordController',
                controllerAs: 'vm'
            })
            .when('/resendsms', {
                templateUrl: 'components/registration/views/registrationresendsms.html',
                controller: 'resendSmsController',
                controllerAs: 'vm'
            })
            .when('/smsconfirmation', {
                templateUrl: 'components/registration/views/registrationsmsform.html',
                controller: 'smsConfirmationController',
                controllerAs: 'vm'
            })
            .otherwise('/');
    }
})();
