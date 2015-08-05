(function() {
  'use strict';

  angular.module('app.components')
    .controller('KitController', KitController);
    
    KitController.$inject = ['$state','$scope', '$stateParams', 'kitData', 'ownerKits', 'utils', 'sensor', 'FullKit', '$mdDialog', 'belongsToUser', 'timeUtils', 'animation', '$location', 'auth', 'kitUtils', 'userUtils', '$timeout', 'mainSensors', 'compareSensors', 'alert', '$q'];
    function KitController($state, $scope, $stateParams, kitData, ownerKits, utils, sensor, FullKit, $mdDialog, belongsToUser, timeUtils, animation, $location, auth, kitUtils, userUtils, $timeout, mainSensors, compareSensors, alert, $q) {
      var vm = this;
      var sensorsData = [];

      var getChartDataHasBeenCalled = false;
      var mainSensorID, compareSensorID;
      var picker = initializePicker();

      animation.kitLoaded({lat: kitData.latitude ,lng: kitData.longitude, id: parseInt($stateParams.id) });
      vm.kit = kitData;
      vm.ownerKits = ownerKits;
      vm.kitBelongsToUser = belongsToUser;

      vm.battery = mainSensors[1];
      vm.sensors = mainSensors[0];
      vm.sensorsToCompare = compareSensors;

      vm.slide = slide;
      vm.chartData = [];

      vm.selectedSensor = vm.sensors[0].id; 
      vm.selectedSensorData = {};

      vm.selectedSensorToCompare = undefined;
      vm.selectedSensorToCompareData = {};

      vm.moveChart = moveChart;
      vm.loadingChart = true;

      vm.dropdownOptions = [
        {text: 'SET UP', value: '1'},
        {text: 'EDIT', value: '2'}
      ];

      vm.dropdownSelected = undefined;

      $scope.$watch('vm.selectedSensor', function(newVal, oldVal) {
        vm.selectedSensorToCompare = undefined;
        vm.selectedSensorToCompareData = {};
        vm.chartDataCompare = [];
        compareSensorID = undefined;

        vm.sensors.forEach(function(sensor) {
          if(sensor.id === newVal) {
            _.extend(vm.selectedSensorData, sensor);
          }
        });

        vm.sensorsToCompare = getSensorsToCompare();

        $timeout(function() {
          colorSensorMainIcon();
          colorSensorCompareName();    
          
          setSensor({type: 'main', value: newVal});
          changeChart([mainSensorID]);        
        }, 100);

      });

      $scope.$watch('vm.selectedSensorToCompare', function(newVal, oldVal) {
        vm.sensorsToCompare.forEach(function(sensor) {
          if(sensor.id === newVal) {
            _.extend(vm.selectedSensorToCompareData, sensor);
          }
        });

        $timeout(function() {
          colorSensorCompareName();    
          setSensor({type: 'compare', value: newVal});   

          if(oldVal === undefined && newVal === undefined) {
            return;
          }
          changeChart([compareSensorID]);
        }, 100);
        
      });

      $scope.$on('hideChartSpinner', function() {
        vm.loadingChart = false;
      });

      $scope.$on('loggedIn', function() {
        var kitID = parseInt($stateParams.id);
        var userData = auth.getCurrentUser().data;        
        var belongsToUser = kitUtils.belongsToUser(userData.kits, kitID);
        var isAdmin = userUtils.isAdmin(userData);

        if(isAdmin || belongsToUser) {
          vm.kitBelongsToUser = true;            
        }
      });

      $scope.$on('loggedOut', function() {
        vm.kitBelongsToUser = false;
      });


      initialize();

      ///////////////

      function initialize() {        
        $timeout(function() {
          colorSensorMainIcon();
          colorArrows();
          colorClock();
          animation.viewLoaded();
        }, 1000);
        
        if(sensorHasNoData()) {
          alert.info('It looks like this sensor has not posted data since a long time ago 😔', 10000);
        }
      }

      function sensorHasNoData() {
        return _.every(vm.sensors, function(sensor) {
          return sensor.value === 'N/A';
        });
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

      function changeChart(sensorsID, options) {
        if(!sensorsID[0]) {
          return;
        }
        
        if(getChartDataHasBeenCalled && !sensorsData) {
          //waiting for the data from the server, render chart on next call
          return;
        //if data is not loaded, get it first -> happens on controller initialization
        } 
        // else if(!getChartDataHasBeenCalled) {
          // updateType = 'date';
        // } 

        if(!options) {
          options = {};
        }
        options.from = options && options.from || picker.getValuePickerFrom();
        options.to = options && options.to || picker.getValuePickerTo();

        //show spinner
        vm.loadingChart = true;
        //grab chart data and save it

        $q.all(
          _.map(sensorsID, function(sensorID) {
            return getChartData($stateParams.id, sensorID, options.from, options.to)
              .then(function(data) {
                return data;
              });
          })
        ).then(function() {
          vm.chartDataMain = prepareChartData([mainSensorID, compareSensorID]);
          console.log('vm', vm.chartDataMain);
        });
      }
      
      function getChartData(deviceID, sensorID, dateFrom, dateTo, options) {
        getChartDataHasBeenCalled = true;
        // var deviceID = $stateParams.id;

        return sensor.getSensorsDataNew(deviceID, sensorID, dateFrom, dateTo)
          .then(function(data) {
            //save sensor data of this kit so that it can be reused
            sensorsData[sensorID] = data.readings;
            return data;
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
        return data[sensorID].map(function(dataPoint) {
          var time = dataPoint[0];
          var value = dataPoint[1];
          var data = value === null ? 0 : value;  
          
          return {
            time: time,
            data: data,
            value: value
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
        var svgContainer; 

        svgContainer = angular.element('.chart_move_left').find('svg');
        svgContainer.find('.fill_container').css('fill', '#03252D');

        svgContainer = angular.element('.chart_move_right').find('svg');
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
        var valueTo, valueFrom;
        //grab current date range
        var currentRange = getCurrentRange();

        if(direction === 'left') {
          //set both from and to pickers to prev range
          valueTo = picker.getValuePickerFrom();
          valueFrom = getSecondsFromDate( picker.getValuePickerFrom() ) - currentRange;
          picker.setValuePickers([valueFrom, valueTo]);          
        } else if(direction === 'right') {
          var today = timeUtils.getToday();
          var currentValueTo = picker.getValuePickerTo();
          if( timeUtils.isSameDay(today, currentValueTo) ) {
            // vm.toPickerDisabled = true;
            return;
          }

          //set both from and to pickers  to next range
          valueFrom = picker.getValuePickerTo();
          valueTo = getSecondsFromDate( picker.getValuePickerTo() ) + currentRange;
          picker.setValuePickers([valueFrom, valueTo]);
        }
      }

      //hide everything but the functions to interact with the pickers
      function initializePicker() {
        var updateType = 'single'; //set update type to single by default 

        /*jshint camelcase: false*/
        var from_$input = angular.element('#picker_from').pickadate({
          onClose: function(){
            angular.element(document.activeElement).blur();
          },
          container: 'body',
          klass: {
            holder: 'picker__holder picker_container'
          }
        });
        var from_picker = from_$input.pickadate('picker');

        var to_$input = angular.element('#picker_to').pickadate({
          onClose: function(){
            angular.element(document.activeElement).blur();
          },
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
              var sensors = [mainSensorID, compareSensorID];
              sensors = sensors.filter(function(sensor) {
                return sensor;
              }); 
              changeChart(sensors, {from: from_picker.get('value'), to: to_picker.get('value') });                                          
            }
            to_picker.set('min', from_picker.get('select') );
          } else if( 'clear' in event) {
            to_picker.set('min', false);
          }
        });

        to_picker.on('set', function(event) {
          if(event.select) {  
            if(from_picker.get('value')) {
              var sensors = [mainSensorID, compareSensorID];
              sensors = sensors.filter(function(sensor) {
                return sensor;
              }); 
              changeChart(sensors, {from: from_picker.get('value'), to: to_picker.get('value') });                             
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
