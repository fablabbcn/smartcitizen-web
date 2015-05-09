'use strict';

angular.module('app.components')
  .controller('NavbarController', NavbarController);

  NavbarController.$inject = ['$scope'];
  function NavbarController($scope) {

    $scope.isShown = true;

    $scope.$on('removeNav', function() {
      $scope.$apply(function() {
        $scope.isShown = false;
      });
    });

    $scope.$on('addNav', function() {
      $scope.$apply(function() {
        $scope.isShown = true;
      });
    });
  }