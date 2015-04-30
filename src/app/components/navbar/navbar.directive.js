'use strict';


  angular.module('app.core')
    .directive('navbar', navbar);


  function navbar($window) {
    
    function link(scope, element, attrs) {
      
    }

    return {
      link: link,
      scope: false,
      restrict: 'E',
      controller: 'NavbarController',
      controllerAs: 'vm',
      templateUrl: 'app/components/navbar/navbar.html'
    };
  }