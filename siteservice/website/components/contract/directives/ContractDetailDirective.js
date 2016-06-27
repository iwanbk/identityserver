(function () {
    'use strict';
    angular.module('itsyouonlineApp')
        .directive('contractDetail', ContractDetailDirective)
        .directive('onFileChange', onFileChange);

    function ContractDetailDirective() {
        return {
            restrict: 'E',
            templateUrl: 'components/contract/views/contractDetail.html',
            controller: ['$window', '$q', 'ContractService', 'ContractConstants', ContractDetailController],
            controllerAs: 'cvm',
            scope: {
                contract: '=',
                contracts: '=',
                contractSource: '=',
                contractSourceType: '='
            },
            bindToController: true
        };
    }

    function ContractDetailController($window, $q, ContractService, ContractConstants) {
        var cvm = this;
        cvm.partyTypes = ContractConstants.partyTypes;
        cvm.contentTypes = ContractConstants.contentTypes;

        cvm.addParty = addParty;
        cvm.removeParty = removeParty;
        cvm.searchContract = searchContract;
        cvm.getContractDisplayName = getContractDisplayName;
        cvm.transformContractChip = transformContractChip;
        cvm.clickFileUpload = clickFileUpload;
        cvm.selectedFileChanged = selectedFileChanged;
        cvm.openImageInTab = openImageInTab;
        cvm.deleteContract = deleteContract;
        cvm.submit = submit;

        init();

        function init() {
            if (!cvm.contract) {
                console.error('No contract supplied to contract directive');
            }
            if (!cvm.contracts) {
                console.error('No contracts supplied to contract directive');
            }
            if (!cvm.contractSourceType) {
                console.error('No "contractSourceType" supplied to contract directive');
            }
            if (!cvm.contractSource) {
                console.error('No "contractSource" supplied to contract directive');
            }
            cvm.isNew = !cvm.contract.contractId;
            if (cvm.isNew) {
                cvm.contract = {
                    parties: [{
                        type: cvm.contractSourceType,
                        name: cvm.contractSource
                    }],
                    invalidates: [],
                    extends: [],
                    content: {
                        mimeType: ''
                    }
                };
                cvm.contractContentType = cvm.contentTypes[1].type;
                cvm.contractTextContent = '';
                cvm.contractImageContent = '';
                cvm.imageMimeType = '';
            } else {
                cvm.contractContentType = cvm.contract.content.mimeType.split('/')[0];
                cvm.imageMimeType = cvm.contract.content.mimeType;
                if (cvm.imageMimeType.startsWith('text')) {
                    cvm.contractTextContent = cvm.contract.content.content;
                } else {
                    cvm.contractImageContent = cvm.contract.content.content;
                }
            }
            cvm.fileError = '';

        }

        function addParty() {
            cvm.contract.parties.push({
                type: cvm.partyTypes[0].type,
                name: ''
            });
        }

        function removeParty(party) {
            cvm.contract.parties.splice(cvm.contract.parties.indexOf(party), 1);
        }

        function contractSearch(query) {
            var lowercaseQuery = angular.lowercase(query);
            cvm.contracts.map(function (contract) {
                contract._lowerType = contract.contractType.toLowerCase();
            });
            return function filterFn(contract) {
                return (contract._lowerType.indexOf(lowercaseQuery) !== -1) || contract.contractId.startsWith(lowercaseQuery);
            };
        }

        function searchContract(query) {
            return query ? cvm.contracts.filter(contractSearch(query)) : [];
        }

        function getContractDisplayName(contractId) {
            var contract = cvm.contracts.filter(function (c) {
                return c.contractId === contractId;
            })[0];
            return contract.contractType || contract.contractId;
        }

        function transformContractChip(chip) {
            return chip.contractId;
        }

        function clickFileUpload() {
            angular.element(document.querySelector('#contractContentImage'))[0].click();
        }

        function selectedFileChanged(files) {
            var file = files[0];
            cvm.fileError = '';
            cvm.imageMimeType = file.type;
            if (!file) {
                return;
            }
            if (file.size > 1024 * 1024 * 5) {
                cvm.fileError = 'The chosen file is too large. Maximum allowed size is 5 MB';
                return;
            }

            if (!file.type.startsWith('image')) {
                cvm.fileError = 'Invalid file supplied. Only images are allowed.';
            } else {
                readFile(file).then(function (base64pic) {
                    var toReplace = 'data:' + cvm.imageMimeType + ';base64,';
                    cvm.contractImageContent = base64pic.replace(toReplace, '');
                }, function (result) {
                    cvm.fileError = 'Something went wrong while converting the image.';
                });
            }

            function readFile(file) {
                var deferred = $q.defer();
                var reader = new FileReader();
                reader.onload = function (e) {
                    deferred.resolve(e.target.result);
                };
                reader.onerror = function (e) {
                    deferred.reject(e);
                };
                reader.readAsDataURL(file);
                return deferred.promise;
            }
        }

        function openImageInTab() {
            $window.open('data:' + cvm.imageMimeType + ';base64,' + cvm.contractImageContent, '_blank');
        }

        function submit() {
            var mimeType = '',
                content = '';
            cvm.validationError = '';
            if (cvm.contract.parties.length < 2) {
                cvm.validationError = 'You need to assign at least 2 parties.';
                return;
            }
            switch (cvm.contractContentType) {
                case 'text':
                    mimeType = 'text/plain';
                    content = cvm.contractTextContent;
                    break;
                case 'image':
                    mimeType = cvm.imageMimeType;
                    content = cvm.contractImageContent;
                    break;
            }
            cvm.contract.content = {
                content: content,
                mimeType: mimeType
            };

            if (cvm.contractContentType === 'image' && !cvm.contract.content.content) {
                cvm.fileError = 'Please select an image for the contract';
                return;
            }

            if (cvm.contractId) {
                createContract();
            } else {
                updateContract();
            }
        }

        function createContract() {
            ContractService.createContract(cvm.contractSourceType, cvm.contractSource, cvm.contract);
        }

        function updateContract() {
            ContractService.updateContract(cvm.contractSourceType, cvm.contractSource, cvm.contract);
        }

        function deleteContract() {
            ContractService.deleteContract(cvm.contract.contractId);
        }
    }

    function onFileChange() {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var onChangeHandler = scope.$eval(attrs.onFileChange);
                element.bind('change', function () {
                    scope.$apply(function () {
                        var files = element[0].files;
                        if (files) {
                            onChangeHandler(files);
                        }
                    });
                });
            }
        };
    }
})();