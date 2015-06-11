(function() {
  'use strict';

  angular.module('app.components')
    .controller('KitController', KitController);
    
    KitController.$inject = ['$scope', '$stateParams', 'marker', 'utils', 'sensor'];
    function KitController($scope, $stateParams, marker, utils, sensor) {
      var vm = this;
      var mainSensorID;
      var compareSensorID;
      var sensorsData;
      var picker = initializePicker();

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
      vm.moveChart = moveChart;

      $scope.$watch('vm.selectedSensor', function(newVal, oldVal) {
        vm.selectedSensorToCompare = undefined;
        vm.selectedSensorToCompareData = {};
        vm.chartDataCompare = [];
        compareSensorID = undefined;

        vm.sensors.forEach(function(sensor) {
          if(sensor.id === newVal) {
            vm.selectedSensorData = {
              icon: sensor.icon,
              value: sensor.value,
              unit: sensor.unit,
              color: sensor.color
            };
          }
        });

        setTimeout(function() {
          colorSensorMainIcon();
          colorSensorCompareName();    
          
          setSensor({type: 'main', value: newVal});
          changeChart('sensor', [mainSensorID, compareSensorID]);        
        }, 100);

      });

      $scope.$watch('vm.selectedSensorToCompare', function(newVal, oldVal) {
        vm.sensors.forEach(function(sensor) {
          if(sensor.id === newVal) {
            vm.selectedSensorToCompareData = {
              icon: sensor.icon,
              color: sensor.color,
              unit: sensor.unit
            };
          }
        });  
        setTimeout(function() {
          colorSensorCompareName();    
          setSensor({type: 'compare', value: newVal});   
          changeChart('sensor', [mainSensorID, compareSensorID]);
        }, 100);
        
      });

      var sensorData;

      setTimeout(function() {
        colorSensorMainIcon();
        colorArrows();
        colorClock();
      }, 1000);


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
        var value = sensor.value;

        if(!value) {
          return 'N/A';
        } else {
          value = value.toString();
          if(value.indexOf('.') !== -1) {
            value = value.slice(0, value.indexOf('.') + 3);
          }
        }
        return value;
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

        console.log('scroll', scrollPosition);
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

      function changeChart(updateType, sensorsID, options) {
        if(!sensorsID[0]) return;
        //if data is not loaded, get it first -> happens on controller initialization
        if(!sensorsData) {
          updateType = 'date';
          if(!options) {
            var options = {};
          }
          options.from = picker.getValuePickerFrom()
          options.to = picker.getValuePickerTo();
        }
        if(updateType === 'date') {
          //grab chart data and save it
          getChartData(options.from, options.to)
            .then(function() {              
              vm.chartDataMain = prepareChartData(sensorsID);
            });
        } else if(updateType === 'sensor') {          
          vm.chartDataMain = prepareChartData(sensorsID);
        }
      }

      function getChartData(dateFrom, dateTo, options) {
        var deviceID = $stateParams.id;

        return sensor.getSensorsData(deviceID, dateFrom, dateTo)
          .then(function(data) {
            //save sensor data of this kit so that it can be reused
            sensorsData = data.readings;
          });       
      }

      function prepareChartData(sensorsID) {
        var parsedDataMain = parseSensorData(sensorsData, sensorsID[0]);
        var mainSensor = {
          data: parsedDataMain,
          color: vm.selectedSensorData.color,
          unit: vm.selectedSensorData.unit
        };
        if(sensorsID[1]) {
          var parsedDataCompare = parseSensorData(sensorsData, sensorsID[1]);                
          var compareSensor = {
            data: parsedDataCompare,
            color: vm.selectedSensorToCompareData.color,
            unit: vm.selectedSensorToCompareData.unit
          };
        }
        var newChartData = [mainSensor, compareSensor]; 
        return newChartData;
      }

      function parseSensorData(data, sensorID) {
        if(data.length === 0) {
          return [];
        }
        return data.map(function(dataPoint) {
          return {
            time: dataPoint && dataPoint.timestamp,
            data: dataPoint && dataPoint.data[sensorID]
          };
        });
      }

      function setSensor(options) {
        var sensorID = options.value;
        if(sensorID === undefined) {
          return;
        }
        if(options.type === 'main') {
          mainSensorID = sensorID;          
        } else if(options.type === 'compare') {
          compareSensorID = sensorID;
        }
      }

      function colorSensorMainIcon() {
        var svgContainer = angular.element('.sensor_icon_selected');
        var parent = svgContainer.find('.container_parent');
        parent.css('fill', vm.selectedSensorData.color); 
      }

      function colorSensorCompareName() {
        var name = angular.element('.sensor_compare').find('md-select-label').find('span');
        name.css('color', vm.selectedSensorToCompareData.color || 'white');  
        var icon = angular.element('.sensor_compare').find('md-select-label').find('.md-select-icon');
        icon.css('color', 'white');
      }

      function colorArrows() {
        var svgContainer = angular.element('.chart_move_left').find('svg');
        svgContainer.find('.fill_container').css('fill', '#03252D');

        var svgContainer = angular.element('.chart_move_right').find('svg');
        svgContainer.find('.fill_container').css('fill', '#4E656B');
      }

      function colorClock() {
        var svgContainer = angular.element('.kit_time_icon');
        svgContainer.find('.stroke_container').css({'stroke-width': '0.5px', 'stroke':'#A4B0B3'});
        svgContainer.find('.fill_container').css('fill', '#A4B0B3');
      }

      function getSecondsFromDate(date) {
        return (new Date(date)).getTime();
      }

      function getCurrentRange() {
        return getSecondsFromDate( picker.getValuePickerTo() ) - getSecondsFromDate( picker.getValuePickerFrom() );
      }

      function moveChart(direction) {
        //grab current date range
        var currentRange = getCurrentRange();

        if(direction === 'left') {
          //set both from and to pickers to prev range
          picker.setValuePickerTo( picker.getValuePickerFrom() );
          picker.setValuePickerFrom( getSecondsFromDate( picker.getValuePickerFrom() ) - currentRange);
        } else if(direction === 'right') {
          //set both from and to pickers  to next range
          picker.setValuePickerFrom( picker.getValuePickerTo() );
          picker.setValuePickerTo( getSecondsFromDate( picker.getValuePickerTo() ) + currentRange);
        }
      }

      //hide everything but the functions to interact with the pickers
      function initializePicker() {
        var from_$input = $('#picker_from').pickadate({
          container: 'body',
          klass: {
            holder: 'picker__holder picker_container'
          }
        });
        var from_picker = from_$input.pickadate('picker');

        var to_$input = $('#picker_to').pickadate({
          container: 'body',
          klass: {
            holder: 'picker__holder picker_container'
          }
        });
        var to_picker = to_$input.pickadate('picker');

        if( from_picker.get('value') ) {
          to_picker.set('min', from_picker.get('select') );
        } 
        if( to_picker.get('value') ) {
          from_picker.set('max', to_picker.get('select') );
        }

        from_picker.on('set', function(event) {
          if(event.select) {
            if(to_picker.get('value')) {
              changeChart('date', [mainSensorID, compareSensorID], {from: from_picker.get('value'), to: to_picker.get('value') });                                          
            }
            to_picker.set('min', from_picker.get('select') );
          } else if( 'clear' in event) {
            to_picker.set('min', false);
          }
        });

        to_picker.on('set', function(event) {
          if(event.select) {  
            if(from_picker.get('value')) {
              changeChart('date', [mainSensorID, compareSensorID], {from: from_picker.get('value'), to: to_picker.get('value') });                             
            }          
            from_picker.set('max', to_picker.get('select'));
          } else if( 'clear' in event) {
            from_picker.set('max', false);
          }
        });

        //set to-picker max to today
        to_picker.set('max', new Date());

        function getToday() {
          return getSecondsFromDate(new Date());
        }

        function getSevenDaysAgo() {
          return getSecondsFromDate( getToday() - (7 * 24 * 60 * 60 * 1000) );
        }

        //set from-picker to today
        from_picker.set('select', getSevenDaysAgo());
        //set to-picker to seven days ago
        to_picker.set('select', getToday());

        return {
          getValuePickerFrom: function() {
            return from_picker.get('value');
          },
          setValuePickerFrom: function(newValue) {
            from_picker.set('select', newValue);
          },
          getValuePickerTo: function() {
            return to_picker.get('value');
          },
          setValuePickerTo: function(newValue) {
            to_picker.set('select', newValue);
          }
        };
      }
    }
})();
