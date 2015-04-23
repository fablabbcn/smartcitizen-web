'use strict';

angular.module('components.navbar', [])
  .controller('NavbarController', NavbarController);


  function NavbarController($scope) {
    $scope.date = new Date();
  }
