(function() {
	'use strict';

	angular.module('app.components')
	  .factory('device', device);

    device.$inject = ['Restangular', '$window', 'timeUtils','$timeout'];
	  function device(Restangular, $window, timeUtils, $timeout) {
      var genericKitData, worldMarkers;

      initialize();

      callGenericKitData()
        .then(function(data) {
          genericKitData = _.indexBy(data, 'id');
        });

	  	var service = {
        getDevices: getDevices,
        getAllDevices: getAllDevices,
        getDevice: getDevice,
        createDevice: createDevice,
        updateDevice: updateDevice,
        getGenericKitData: getGenericKitData,
        getWorldMarkers: getWorldMarkers,
        setWorldMarkers: setWorldMarkers,
        mailReadings: mailReadings,
        noCache: false,
        setNoCacheTimer: setNoCacheTimer
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
      	return Restangular.all('devices').getList({near: parameter, 
          'per_page': '100'});
      }

      function getAllDevices() {
        if (service.noCache){
          //var timeStamp = parseInt(new Date().getTime() / 1000);
          /*jshint camelcase: false */
          var results = Restangular.all('devices/fresh_world_map').getList();
          //  .getList({cachebuster: timeStamp});
          service.noCache = false;
          return results;
        } else {
          return Restangular.all('devices/world_map').getList();
        }
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

      function callGenericKitData() {
        return Restangular.all('kits').getList();
      }

      function getGenericKitData() {
        return genericKitData;
      }

      function getWorldMarkers() {
        return worldMarkers || 
          ($window.localStorage
            .getItem('smartcitizen.markers') && 
            JSON.parse($window.localStorage
              .getItem('smartcitizen.markers')).data);
      }

      function setWorldMarkers(data) {
        var obj = {
          timestamp: new Date(),
          data: data
        };

        $window.localStorage
          .setItem('smartcitizen.markers', JSON.stringify(obj) );
        worldMarkers = obj.data;
      }

      function getTimeStamp() {
        return ($window.localStorage.getItem('smartcitizen.markers') &&
					JSON.parse($window.localStorage
						.getItem('smartcitizen.markers') ).timestamp);
      }

      function areMarkersOld() {
        var markersDate = getTimeStamp();
        return !timeUtils.isWithin15min(markersDate);
      }

      function removeMarkers() {
        $window.localStorage.removeItem('smartcitizen.markers');
      }

      function mailReadings(kit) {
      return Restangular
          .one('devices', kit.id)
          .customGET('readings/csv_archive');
      }

      function setNoCacheTimer(time){
        service.noCache = true;
        $timeout(function(){
          service.noCache = false;
        }, time);
      }
	  }
})();
