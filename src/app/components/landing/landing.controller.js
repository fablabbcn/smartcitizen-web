(function() {
  'use strict';

  angular.module('app.components')
    .controller('LandingController', LandingController);

  LandingController.$inject = ['$timeout', 'animation', '$mdDialog'];

  function LandingController($timeout, animation, $mdDialog) {
    var vm = this;

    vm.showStore = showStore;

    ///////////////////////

    initialize();

    //////////////////

    function initialize() {
      $timeout(function() {
        animation.viewLoaded();
      }, 500);
    }

    function showStore() {
      $mdDialog.show({
        hasBackdrop: true,
        controller: 'StoreDialogController',
        templateUrl: 'app/components/store/storeModal.html',
        clickOutsideToClose: true
      });
    }
  }
})();