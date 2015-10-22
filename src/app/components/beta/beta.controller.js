(function() {
  'use strict';

  angular.module('app.components')
    .controller('BetaController', BetaController);

  BetaController.$inject = ['$scope', '$mdDialog', '$window'];
  function BetaController($scope, $mdDialog, $window) {

    $scope.showBeta = showBeta;

    $scope.$on('showBeta', function() {
      showBeta();
    });

    ////////////////

    function showBeta() {
      var lastShown = $window.localStorage.getItem('smartcitizen.beta_popup');
      if(!lastShown || moment().diff(moment(lastShown), 'days') >= 7){
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'StoreDialogController',
          templateUrl: 'app/components/beta/betaModal.html',
          clickOutsideToClose: true
        });
        $window.localStorage.setItem('smartcitizen.beta_popup',
          moment().format());
      }
    }

  }
})();
