(function() {
  'use strict';

  angular.module('app.components')
    .controller('PasswordResetDialogController', PasswordResetDialogController);

    PasswordResetDialogController.$inject = ['$scope', '$mdDialog'];
    function PasswordResetDialogController($scope, $mdDialog) {

      $scope.answer = function() {

      }
      $scope.cancel = function() {
        $mdDialog.hide();
      }
      $scope.hide = function() {
        $mdDialog.hide();
      }
    }
})();
