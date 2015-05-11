(function() {
  'use strict';


    angular.module('app.components')
      .directive('navbar', navbar);

    function navbar() {
      
      function link() {
      }

      return {
        link: link,
        scope: true,
        restrict: 'E',
        templateUrl: 'app/components/navbar/navbar.html',
        controller: 'NavbarController',
        controllerAs: 'vm'
      };
    }
})();