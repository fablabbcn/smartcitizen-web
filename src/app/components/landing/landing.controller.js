(function() {
  'use strict';

  angular.module('app.components')
    .controller('LandingController', LandingController);

  LandingController.$inject = ['$timeout', 'animation', '$mdDialog', '$location', '$anchorScroll'];

  function LandingController($timeout, animation, $mdDialog, $location, $anchorScroll) {
    var vm = this;

    vm.showStore = showStore;
    vm.goToHash = goToHash;

    ///////////////////////

    initialize();

    //////////////////

    function initialize() {
      $timeout(function() {
        animation.viewLoaded();
        if($location.hash()) {
          $anchorScroll();
        }
      }, 500);
    }

    function goToHash(hash){
      $location.hash(hash);
      $anchorScroll();
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
