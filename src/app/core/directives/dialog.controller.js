'use strict';

angular.module('app.core')
  .controller('DialogController', DialogController);


  function DialogController($scope, $mdDialog) {

    $scope.answer = function(answer) {
      $mdDialog.hide(answer);
    };
  }