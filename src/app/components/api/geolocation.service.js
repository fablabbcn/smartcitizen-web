'use strict';

angular.module('components.api')
  .factory('geolocation', geolocation);
  

  function geolocation($http) {
    return $http.jsonp('http://ipinfo.io/?callback=JSON_CALLBACK');
  }