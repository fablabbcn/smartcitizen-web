(function() {
	'use strict';

	angular.module('app.components')
	  .factory('geolocation', geolocation);

	  geolocation.$inject = ['$http', '$window'];
	  function geolocation($http, $window) {
      var position;
      initialize();

      var service = {
        getPosition: getPosition,
        callAPI: callAPI,
        getPositionObj: getPositionObj,
				grantHTML5Geolocation: grantHTML5Geolocation,
				isHTML5GeolocationGranted: isHTML5GeolocationGranted
      };
      return service;

      ///////////////////////////

      function initialize() {
        getPosition();
      }

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

			function grantHTML5Geolocation(){
				$window.localStorage.setItem('smartcitizen.geolocation_granted', true);
			}

			function isHTML5GeolocationGranted(){
				return $window.localStorage.getItem('smartcitizen.geolocation_granted');
			}
	  }
})();
