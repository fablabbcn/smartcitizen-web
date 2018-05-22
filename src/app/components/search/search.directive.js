import angular from 'angular';


  angular.module('app.components')
    .directive('search', search);

  function search() {
    return {
      scope: true,
      restrict: 'E',
      templateUrl: 'app/components/search/search.html',
      controller: 'SearchController',
      controllerAs: 'vm'
    };
  }

