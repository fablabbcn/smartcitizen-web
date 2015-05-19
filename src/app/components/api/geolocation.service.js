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
        callAPI: callAPI,
        getPositionObj: getPositionObj
      };
      return service;

      ///////////////////////////
      
      function getPosition() {
        return callAPI().success(function(data) {
          var arrLoc = data.loc.split(',');
          position = {
            lat: parseFloat(arrLoc[0]),
            lng: parseFloat(arrLoc[1])
          };
          return position;
        });
      }

      function getPositionObj() {
        return position;
      }

      function callAPI() {
	      return $http.jsonp('http://ipinfo.io/?callback=JSON_CALLBACK'); 
      }
	  }
})();
