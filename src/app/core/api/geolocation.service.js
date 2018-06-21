(function() {
	'use strict';

	angular.module('app.components')
	  .factory('geolocation', geolocation);

	  geolocation.$inject = ['$http', '$window'];
	  function geolocation($http, $window) {

      var service = {
				grantHTML5Geolocation: grantHTML5Geolocation,
				isHTML5GeolocationGranted: isHTML5GeolocationGranted
      };
      return service;

      ///////////////////////////


			function grantHTML5Geolocation(){
				$window.localStorage.setItem('smartcitizen.geolocation_granted', true);
			}

			function isHTML5GeolocationGranted(){
				return $window.localStorage
					.getItem('smartcitizen.geolocation_granted');
			}
	  }
})();
