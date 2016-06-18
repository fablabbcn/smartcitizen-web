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
        var rangeDays = timeUtils.getCurrentRange(dateFrom, dateTo, {format: 'd'});

        var rollup;
        if(rangeDays <= 1) {
          rollup = '10m';
        } else if(rangeDays <= 7) {
          rollup = '1h';//rollup = '15m';
        } else if(rangeDays > 7) {
          rollup = '1d';
        }
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
          return './assets/images/arrow_up_icon.svg';
        } else if(currentValue < prevValue) {
          return './assets/images/arrow_down_icon.svg';
        } else {
          return './assets/images/equal_icon.svg';
        }
      }

      function getSensorColor(sensorName) {
        switch(getSensorName(sensorName)) {
          case 'TEMPERATURE':
            return '#ffc107';

          case 'HUMIDITY':
            return '#4fc3f7';

          case 'LIGHT':
            return '#ffee58';

          case 'SOUND':
            return '#f06292';

          case 'CO':
            return '#4caf50';

          case 'NO2':
            return '#8bc34a';

          case 'NETWORKS':
            return '#9575cd';

          case 'SOLAR PANEL':
            return '#fff9c4';

          case 'BATTERY':
            return '#ffee58';

          default:
            return '#ff5722';
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
