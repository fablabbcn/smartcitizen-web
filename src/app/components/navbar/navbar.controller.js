'use strict';

angular.module('NavBar', [])
  .controller('NavbarCtrl', NavbarCtrl);


  function NavbarCtrl($scope) {
    $scope.date = new Date();


  }
