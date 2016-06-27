(function () {
    'use strict';
    angular.module('itsyouonlineApp')
        .directive('contract', ContractDirective);

    function ContractDirective() {
        return {
            restrict: 'E',
            templateUrl: 'components/contract/views/contract.html',
            controller: ['$rootScope', '$window', 'ContractService', 'ContractConstants', ContractController],
            controllerAs: 'cvm',
            scope: {
                contract: '='
            },
            bindToController: true
        };
    }

    function ContractController($rootScope, $window, ContractService, ContractConstants) {
        var cvm = this;
        cvm.openImageInTab = openImageInTab;
        cvm.getPartyLabel = getPartyLabel;

        function getPartyLabel(val) {
            return ContractConstants.partyTypes.filter(function (p) {
                return p.type === val;
            })[0].label;
        }

        function openImageInTab() {
            $window.open('data:' + cvm.contract.content.mimeType + ';base64,' + cvm.contract.content.content, '_blank');
        }
    }
})();