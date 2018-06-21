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
          value = value.toString();
          if(value.indexOf('.') !== -1) {
            value = value.slice(0, value.indexOf('.') + 3);
          }
        }

        return value;
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
            return './assets/images/temperature_icon.svg';

          case 'HUMIDITY':
            return './assets/images/humidity_icon.svg';

          case 'LIGHT':
            return './assets/images/light_icon.svg';

          case 'SOUND':
            return './assets/images/sound_icon.svg';

          case 'CO':
            return './assets/images/co_icon.svg';

          case 'NO2':
            return './assets/images/no2_icon.svg';

          case 'NETWORKS':
            return './assets/images/networks_icon.svg';

          case 'BATTERY':
            return './assets/images/battery_icon.svg';

          case 'SOLAR PANEL':
            return './assets/images/solar_panel_icon.svg';

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
            return '#00A102';

          case 'NO2':
            return '#8bc34a';  // still old color

          case 'NETWORKS':
            return '#681DBD';

          case 'SOLAR PANEL':
            return '#FF8600';

          case 'BATTERY':
            return '#ffee58';  // still old color

          default:
            return '#ff5722';  // still old color
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
