'use strict';

angular.module('components.navbar', [])
  .controller('NavbarCtrl', NavbarCtrl);


  function NavbarCtrl($scope) {
    $scope.date = new Date();
  }
