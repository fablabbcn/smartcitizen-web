(function() {
  'use strict';

  angular.module('app.components')
    .factory('sensor', sensor);

    sensor.$inject = ['Restangular', 'utils', 'sensorUtils'];
    function sensor(Restangular, utils, sensorUtils) {
      var sensorTypes;
      callAPI().then(function(data) {
        console.log('sensors', data.plain());
        setTypes(data);
      });
      var prevDeviceID;

      var service = {
        callAPI: callAPI,
        setTypes: setTypes,
        getTypes: getTypes,
        getSensorsData: getSensorsData
      };
      return service;

      ////////////////

      function callAPI() {
        return Restangular.all('sensors').getList();
      }

      function setTypes(sensorTypes) {
        sensorTypes = sensorTypes;
      }

      function getTypes() {
        return sensorTypes;
      }

      function getSensorsData(deviceID, dateFrom, dateTo) {
        var rollup = sensorUtils.getRollup(dateFrom, dateTo);

        var dateFrom = utils.convertTime(dateFrom);
        var dateTo = utils.convertTime(dateTo);
        if(!dateFrom || !dateTo) {
          return Restangular.one('devices', deviceID).customGET('pg_readings');        
        }
        console.log('here', rollup);
        return Restangular.one('devices', deviceID).customGET('pg_readings', {'from': dateFrom, 'to': dateTo, all_intervals: true, rollup: rollup});
      }
    }
})();
