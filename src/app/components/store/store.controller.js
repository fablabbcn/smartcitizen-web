import angular from 'angular';

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
        controller: 'StoreDialogController',
        templateUrl: 'app/components/store/storeModal.html',
        clickOutsideToClose: true
      });
    }

  }

