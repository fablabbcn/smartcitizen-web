(function() {
  'use strict';

  angular.module('app.components')
    .controller('BetaController', BetaController);

  BetaController.$inject = ['$scope', '$mdDialog'];
  function BetaController($scope, $mdDialog) {

    $scope.showBeta = showBeta;

    $scope.$on('showBeta', function() {
      showBeta();
    });
    
    ////////////////

    function showBeta() {
      $mdDialog.show({
        hasBackdrop: true,
        controller: 'StoreDialogController',
        templateUrl: 'app/components/beta/betaModal.html',
        clickOutsideToClose: true
      });
    }

  }
})();
