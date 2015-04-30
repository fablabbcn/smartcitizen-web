'use strict';


  angular.module('components.signup')
    .directive('signup', signup);


  function signup($window) {
    
    function link(scope, element, attrs) {
      
    }

    return {
      link: link,
      scope: false,
      restrict: 'E',
      controller: 'SignupController',
      controllerAs: 'vm',
      templateUrl: 'app/components/signup/signup.html'
    };
  }