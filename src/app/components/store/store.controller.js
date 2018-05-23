export default export default function $1Controller($scope, $mdDialog) {
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

StoreController.$inject = ['$scope', '$mdDialog'];
