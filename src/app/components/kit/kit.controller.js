(function() {
  'use strict';

  angular.module('app.components')
    .controller('KitController', KitController);
    
    KitController.$inject = ['$scope', '$stateParams', 'marker', 'utils', 'sensor'];
    function KitController($scope, $stateParams, marker, utils, sensor) {
      var vm = this;
      
      vm.marker = augmentMarker(marker);

      vm.battery;

      vm.sensors = getSensors(marker);

      vm.slide = slide;

      vm.selectedSensor = vm.sensors[0].id; 
      vm.selectedSensorData = {
        icon: vm.sensors[0].icon,
        value: vm.sensors[0].value,
        unit: vm.sensors[0].unit,
        color: vm.sensors[0].color
      };
      vm.chartDataMain;

      vm.selectedSensorToCompare;
      vm.selectedSensorToCompareData;
      vm.chartDataCompare;

      vm.getSensorsToCompare = getSensorsToCompare;

      $scope.$watch('vm.selectedSensor', function(newVal, oldVal) {
        vm.selectedSensorToCompare = undefined;
        vm.selectedSensorToCompareData = {};
        vm.chartDataCompare = [];

        vm.sensors.forEach(function(sensor) {
          if(sensor.id === newVal) {
            vm.selectedSensorData = {
              icon: sensor.icon,
              value: sensor.value,
              unit: sensor.unit,
              color: sensor.color
            };
            vm.sensorDataMain = {
              color: sensor.color,
              unit: sensor.unit
            };
          }
        });
        
        setTimeout(function() {
          colorSensorMainIcon();
          colorSensorCompareName();    
        }, 0);

        setSensor({type: 'main', value: newVal});
      });

      $scope.$watch('vm.selectedSensorToCompare', function(newVal, oldVal) {
        vm.sensors.forEach(function(sensor) {
          if(sensor.id === newVal) {
            vm.selectedSensorToCompareData = {
              icon: sensor.icon,
              color: sensor.color
            };
            vm.sensorDataCompare = {
              color: sensor.color,
              unit: sensor.unit
            };
          }
        });  
        setTimeout(function() {
          colorSensorCompareName();    
        }, 0);

        setSensor({type: 'compare', value: newVal});     
      });

      var sensorData;
      getChartData();

      setTimeout(function() {
        colorSensorMainIcon();
      }, 500)
      ///////////////
      
      function augmentMarker(marker) {
        marker.time = moment(utils.parseKitTime(marker)).fromNow();
        return marker;
      }

      function getSensors(marker) {

        var sensors = marker.data.sensors.map(function(sensor) {
          var sensorID = sensor.id;
          var sensorName = getSensorName(sensor);
          var sensorUnit = getSensorUnit(sensorName);
          var sensorValue = getSensorValue(sensor); 
          var sensorIcon = getSensorIcon(sensorName); 
          var sensorArrow = getSensorArrow(sensor); 
          var sensorColor = getSensorColor(sensorName);
          
          var obj = {
            id: sensorID,
            name: sensorName,
            unit: sensorUnit,
            value: sensorValue,
            icon: sensorIcon,
            arrow: sensorArrow,
            color: sensorColor
          };

          if(sensorName === 'BATTERY') {
            vm.battery = obj;
          } else {
            return obj;
          }          
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
            sensorUnit = 'N/A';
        }
        return sensorUnit;
      }

      function getSensorValue(sensor) {
        if(!sensor.value) {
          return 'N/A';
        }
        return sensor.value;
      }

      function getSensorPrevValue(sensor) {
        return sensor.prev_value;
      }

      function getSensorIcon(sensorName) {

        switch(sensorName) {
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
            return './assets/images/avatar.svg';                      
        }
      }

      function getSensorArrow(sensor) {
        var currentValue = getSensorValue(sensor);
        var prevValue = getSensorPrevValue(sensor);

        if(currentValue > prevValue) {
          return './assets/images/arrow_up_icon.svg';          
        } else if(currentValue < prevValue) {
          return './assets/images/arrow_down_icon.svg';
        } else {
          return './assets/images/equal_icon.svg';        
        }
      }

      function getSensorColor(sensorName) {
        switch(sensorName) {
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

          default: 
            return 'black';                      
        }
      }

      function slide(direction) {
        var slideContainer = angular.element('.sensors_container');
        var scrollPosition = slideContainer.scrollLeft();
        var slideStep = 20;

        if(direction === 'left') {
          slideContainer.scrollLeft(scrollPosition + slideStep);
        } else if(direction === 'right') {
          slideContainer.scrollLeft(scrollPosition - slideStep);          
        }
      }

      function getSensorsToCompare() {
        return vm.sensors.filter(function(sensor) {
          return sensor.id !== vm.selectedSensor;
        });
      }

      function getChartData(sensorID) {
        var deviceID = $stateParams.id;

        return sensor.getSensorsData(deviceID);        
      }

      function parseChartData(data, sensorID) {
        if(data.length === 0) {
          return [];
        }
        return data.map(function(dataPoint) {
          return {
            time: dataPoint.timestamp,
            data: dataPoint && dataPoint.data[sensorID]
          };
        });
      }

      function setSensor(options) {
        var sensorID = options.value;

        if(sensorID === undefined) {
          return;
        }

        getChartData(sensorID)
          .then(function(data) {
            data = data.plain();
            var parsedData = parseChartData(data.readings, sensorID);
            if(options.type === 'main') {
              vm.chartDataMain = parsedData;
            } else if(options.type === 'compare') {
              vm.chartDataCompare = parsedData;                
            }
          });
      }

      function colorSensorMainIcon() {
        var svgContainer = angular.element('.sensor_icon_selected');
        var parent = svgContainer.find('.container_parent');
        console.log('parent', parent);
        parent.css('fill', vm.selectedSensorData.color); 
      }

      function colorSensorCompareName() {
        var name = angular.element('.sensor_compare').find('md-select-label').find('span');
        name.css('color', vm.selectedSensorToCompareData.color || 'white');  
        var icon = angular.element('.sensor_compare').find('md-select-label').find('.md-select-icon');
        icon.css('color', 'white');
      }
    }
})();
