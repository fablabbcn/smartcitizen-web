




    StoreDialogController.$inject = ['$scope', '$mdDialog'];
export default function StoreDialogController($scope, $mdDialog) {

      $scope.hide = function() {
        $mdDialog.hide();
      };
    }
