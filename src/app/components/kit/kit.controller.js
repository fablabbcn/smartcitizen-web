(function() {
  'use strict';

  angular.module('app.components')
    .controller('KitController', KitController);
    
    KitController.$inject = ['$scope', '$stateParams', 'marker', 'utils', 'sensor', 'Kit', '$mdDialog'];
    function KitController($scope, $stateParams, marker, utils, sensor, Kit, $mdDialog) {
      var vm = this;
      var mainSensorID, compareSensorID, sensorsData;
      var picker = initializePicker();

      vm.marker = augmentMarker(marker);

      vm.kit = new Kit(marker);

      var mainSensors = vm.kit.getSensors({type: 'main'});  
      vm.battery = mainSensors[1];
      vm.sensors = mainSensors[0];
      vm.sensorsToCompare = vm.kit.getSensors({type: 'compare'});

      vm.slide = slide;
      vm.chartData;

      vm.selectedSensor = vm.sensors[0].id; 
      vm.selectedSensorData = {
        icon: vm.sensors[0].icon,
        value: vm.sensors[0].value,
        unit: vm.sensors[0].unit,
        color: vm.sensors[0].color
      };

      vm.selectedSensorToCompare;
      vm.selectedSensorToCompareData;

      vm.moveChart = moveChart;
      vm.loadingChart = false;

      vm.dropdownOptions = [
        {text: 'SET UP', value: '1'},
        {text: 'EDIT', value: '2'}
      ];

      vm.dropdownSelected;

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

        vm.sensorsToCompare = getSensorsToCompare();

        setTimeout(function() {
          colorSensorMainIcon();
          colorSensorCompareName();    
          
          setSensor({type: 'main', value: newVal});
          changeChart('sensor', [mainSensorID, compareSensorID]);        
        }, 100);

      });

      $scope.$watch('vm.selectedSensorToCompare', function(newVal, oldVal) {
        vm.sensorsToCompare.forEach(function(sensor) {
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

      $scope.$on('hideSpinner', function() {
        vm.loadingChart = false;
      });

      setTimeout(function() {
        colorSensorMainIcon();
        colorArrows();
        colorClock();
        getOwnerKits();
      }, 1000);


      ///////////////

      function getOwnerKits(cb) {
        var kitIDs = vm.kit.owner.kits;

        utils.getOwnerKits(kitIDs)
          .then(function(kits) {
            vm.ownerKits = kits;
          });
      }
      
      function augmentMarker(marker) {
        marker.time = moment(utils.parseKitTime(marker)).fromNow();
        return marker;
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
        return vm.sensorsToCompare.filter(function(sensor) {
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
          options.from = picker.getValuePickerFrom();
          options.to = picker.getValuePickerTo();
        }
        if(updateType === 'date') {
          //show spinner
          vm.loadingChart = true;
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
        if(sensorsID[1] && sensorsID[1] !== -1) {
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
          var time = dataPoint && dataPoint.timestamp;
          var data = dataPoint && dataPoint.data[sensorID];
          data = data === null ? 0 : data;  
          
          return {
            time: time,
            data: data
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
          var valueTo = picker.getValuePickerFrom();
          var valueFrom = getSecondsFromDate( picker.getValuePickerFrom() ) - currentRange;
          picker.setValuePickers([valueFrom, valueTo]);          
        } else if(direction === 'right') {
          //set both from and to pickers  to next range
          var valueTo = getSecondsFromDate( picker.getValuePickerTo() ) + currentRange;
          var valueFrom = picker.getValuePickerTo();
          picker.setValuePickers([valueFrom, valueTo]);
        }
      }

      //hide everything but the functions to interact with the pickers
      function initializePicker() {
        var updateType; 

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
            if(to_picker.get('value') && updateType === 'single') {
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

        //set from-picker to seven days ago
        from_picker.set('select', getSevenDaysAgo());
        //set to-picker to today
        to_picker.set('select', getToday());

        return {
          getValuePickerFrom: function() {
            return from_picker.get('value');
          },
          setValuePickerFrom: function(newValue) {
            updateType = 'single';
            from_picker.set('select', newValue);
          },
          getValuePickerTo: function() {
            return to_picker.get('value');
          },
          setValuePickerTo: function(newValue) {
            updateType = 'single';
            to_picker.set('select', newValue);
          },
          setValuePickers: function(newValues) {
            var from = newValues[0];
            var to = newValues[1];

            updateType = 'pair'; 
            from_picker.set('select', from);
            to_picker.set('select', to);
          }
        };
      }
    }
})();
