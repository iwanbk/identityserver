(function () {
    'use strict';
    angular.module('itsyouonlineApp')
        .directive('authorizationDetails', function () {
            return {
                restrict: 'AE',
                templateUrl: 'components/user/directives/authorizationDetails.html',
                link: function (scope, element, attr) {
                    scope.save = save;
                    scope.fullscreenAuthorization = attr.full !== undefined && attr.full !== 'false';

                    function save() {
                        // Filter unauthorized permission labels
                        angular.forEach(scope.authorizations, function (value) {
                            if (Array.isArray(value)) {
                                angular.forEach(value, function (val) {
                                    if (!val.reallabel) {
                                        value.splice(value.indexOf(val), 1);
                                    }
                                });
                            }
                        });
                        scope.authorizations.organizations = [];
                        angular.forEach(scope.requested.organizations, function (allowed, organization) {
                            if (allowed) {
                                scope.authorizations.organizations.push(organization);
                            }
                        });
                        scope.update();
                    }
                }
            };
        });
})();