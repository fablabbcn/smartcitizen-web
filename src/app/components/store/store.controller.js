(function() {
  'use strict';

  angular.module('app.components')
    .controller('StoreController', StoreController);

  StoreController.$inject = ['$scope', '$mdDialog', 'URLS'];
  function StoreController($scope, $mdDialog, URLS) {

    $scope.showStore = showStore;
    var vm = this;
    vm.seeed = URLS['seeed'];

    $scope.$on('showStore', function() {
      showStore();
    });

    ////////////////

    function showStore() {
      $mdDialog.show({
        hasBackdrop: true,
        controller: 'StoreModalController',
        templateUrl: 'app/components/store/storeModal.html',
        clickOutsideToClose: true
      });
    }

  }
})();
