(function() {
  'use strict';

  angular.module('app.components')
    .controller('KitController', KitController);

  KitController.$inject = ['$state','$scope', '$stateParams', '$filter',
    'utils', 'sensor', 'FullKit', '$mdDialog', 'belongsToUser',
    'timeUtils', 'animation', 'auth', 'kitUtils', 'userUtils',
    '$timeout', 'alert', '$q', 'device',
    'HasSensorKit', 'geolocation', 'PreviewKit', 'sensorTypes'];
  function KitController($state, $scope, $stateParams, $filter,
    utils, sensor, FullKit, $mdDialog, belongsToUser,
    timeUtils, animation, auth, kitUtils, userUtils,
    $timeout, alert, $q, device,
    HasSensorKit, geolocation, PreviewKit, sensorTypes) {

    var vm = this;
    var sensorsData = [];

    var mainSensorID, compareSensorID;
    var picker;
    vm.kitID = $stateParams.id;
    vm.battery = {};
    vm.downloadData = downloadData;
    vm.geolocate = geolocate;
    vm.kit = undefined;
    vm.kitBelongsToUser = belongsToUser;
    vm.kitWithoutData = false;
    vm.kitIsPrivate = false;
    vm.legacyApiKey = belongsToUser ?
      auth.getCurrentUser().data.key :
      undefined;
    vm.loadingChart = true;
    vm.moveChart = moveChart;
    vm.allowUpdateChart = true;
    vm.ownerKits = [];
    vm.removeKit = removeKit;
    vm.resetTimeOpts = resetTimeOpts;
    vm.sampleKits = [];
    vm.selectedSensor = undefined;
    vm.selectedSensorData = {};
    vm.selectedSensorToCompare = undefined;
    vm.selectedSensorToCompareData = {};
    vm.sensors = [];
    vm.chartSensors = [];
    vm.sensorsToCompare = [];
    vm.setFromLast = setFromLast;
    vm.showSensorOnChart = showSensorOnChart;
    vm.showStore = showStore;
    vm.slide = slide;
    vm.timeOpt = ['60 minutes', 'day' , 'month'];
    vm.timeOptSelected = timeOptSelected;
    vm.updateInterval = 15000;

    var focused = true;

    // event listener on change of value of main sensor selector
    $scope.$watch('vm.selectedSensor', function(newVal) {

      // Prevents undisered calls if selected sensor is not yet defined
      if (!newVal) {
        return;
      }

      vm.selectedSensorToCompare = undefined;
      vm.selectedSensorToCompareData = {};
      vm.chartDataCompare = [];
      compareSensorID = undefined;

      setSensorSideChart();

      vm.sensorsToCompare = getSensorsToCompare();

      $timeout(function() {
        colorSensorCompareName();

        setSensor({type: 'main', value: newVal});

        if (picker){
          changeChart([mainSensorID]);
        }
      }, 100);

    });

    // event listener on change of value of compare sensor selector
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

    $scope.$on('$destroy', function() {
      focused = false;
      $timeout.cancel(vm.updateTimeout);
    });

    $scope.$on('$viewContentLoaded', function(event){
      initialize();
    });

    function initialize() {
      animation.viewLoaded();
      updatePeriodically();
    }

    function pollAndUpdate(){
      vm.updateTimeout = $timeout(function() {
        updatePeriodically();
      }, vm.updateInterval);
    }

    function updatePeriodically(){
      getAndUpdateKit().then(function(){
        pollAndUpdate();
      });
    }

    function getAndUpdateKit(){
      if (vm.kitID || !isNaN(vm.kitID)){
        return device.getDevice(vm.kitID)
          .then(function(deviceData) {
            if (deviceData.is_private) {
              kitIsPrivate();
            }

            var newKit = new FullKit(deviceData);

            vm.prevKit = vm.kit;

            if (vm.prevKit) {
              /* Kit already loaded. We are waiting for updates */
              if (vm.prevKit.state.name !== 'has published' && newKit.state.name === 'has published'){
                /* The kit has just published data for the first time. Fully reload the view */
                return $q.reject({justPublished: true});
              } else if(new Date(vm.prevKit.time) >= new Date(newKit.time)) {
                /* Break if there's no new data*/
                return $q.reject();
              }
            }

            vm.kit = newKit;

            setOwnerSampleKits();
            updateKitViewExtras();

            if (vm.kit.state.name === 'has published') {
              /* Kit has data */
              setKitOnMap();
              setChartTimeRange();
              kitAnnouncements();
              /*Load sensor if it has already published*/
              return $q.all([getMainSensors(vm.kit, sensorTypes),
              getCompareSensors(vm.kit, sensorTypes)]);
            } else {
              /* Kit just loaded and has no data yet */
              return $q.reject({noSensorData: true});
            }

          })
          .then(setSensors, killSensorsLoading);
       }
    }

    function killSensorsLoading(error){
      if(error) {
        if(error.status === 404) {
          $state.go('layout.404');
        }
        else if (error.justPublished) {
          $state.transitionTo($state.current, {reloadMap: true, id: vm.kitID}, {
            reload: true, inherit: false, notify: true
          });
        }
        else if (error.noSensorData) {
          kitHasNoData();
        }
        else if (error.status === 403){
          kitIsPrivate();
        }
      }
    }

    function kitAnnouncements(){
      if(!timeUtils.isWithin(1, 'months', vm.kit.time)) {
        /* TODO: Update the message */
        alert.info.longTime();
      }
      /* The kit has just published data after not publishing for 15min */
      else if(vm.prevKit && timeUtils.isDiffMoreThan15min(vm.prevKit.time, vm.kit.time)) {
        alert.success('Your Kit just published again!');
      }
    }

    function kitHasNoData() {
      vm.kitWithoutData = true;
      animation.kitWithoutData({kit: vm.kit, belongsToUser:vm.kitBelongsToUser});
      if(vm.kitBelongsToUser) {
        alert.info.noData.owner($stateParams.id);
      } else {
        alert.info.noData.visitor();
      }
    }

    function kitIsPrivate() {
      vm.kitIsPrivate = true;
      alert.info.noData.private();
    }

    function setOwnerSampleKits() {
      getOwnerKits(vm.kit, -5)
        .then(function(ownerKits){
          vm.sampleKits = ownerKits;
        });
    }

    function setChartTimeRange() {
      if(vm.allowUpdateChart) {
        /* Init the chart range to default if doesn't exist of the user hasn't interacted */
        picker = initializePicker();
      }
    }

    function setKitOnMap() {
      animation.kitLoaded({lat: vm.kit.latitude, lng: vm.kit.longitude,
          id: vm.kit.id});
    }

    function setSensors(sensorsRes){

      var mainSensors = sensorsRes[0];
      var compareSensors = sensorsRes[1];

      vm.battery = _.find(mainSensors, {name: 'battery'});
      vm.sensors = mainSensors.reverse();

      setSensorSideChart();

      if (!vm.selectedSensor) {
        vm.chartSensors = vm.sensors;
        vm.sensorsToCompare = compareSensors;
        vm.selectedSensor = (vm.sensors && vm.sensors[0]) ? vm.sensors[0].id : undefined;
      }
    }

    function updateKitViewExtras(){
      if(!vm.kit.version || vm.kit.version.id === 2 || vm.kit.version.id === 3){
        vm.setupAvailable = true;
      }
    }

    function setSensorSideChart() {
      if(vm.sensors){
        vm.sensors.forEach(function(sensor) {
          if(sensor.id === vm.selectedSensor) {
            _.extend(vm.selectedSensorData, sensor);
          }
        });
      }
    }

    function removeKit() {
      var confirm = $mdDialog.confirm()
        .title('Delete this kit?')
        .ariaLabel('')
        .ok('DELETE')
        .cancel('Cancel')
        .theme('primary')
        .clickOutsideToClose(true);

      $mdDialog
        .show(confirm)
        .then(function(){
          device
            .removeDevice(vm.kit.id)
            .then(function(){
              alert.success('Your kit was deleted successfully');
              ga('send', 'event', 'Kit', 'delete');
              device.updateContext().then(function(){
                $state.transitionTo('layout.myProfile.kits', $stateParams,
                  { reload: false,
                    inherit: false,
                    notify: true
                  });
              });
            })
            .catch(function(){
              alert.error('Error trying to delete your kit.');
            });
        });
    }

    function showSensorOnChart(sensorID) {
      vm.selectedSensor = sensorID;
    }

    function slide(direction) {
      var slideContainer = angular.element('.sensors_container');
      var scrollPosition = slideContainer.scrollLeft();
      var width = slideContainer.width();
      var slideStep = width/2;

      if(direction === 'left') {
        slideContainer.animate({'scrollLeft': scrollPosition + slideStep},
          {duration: 250, queue:false});
      } else if(direction === 'right') {
        slideContainer.animate({'scrollLeft': scrollPosition - slideStep},
          {duration: 250, queue:false});
      }
    }

    function getSensorsToCompare() {
      return vm.sensors ? vm.sensors.filter(function(sensor) {
        return sensor.id !== vm.selectedSensor;
      }) : [];
    }

    function changeChart(sensorsID, options) {
      if(!sensorsID[0]) {
        return;
      }

      if(!options) {
        options = {};
      }
      options.from = options && options.from || picker.getValuePickerFrom();
      options.to = options && options.to || picker.getValuePickerTo();

      //show spinner
      vm.loadingChart = true;
      //grab chart data and save it

      // it can be either 2 sensors or 1 sensor, so we use $q.all to wait for all
      $q.all(
        _.map(sensorsID, function(sensorID) {
          return getChartData($stateParams.id, sensorID, options.from, options.to)
            .then(function(data) {
              return data;
            });
        })
      ).then(function() {
        // after all sensors resolve, prepare data and attach it to scope
        // the variable on the scope will pass the data to the chart directive
        vm.chartDataMain = prepareChartData([mainSensorID, compareSensorID]);
      });
    }
    // calls api to get sensor data and saves it to sensorsData array
    function getChartData(deviceID, sensorID, dateFrom, dateTo, options) {
      return sensor.getSensorsData(deviceID, sensorID, dateFrom, dateTo)
        .then(function(data) {
          //save sensor data of this kit so that it can be reused
          sensorsData[sensorID] = data.readings;
          return data;
        });
    }

    function prepareChartData(sensorsID) {
      var compareSensor;
      var parsedDataMain = parseSensorData(sensorsData, sensorsID[0]);
      var mainSensor = {
        data: parsedDataMain,
        color: vm.selectedSensorData.color,
        unit: vm.selectedSensorData.unit
      };
      if(sensorsID[1] && sensorsID[1] !== -1) {
        var parsedDataCompare = parseSensorData(sensorsData, sensorsID[1]);

        compareSensor = {
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
        var time = parseTime(dataPoint[0]);
        var value = dataPoint[1];
        var count = value === null ? 0 : value;
        return {
          time: time,
          count: count,
          value: value
        };
      });
    }

    function parseTime(t) {
      return moment(t).format('YYYY-MM-DDTHH:mm:ss');
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

    function colorSensorCompareName() {
      var name = angular.element('.sensor_compare').find('md-select-label').find('span');
      name.css('color', vm.selectedSensorToCompareData.color || 'white');
      var icon = angular.element('.sensor_compare').find('md-select-label').find('.md-select-icon');
      icon.css('color', 'white');
    }

    function getMillisFromDate(date) {
      return (new Date(date)).getTime();
    }

    function getCurrentRange() {
      var to = moment(picker.getValuePickerTo());
      var from = moment(picker.getValuePickerFrom());
      return to.diff(from)/1000;
    }

    function moveChart(direction) {

      var valueTo, valueFrom;
      //grab current date range
      var currentRange = getCurrentRange();

      /*jshint camelcase: false*/
      var from_picker = angular.element('#picker_from').pickadate('picker');
      var to_picker = angular.element('#picker_to').pickadate('picker');

      if(direction === 'left') {
        //set both from and to pickers to prev range
        valueTo = moment(picker.getValuePickerFrom());
        valueFrom = moment(picker.getValuePickerFrom()).subtract(currentRange, 'seconds');

        picker.setValuePickers([valueFrom.toDate(), valueTo.toDate()]);

      } else if(direction === 'right') {
        var today = timeUtils.getToday();
        var currentValueTo = picker.getValuePickerTo();
        if( timeUtils.isSameDay(today, getMillisFromDate(currentValueTo)) ) {
          return;
        }

        valueFrom = moment(picker.getValuePickerTo());
        valueTo = moment(picker.getValuePickerTo()).add(currentRange, 'seconds');

        picker.setValuePickers([valueFrom.toDate(), valueTo.toDate()]);

      }
      resetTimeOpts();
    }

    //hide everything but the functions to interact with the pickers
    function initializePicker() {
      var range = {};
      /*jshint camelcase: false*/
      var from_$input = angular.element('#picker_from').pickadate({
        onOpen: function(){
          ga('send', 'event', 'Kit Chart', 'click', 'Date Picker');
          vm.resetTimeOpts();
        },
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
        onOpen: function(){
          ga('send', 'event', 'Kit Chart', 'click', 'Date Picker');
          vm.resetTimeOpts();
        },
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

      from_picker.on('close', function(event) {
          setFromRange(getCalculatedFrom(from_picker.get('value')));
      });

      to_picker.on('close', function(event) {
          setToRange(getCalculatedTo(to_picker.get('value')));
      });

      from_picker.on('set', function(event) {
        if(event.select) {
          to_picker.set('min', getFromRange());
        } else if( 'clear' in event) {
          to_picker.set('min', false);
        }
      });

      to_picker.on('set', function(event) {
        if(event.select) {
          from_picker.set('max', getToRange());
        } else if( 'clear' in event) {
          from_picker.set('max', false);
        }
      });

      //set to-picker max to today
      to_picker.set('max', getLatestUpdated());

      function getToday() {
        return getMillisFromDate(new Date());
      }

      function getHourAgo(date) {
        var now = moment(date);
        return now.subtract(1, 'hour').valueOf();
      }

      function getSevenDaysAgo() {
        var now = moment();
        return now.subtract(7, 'days').valueOf();
      }

      function getSevenDaysAgoFromLatestUpdate() {
        var lastTime = moment(vm.kit.time);
        return lastTime.subtract(7, 'days').valueOf();
      }

      function getLatestUpdated() {
        return moment(vm.kit.time).toDate();
      }

      function getCalculatedFrom(pickerTimeFrom) {
          var from,
              pickerTime;

          pickerTime = moment(pickerTimeFrom, 'D MMMM, YYYY');
          from = pickerTime.startOf('day');

          return from;
      }

      function getCalculatedTo(pickerTimeTo) {
          var to,
              pickerTime;

          pickerTime = moment(pickerTimeTo, 'D MMMM, YYYY');

          to = pickerTime.endOf('day');
          if (moment().diff(to) < 0) {
            var now = moment();
            to = pickerTime.set({
              'hour' : now.get('hour'),
              'minute'  :  now.get('minute'),
              'second' :  now.get('second')
            });
          }

          return to;
      }

      function updateChart() {
        var sensors = [mainSensorID, compareSensorID];
        sensors = sensors.filter(function(sensor) {
          return sensor;
        });
        changeChart(sensors, {
          from: range.from,
          to: range.to
        });
      }

      function setFromRange(from) {
        range.from = from;
        from_picker.set('select', getFromRange());
        updateChart();
      }

      function setToRange(to) {
        range.to = to;
        to_picker.set('select', getToRange());
        updateChart();
      }

      function getFromRange() {
        return moment(range.from).toDate();
      }

      function getToRange() {
        return moment(range.to).toDate();
      }

      function setRange(from, to) {
        range.from = from;
        range.to = to;
        from_picker.set('select', getFromRange());
        to_picker.set('select', getToRange());
        updateChart();
      }


      if(vm.kit){
        if(vm.kit.labels.includes('new')){
          var lastUpdate = getLatestUpdated();
          setRange(getHourAgo(lastUpdate), lastUpdate);
        } else if (timeUtils.isWithin(7, 'days', vm.kit.time) || !vm.kit.time) {
          //set from-picker to seven days ago and set to-picker to today
          setRange(getSevenDaysAgo(), getToday());
        } else {
          // set from-picker to and set to-picker to today
          setRange(getSevenDaysAgoFromLatestUpdate(), getLatestUpdated());
        }
      }


      // api to interact with the picker from outside
      return {
        getValuePickerFrom: function() {
          return getFromRange();
        },
        setValuePickerFrom: function(newValue) {
          setFromRange(newValue);
        },
        getValuePickerTo: function() {
          return getToRange();
        },
        setValuePickerTo: function(newValue) {
          setToRange(newValue);
        },
        setValuePickers: function(newValues) {
          var from = newValues[0];
          var to = newValues[1];
          setRange(from, to);
        }
      };
    }

    function geolocate() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
          if(!position){
            alert.error('Please, allow smartcitizen to geolocate your' +
              'position so we can find a kit near you.');
            return;
          }

          geolocation.grantHTML5Geolocation();

          var location = {
            lat:position.coords.latitude,
            lng:position.coords.longitude
          };
          device.getDevices(location)
            .then(function(data){
              data = data.plain();

              _(data)
                .chain()
                .map(function(device) {
                  return new HasSensorKit(device);
                })
                .filter(function(kit) {
                  return !!kit.longitude && !!kit.latitude;
                })
                .find(function(kit) {
                  return _.includes(kit.labels, 'online');
                })
                .tap(function(closestKit) {
                  if(focused){
                    if(closestKit) {
                      $state.go('layout.home.kit', {id: closestKit.id});
                    } else {
                      $state.go('layout.home.kit', {id: data[0].id});
                    }
                  }
                })
                .value();
            });
        });
      }
    }

    function downloadData(kit){
      $mdDialog.show({
        hasBackdrop: true,
        controller: 'DownloadModalController',
        controllerAs: 'vm',
        templateUrl: 'app/components/download/downloadModal.html',
        clickOutsideToClose: true,
        locals: {thisKit:kit}
      }).then(function(){
        var alert = $mdDialog.alert()
        .title('SUCCESS')
        //.content('We are processing your data. Soon you will be notified in your inbox')
        .ariaLabel('')
        .ok('OK!')
        .theme('primary')
        .clickOutsideToClose(true);

        $mdDialog.show(alert);
      }).catch(function(err){
        if (!err){
          return;
        }
        var errorAlert = $mdDialog.alert()
        .title('ERROR')
        //.content('Uh-oh, something went wrong')
        .ariaLabel('')
        .ok('D\'oh')
        .theme('primary')
        .clickOutsideToClose(false);

        $mdDialog.show(errorAlert);
      });
    }

    function getMainSensors(kitData, sensorTypes) {
      if(!kitData) {
        return undefined;
      }
      return kitData.getSensors(sensorTypes, {type: 'main'});
    }
    function getCompareSensors(kitData,sensorTypes) {
      if(!vm.kit) {
        return undefined;
      }
      return kitData.getSensors(sensorTypes, {type: 'compare'});
    }
    function getOwnerKits(kitData, sampling) {
      if(!kitData) {
        return undefined;
      }
      var kitIDs = kitData.owner.kits.slice(sampling);

      return $q.all(
        kitIDs.map(function(id) {
          return device.getDevice(id)
            .then(function(data) {
              return new PreviewKit(data);
            });
        })
      );
    }

    function setFromLast(what){
      /* This will not show the last 60 minutes or 24 hours,
      instead it will show the last hour or day*/
      var to, from;
      if (what === '60 minutes') {
        to = moment(vm.kit.time);
        from = moment(vm.kit.time).subtract(60, 'minutes');
      } else {
        to = moment(vm.kit.time).endOf(what);
        from = moment(vm.kit.time).startOf(what);
      }
      // Check if we are in the future
      if (moment().diff(to) < 0){
        to = moment(vm.kit.time);
      }
      picker.setValuePickers([from.toDate(), to.toDate()]);
    }
    function timeOptSelected(){
      vm.allowUpdateChart = false;
      if (vm.dropDownSelection){
        setFromLast(vm.dropDownSelection);
      }
    }
    function resetTimeOpts(){
      vm.allowUpdateChart = false;
      vm.dropDownSelection = undefined;
    }

    function showStore() {
      $mdDialog.show({
        hasBackdrop: true,
        controller: 'StoreModalController',
        templateUrl: 'app/components/store/storeModal.html',
        clickOutsideToClose: true
      });
    }

  }
})();
