(function() {
  'use strict';

  angular.module('app.components')
    .controller('StaticController', StaticController);

  StaticController.$inject = ['$timeout', 'animation', '$mdDialog'];

  function StaticController($timeout, animation, $mdDialog) {
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
