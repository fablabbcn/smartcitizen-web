'use strict';


  angular.module('app.components')
    .directive('search', search);

  function search() {
    
    function link() {
    }

    return {
      link: link,
      scope: true,
      restrict: 'E',
      templateUrl: 'app/components/search/search.html',
      controller: 'SearchController',
      controllerAs: 'vm'
    };
  }
