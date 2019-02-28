(function() {
	'use strict';

	angular.module('app.components')
	  .factory('device', device);

    device.$inject = ['Restangular', '$window', 'timeUtils','$http', 'auth', '$rootScope'];
	  function device(Restangular, $window, timeUtils, $http, auth, $rootScope) {
      var kitBlueprints, worldMarkers;

      initialize();

	  	var service = {
        getDevices: getDevices,
        getAllDevices: getAllDevices,
        getDevice: getDevice,
        createDevice: createDevice,
        updateDevice: updateDevice,
        createKitBlueprints: createKitBlueprints,
        getKitBlueprints: getKitBlueprints,
        getWorldMarkers: getWorldMarkers,
        setWorldMarkers: setWorldMarkers,
        mailReadings: mailReadings,
        postReadings: postReadings,
				removeDevice: removeDevice,
        updateContext: updateContext
	  	};

	  	return service;

	  	//////////////////////////

      function initialize() {
        if(areMarkersOld()) {
          removeMarkers();
        }
      }

      function getDevices(location) {
      	var parameter = '';
      	parameter += location.lat + ',' + location.lng;
      	return Restangular.all('devices').getList({near: parameter, 'per_page': '100'});
      }

      function getAllDevices(forceReload) {
        if (forceReload || auth.isAuth()) {
          return getAllDevicesNoCached();
        } else {
          return getAllDevicesCached();
        }
      }

      function getAllDevicesCached() {
        return Restangular.all('devices/world_map')
          .getList()
          .then(function(fetchedDevices){
            return fetchedDevices.plain();
        });
      }

      function getAllDevicesNoCached() {
        return Restangular.all('devices/fresh_world_map')
          .getList()
          .then(function(fetchedDevices){
            return fetchedDevices.plain();
        });
      }

      function getDevice(id) {
        return Restangular.one('devices', id).get();
      }

      function createDevice(data) {
        return Restangular.all('devices').post(data);
      }

      function updateDevice(id, data) {
        return Restangular.one('devices', id).patch(data);
      }

      function getKitBlueprints() {
        return kitBlueprints;
      }

      function createKitBlueprints() {
        return Restangular.all('kits').getList({'per_page': 1000})
          .then(function(fetchedKitBlueprints){
            kitBlueprints = _.keyBy(fetchedKitBlueprints.plain(), 'id');
            return kitBlueprints;
        });
      }

      function getWorldMarkers() {
        return worldMarkers || ($window.localStorage.getItem('smartcitizen.markers') && JSON.parse($window.localStorage.getItem('smartcitizen.markers') ).data);
      }

      function setWorldMarkers(data) {
        var obj = {
          timestamp: new Date(),
          data: data
        };

        $window.localStorage.setItem('smartcitizen.markers', JSON.stringify(obj) );
        worldMarkers = obj.data;
      }

      function getTimeStamp() {
        return ($window.localStorage.getItem('smartcitizen.markers') &&
					JSON.parse($window.localStorage
						.getItem('smartcitizen.markers') ).timestamp);
      }

      function areMarkersOld() {
        var markersDate = getTimeStamp();
        return !timeUtils.isWithin(1, 'minutes', markersDate);
      }

      function removeMarkers() {
        worldMarkers = null;
        $window.localStorage.removeItem('smartcitizen.markers');
      }

      function mailReadings(kit) {
      	return Restangular
          .one('devices', kit.id)
          .customGET('readings/csv_archive');
      }

			function postReadings(kit, readings) {
				return Restangular
          .one('devices', kit.id)
          .post('readings', readings);
			}

			function removeDevice(deviceID){
				return Restangular
          .one('devices', deviceID)
					.remove();
			}

      function updateContext (){
        return auth.updateUser().then(function(){
          removeMarkers();
          $rootScope.$broadcast('devicesContextUpdated');
        });
      }

	  }
})();
