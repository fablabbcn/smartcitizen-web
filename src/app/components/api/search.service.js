'use strict';

angular.module('app.components')
  .factory('search', search);
  

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