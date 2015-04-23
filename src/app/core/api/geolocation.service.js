angular.module('core.services.geolocation', [])
  .factory('geolocation', geolocation)
  

  function geolocation($http) {
    return $http.jsonp('http://ipinfo.io/?callback=JSON_CALLBACK');
  }