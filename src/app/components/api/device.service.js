(function() {
	'use strict';

	angular.module('app.components')
	  .factory('device', device);
    
    device.$inject = ['Restangular'];
	  function device(Restangular) {
      var genericKitData;

      callGenericKitData()
        .then(function(data) {
          genericKitData = _.indexBy(data, 'id');
        });

	  	var service = {
        getDevices: getDevices,
        getAllDevices: getAllDevices,
        getDevice: getDevice,
        getGenericKitData: getGenericKitData
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
	  }
})();
