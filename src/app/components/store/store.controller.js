(function() {
  'use strict';

  angular.module('app.components')
    .controller('StoreController', StoreController);

  StoreController.$inject = ['$scope', '$mdDialog'];
  function StoreController($scope, $mdDialog) {

    $scope.showStore = showStore;

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
