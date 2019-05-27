(function() {
  'use strict';

  angular.module('app.components')
    .factory('sensorUtils', sensorUtils);

    sensorUtils.$inject = ['timeUtils'];
    function sensorUtils(timeUtils) {
      var service = {
        getRollup: getRollup,
        getSensorName: getSensorName,
        getSensorUnit: getSensorUnit,
        getSensorValue: getSensorValue,
        getSensorPrevValue: getSensorPrevValue,
        getSensorIcon: getSensorIcon,
        getSensorArrow: getSensorArrow,
        getSensorColor: getSensorColor,
        getSensorDescription: getSensorDescription
      };
      return service;

      ///////////////

      function getRollup(dateFrom, dateTo) {

        // Calculate how many data points we can fit on a users screen
        // Smaller screens request less data from the API
        var durationInSec = moment(dateTo).diff(moment(dateFrom)) / 1000;
        var chartWidth = window.innerWidth / 2;

        var rollup = parseInt(durationInSec / chartWidth) + 's';

        /*
        //var rangeDays = timeUtils.getCurrentRange(dateFrom, dateTo, {format: 'd'});
        var rollup;
        if(rangeDays <= 1) {
          rollup = '15s';
        } else if(rangeDays <= 7) {
          rollup = '1h';//rollup = '15m';
        } else if(rangeDays > 7) {
          rollup = '1d';
        }
        */
        return rollup;
      }

      function getSensorName(name) {

        var sensorName;

        if( new RegExp('custom circuit', 'i').test(name) ) {
          sensorName = name;
        } else {
          if(new RegExp('noise', 'i').test(name) ) {
            sensorName = 'SOUND';
          } else if(new RegExp('light', 'i').test(name) ) {
            sensorName = 'LIGHT';
          } else if((new RegExp('nets', 'i').test(name) ) ||
              (new RegExp('wifi', 'i').test(name))) {
            sensorName = 'NETWORKS';
          } else if(new RegExp('co', 'i').test(name) ) {
            sensorName = 'CO';
          } else if(new RegExp('no2', 'i').test(name) ) {
            sensorName = 'NO2';
          } else if(new RegExp('humidity', 'i').test(name) ) {
            sensorName = 'HUMIDITY';
          } else if(new RegExp('temperature', 'i').test(name) ) {
            sensorName = 'TEMPERATURE';
          } else if(new RegExp('panel', 'i').test(name) ) {
            sensorName = 'SOLAR PANEL';
          } else if(new RegExp('battery', 'i').test(name) ) {
            sensorName = 'BATTERY';
          } else if(new RegExp('barometric pressure', 'i').test(name) ) {
            sensorName = 'BAROMETRIC PRESSURE';
          } else if(new RegExp('PM 1', 'i').test(name) ) {
            sensorName = 'PM 1';
          } else if(new RegExp('PM 2.5', 'i').test(name) ) {
            sensorName = 'PM 2.5';
          } else if(new RegExp('PM 10', 'i').test(name) ) {
            sensorName = 'PM 10';
          } else {
            sensorName = name;
          }
        }
        return sensorName.toUpperCase();
      }

      function getSensorUnit(sensorName) {
        var sensorUnit;

        switch(sensorName) {
          case 'TEMPERATURE':
            sensorUnit = '°C';
            break;
          case 'LIGHT':
            sensorUnit = 'LUX';
            break;
          case 'SOUND':
            sensorUnit = 'DB';
            break;
          case 'HUMIDITY':
          case 'BATTERY':
            sensorUnit = '%';
            break;
          case 'CO':
          case 'NO2':
            sensorUnit = 'KΩ';
            break;
          case 'NETWORKS':
            sensorUnit = '#';
            break;
          case 'SOLAR PANEL':
            sensorUnit = 'V';
            break;
          case 'BAROMETRIC PRESSURE':
            sensorUnit = 'K Pa';
            break;
          case 'PM 1':
          case 'PM 2.5':
          case 'PM 10':
            sensorUnit = 'ug/m3';
            break;
          default:
            sensorUnit = 'N/A';
        }
        return sensorUnit;
      }

      function getSensorValue(sensor) {
        var value = sensor.value;

        if(isNaN(parseInt(value))) {
          value =  'N/A';
        } else {
          value = round(value, 1).toString();
        }

        return value;
      }

      function round(value, precision) {
          var multiplier = Math.pow(10, precision || 0);
          return Math.round(value * multiplier) / multiplier;
      }

      function getSensorPrevValue(sensor) {
        /*jshint camelcase: false */
        var prevValue = sensor.prev_value;
        return (prevValue && prevValue.toString() ) || 0;
      }

      function getSensorIcon(sensorName) {

        var thisName = getSensorName(sensorName);

        switch(thisName) {
          case 'TEMPERATURE':
            return './assets/images/temperature_icon_new.svg';

          case 'HUMIDITY':
            return './assets/images/humidity_icon_new.svg';

          case 'LIGHT':
            return './assets/images/light_icon_new.svg';

          case 'SOUND':
            return './assets/images/sound_icon_new.svg';

          case 'CO':
            return './assets/images/co_icon_new.svg';

          case 'NO2':
            return './assets/images/no2_icon_new.svg';

          case 'NETWORKS':
            return './assets/images/networks_icon.svg';

          case 'BATTERY':
            return './assets/images/battery_icon.svg';

          case 'SOLAR PANEL':
            return './assets/images/solar_panel_icon.svg';

          case 'BAROMETRIC PRESSURE':
            return './assets/images/pressure_icon_new.svg';

          case 'PM 1':
          case 'PM 2.5':
          case 'PM 10':
            return './assets/images/particle_icon_new.svg';

          default:
            return './assets/images/unknownsensor_icon.svg';
        }
      }

      function getSensorArrow(currentValue, prevValue) {
        currentValue = parseInt(currentValue) || 0;
        prevValue = parseInt(prevValue) || 0;

        if(currentValue > prevValue) {
          return 'arrow_up';
        } else if(currentValue < prevValue) {
          return 'arrow_down';
        } else {
          return 'equal';
        }
      }

      function getSensorColor(sensorName) {
        switch(getSensorName(sensorName)) {
          case 'TEMPERATURE':
            return '#FF3D4C';

          case 'HUMIDITY':
            return '#55C4F5';

          case 'LIGHT':
            return '#ffc107';

          case 'SOUND':
            return '#0019FF';

          case 'CO':
            return '#00A103';

          case 'NO2':
            return '#8cc252';

          case 'NETWORKS':
            return '#681EBD';

          case 'SOLAR PANEL':
            return '#d555ce';

          case 'BATTERY':
            return '#ff8601';

          default:
            return '#0019FF';
        }
      }

      function getSensorDescription(sensorID, sensorTypes) {
        return _(sensorTypes)
          .chain()
          .find(function(sensorType) {
            return sensorType.id === sensorID;
          })
          .value()
          .measurement.description;
      }
    }
})();
