(function() {
	'use strict';

	angular.module('app.components')
	  .factory('device', device);
    
    device.$inject = ['Restangular'];
	  function device(Restangular) {

	  	var service = {
        getDevices: getDevices,
        getAllDevices: getAllDevices
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

      function getDevice(id) {
        return Restangular.one('devices', id);
      }
	  }
})();
