'use strict';

angular.module('app.components')
  .factory('geolocation', geolocation);
  

  function geolocation($http) {
    return $http.jsonp('http://ipinfo.io/?callback=JSON_CALLBACK');
  }