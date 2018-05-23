(function() { 
  'use strict';

  
    .factory('search', search);
    
    search.$inject = ['$http', 'Restangular'];
    function search($http, Restangular) {
      var service = {
        globalSearch: globalSearch
      };

      return service;

      /////////////////////////

      function globalSearch(query) {
    	  return Restangular.all('search').getList({q: query});
      }
    }

