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
      if(userAgent() != 'other'){
        showMobile();
        return;
      }

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

    function showMobile(){
      $mdDialog.show({
        hasBackdrop: true,
        controller: 'StoreDialogController',
        templateUrl: 'app/components/beta/mobileModal.html',
        clickOutsideToClose: true
      });
    }

    function userAgent(){
      if(((/android/i).test(navigator.userAgent))){
        return 'android';
      }else if(((/iPhone/i).test(navigator.userAgent)) ||
        ((/iPod/i).test(navigator.userAgent))){
        return 'ios';
      }else{
        return 'other';
      }
    }

  }
})();
