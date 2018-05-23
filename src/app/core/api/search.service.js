
    search.$inject = ['$http', 'Restangular'];
    export default function search($http, Restangular) {
      var service = {
        globalSearch: globalSearch
      };

      return service;

      /////////////////////////

      function globalSearch(query) {
    	  return Restangular.all('search').getList({q: query});
      }
    }
