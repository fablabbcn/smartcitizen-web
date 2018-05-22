import angular from 'angular';

  angular.module('app.components')
    .controller('StoreDialogController', StoreDialogController);

    StoreDialogController.$inject = ['$scope', '$mdDialog'];
    function StoreDialogController($scope, $mdDialog) {

      $scope.hide = function() {
        $mdDialog.hide();
      };
    }

