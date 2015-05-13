(function() {
	'use strict';

	angular.module('app.components')
	  .factory('geolocation', geolocation);
	  
	  geolocation.$inject = ['$http'];
	  function geolocation($http) {
      var position; 
      getPosition();

      var service = {
        getPosition: getPosition,
        callAPI: callAPI 
      };
      return service;

      ///////////////////////////
      
      function getPosition() {
        return callAPI().success(function(data) {
          var arrLoc = data.loc.split(',');
          var location = {
            lat: parseFloat(arrLoc[0]),
            lng: parseFloat(arrLoc[1])
          };
          position = location;
          return position;
        });
      }

      function callAPI() {
	      return $http.jsonp('http://ipinfo.io/?callback=JSON_CALLBACK'); 
      }
	  }
})();
