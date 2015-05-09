'use strict';

angular.module('app.components')
  .controller('DialogController', DialogController);

  DialogController.$inject = ['$scope', '$mdDialog'];
  function DialogController($scope, $mdDialog) {
    $scope.answer = function(answer) {
      $mdDialog.hide(answer);
    };
    $scope.hide = function() {
      $mdDialog.hide();
    };
  }