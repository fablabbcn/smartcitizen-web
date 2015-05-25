(function() {
  'use strict';

  angular.module('app.components')
    .controller('KitController', KitController);
    
    KitController.$inject = ['marker'];
    function KitController(marker) {
      var vm = this;
      
      vm.marker = marker;
      console.log('marker', vm.marker);
      
      vm.battery;

      vm.sensors = getSensors(marker);
      console.log('sensors', vm.sensors);

      ///////////////


      function getSensors(marker) {

        var sensors = marker.data.sensors.map(function(sensor) {
          var sensorName = getSensorName(sensor);
          var sensorUnit = getSensorUnit(sensorName);
          var sensorValue = getSensorValue(sensor); 
          var sensorIcon = getSensorIcon(sensorName); 
          var sensorArrow = getSensorArrow(sensor); 
          
          if(sensorName === 'BATTERY') {
            vm.battery = sensorValue + sensorUnit;
            return;
          }

          return {
            name: sensorName,
            unit: sensorUnit,
            value: sensorValue,
            icon: sensorIcon,
            arrow: sensorArrow
          };
        });

        return sensors.filter(function(sensor) {
          return sensor; 
        });
      }

      function getSensorName(sensor) {
        var name = sensor.name;
        var description = sensor.description;
        var sensorName;

        if( new RegExp('custom circuit', 'i').test(description) ) {
          sensorName = name;
        } else {
          if(new RegExp('noise', 'i').test(description) ) {
            sensorName = 'SOUND';
          } else if(new RegExp('light', 'i').test(description) ) {
            sensorName = 'LIGHT';
          } else if(new RegExp('wifi', 'i').test(description) ) {  
            sensorName = 'NETWORKS';
          } else if(new RegExp('co', 'i').test(description) ) {
            sensorName = 'CO';
          } else if(new RegExp('no2', 'i').test(description) ) {
            sensorName = 'NO2';
          } else {
            sensorName = description;
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
            sensorUnit = 'n';
        }
        return sensorUnit;
      }

      function getSensorValue(sensor) {
        //if(!sensor.value) {
          //return '--';
        //}
        //return sensor.value;
        return 5;
      }

      function getSensorPrevValue(sensor) {
        return sensor.prev_value;
      }

      function getSensorIcon(sensorName) {

        switch(sensorName) {
          case 'TEMPERATURE':
            return 'http://fablabbcn.github.io/smartcitizen-web/assets/images/avatar.svg';            
            
          case 'HUMIDITY':
            return 'http://fablabbcn.github.io/smartcitizen-web/assets/images/avatar.svg';
            
          case 'LIGHT':
            return 'http://fablabbcn.github.io/smartcitizen-web/assets/images/avatar.svg';
            
          case 'SOUND': 
            return 'http://fablabbcn.github.io/smartcitizen-web/assets/images/avatar.svg';
            
          case 'CO':
            return 'http://fablabbcn.github.io/smartcitizen-web/assets/images/avatar.svg';
            
          case 'NO2':
            return 'http://fablabbcn.github.io/smartcitizen-web/assets/images/avatar.svg';
            
          default: 
            return 'http://fablabbcn.github.io/smartcitizen-web/assets/images/avatar2.svg';                      
        }
      }

      function getSensorArrow(sensor) {
        var currentValue = getSensorValue(sensor);
        var prevValue = getSensorPrevValue(sensor);

        if(currentValue > prevValue) {
          return 'http://fablabbcn.github.io/smartcitizen-web/assets/images/avatar.svg';          
        } else if(currentValue < prevValue) {
          return 'http://fablabbcn.github.io/smartcitizen-web/assets/images/avatar.svg';
        } else {
          return 'http://fablabbcn.github.io/smartcitizen-web/assets/images/avatar.svg';        
        }
      }
    }
})();
