(function() {
	'use strict';

	angular.module('app.components')
	  .factory('device', device);
    
    device.$inject = ['Restangular', '$window'];
	  function device(Restangular, $window) {
      var genericKitData, worldMarkers;

      callGenericKitData()
        .then(function(data) {
          genericKitData = _.indexBy(data, 'id');
        });

	  	var service = {
        getDevices: getDevices,
        getAllDevices: getAllDevices,
        getDevice: getDevice,
        getGenericKitData: getGenericKitData,
        getWorldMarkers: getWorldMarkers,
        setWorldMarkers: setWorldMarkers
	  	};

	  	return service;

	  	//////////////////////////
      
      function getDevices(location) {
      	var parameter = '';
      	parameter += location.lat + ',' + location.lng;
      	return Restangular.all('devices').getList({near: parameter});
      }

      function getAllDevices() {
        return Restangular.all('devices/world_map').getList();
      }

      function getDevice(id) {
        return Restangular.one('devices', id).get();
      }

      function callGenericKitData() {
        return Restangular.all('kits').getList();
      }

      function getGenericKitData() {
        return genericKitData;
      }

      function getWorldMarkers() {
        return worldMarkers || ($window.localStorage.getItem('smartcitizen.markers') && JSON.parse($window.localStorage.getItem('smartcitizen.markers') ));
      }

      function setWorldMarkers(data) {
        $window.localStorage.setItem('smartcitizen.markers', JSON.stringify(data) );
        worldMarkers = data; 
      }
	  }
})();
