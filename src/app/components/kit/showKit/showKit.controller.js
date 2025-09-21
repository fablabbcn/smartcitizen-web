(function() {
  'use strict';

  angular.module('app.components')
    .controller('KitController', KitController);

  KitController.$inject = ['$state','$scope', '$stateParams',
    'sensor', 'FullDevice', '$mdDialog',
    'timeUtils', 'animation', 'auth',
    '$timeout', 'alert', '$q', 'device', 'deviceUtils',
    'HasSensorDevice', 'geolocation', 'PreviewDevice', 'userUtils', 'urlUtils', 'URLS'];
  function KitController($state, $scope, $stateParams,
    sensor, FullDevice, $mdDialog,
    timeUtils, animation, auth,
    $timeout, alert, $q, device, deviceUtils,
    HasSensorDevice, geolocation, PreviewDevice, userUtils, urlUtils, URLS) {

    var vm = this;
    var sensorsData = [];

    var mainSensorID, compareSensorID;
    var picker;
    vm.deviceID = $stateParams.id;
    vm.battery = {};
    vm.downloadData = downloadData;
    vm.geolocate = geolocate;
    vm.device = undefined;
    // vm.deviceBelongsToUser = belongsToUser;
    vm.deviceWithoutData = false;
    // vm.legacyApiKey = belongsToUser ?
    //   auth.getCurrentUser().data.key :
    //   undefined;
    vm.loadingChart = true;
    vm.moveChart = moveChart;
    vm.allowUpdateChart = true;
    vm.ownerDevices = [];
    // vm.removeDevice = removeDevice;
    vm.resetTimeOpts = resetTimeOpts;
    vm.sampleDevices = [];
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
    vm.showRaw = false;
    vm.timeOpt = ['60 minutes', 'day' , 'month'];
    vm.timeOptSelected = timeOptSelected;
    vm.updateInterval = 15000;
    vm.hasRaw;
    vm.sensorNames = {};

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
        // TODO: Improvement, change how we set the colors
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

    function belongsToUser() {
      // console.log('belongsToUser')
      if(!auth.isAuth() || !$stateParams.id) {
        // console.log('Not auth')
        // console.log(!auth.isAuth());
        // console.log(!$stateParams.id)
        return false;
      }
      var deviceID = parseInt($stateParams.id);
      // console.log(deviceID)

      var userData = ( auth.getCurrentUser().data ) || ($window.localStorage.getItem('smartcitizen.data') && new AuthUser( JSON.parse( $window.localStorage.getItem('smartcitizen.data') )));
      var belongsToUser = deviceUtils.belongsToUser(userData.devices, deviceID);
      var isAdmin = userUtils.isAdmin(userData);
      return isAdmin || belongsToUser;
    }

    redirectNotOwner.$inject = ['belongsToUser', '$location'];
    function redirectNotOwner(belongsToUser, $location) {
      if(!belongsToUser) {
        // console.error('This kit does not belong to user');
        $location.path('/kits/');
      }
    }

    $scope.$on('loggedIn', function(event){
      vm.deviceBelongsToUser = belongsToUser();
    });

    function initialize() {
      vm.deviceBelongsToUser = belongsToUser();
      animation.viewLoaded();
      // vm.deviceBelongsToUser = belongsToUser();
      updatePeriodically();
    }

    function pollAndUpdate(){
      vm.updateTimeout = $timeout(function() {
        updatePeriodically();
      }, vm.updateInterval);
    }

    function updatePeriodically(){
      getAndUpdateDevice().then(function(){
        pollAndUpdate();
      });
    }

    function getAndUpdateDevice(){
      // TODO: Improvement UX Change below to && to avoid constant unhandled error
      // Through reject is not possible
      if (vm.deviceID || !isNaN(vm.deviceID)){
        return device.getDevice(vm.deviceID)
          .then(function(deviceData) {
            if (deviceData.is_private) {
              deviceIsPrivate();
            }
            var newDevice = new FullDevice(deviceData);
            vm.prevDevice = vm.device;

            if (vm.prevDevice) {
              /* Kit already loaded. We are waiting for updates */
              if (vm.prevDevice.state.name !== 'has published' && newDevice.state.name === 'has published'){
                /* The kit has just published data for the first time. Fully reload the view */
                return $q.reject({justPublished: true});
              } else if(new Date(vm.prevDevice.lastReadingAt.raw) >= new Date(newDevice.lastReadingAt.raw)) {
                /* Break if there's no new data*/
                return $q.reject();
              }
            }

            vm.device = newDevice;
            setOwnerSampleDevices();

            // NEW MONOLITH INTEGRATION
            var ui_base_url = URLS['base']
            var user_path = URLS['users:username']
            var device_path = URLS['devices:id']
            var device_edit_path = URLS['devices:id:edit']
            var device_download_path = URLS['devices:id:download']
            var device_upload_path = URLS['devices:id:upload']
            var device_goto_path = URLS['goto']
            var kits_path = URLS['map:id']

            vm.user_url = ui_base_url + urlUtils.get_path(user_path, ":username", vm.device.owner.username);
            vm.device_url = ui_base_url + urlUtils.get_path(device_path, ":id", vm.device.id);
            // TODO - Pass goto parameter on the following
            var kit_path = urlUtils.get_path(kits_path, ":id", vm.device.id);
            vm.device_edit_url = ui_base_url + urlUtils.get_path(device_edit_path, ":id", vm.device.id) + urlUtils.get_path(device_goto_path, ":url", kit_path);
            vm.device_download_url = ui_base_url + urlUtils.get_path(device_download_path, ":id", vm.device.id) + urlUtils.get_path(device_goto_path, ":url", kit_path);
            vm.device_upload_url = ui_base_url + urlUtils.get_path(device_upload_path, ":id", vm.device.id) + urlUtils.get_path(device_goto_path, ":url", kit_path);

            if (vm.device.state.name === 'has published') {
              /* Device has data */
              setDeviceOnMap();
              setChartTimeRange();
              deviceAnnouncements();

              /*Load sensor if it has already published*/
              return $q.all([getMainSensors(vm.device), getCompareSensors(vm.device)]);
            } else {
              /* Device just loaded and has no data yet */
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
          $state.transitionTo($state.current, {reloadMap: true, id: vm.deviceID}, {
            reload: true, inherit: false, notify: true
          });
        }
        else if (error.noSensorData) {
          // console.log('deviceHasNoData')
          deviceHasNoData();
        }
        else if (error.status === 403){
          deviceIsPrivate();
        }
      }
    }

    function deviceAnnouncements(){
      if(!timeUtils.isWithin(1, 'months', vm.device.lastReadingAt.raw)) {
        //TODO: Cosmetic Update the message
        alert.info.longTime();
      }
      /* The device has just published data after not publishing for 15min */
      else if(vm.prevDevice && timeUtils.isDiffMoreThan15min(vm.prevDevice.lastReadingAt.raw, vm.device.lastReadingAt.raw)) {
        alert.success('Your Kit just published again!');
      }
    }

    function deviceHasNoData() {
      vm.deviceWithoutData = true;
      animation.deviceWithoutData({device: vm.device, belongsToUser:vm.deviceBelongsToUser});
      if(vm.deviceBelongsToUser) {
        alert.info.noData.owner($stateParams.id);
      } else {
        alert.info.noData.visitor();
      }
    }

    function deviceIsPrivate() {
      alert.info.noData.private();
    }

    function setOwnerSampleDevices() {
      // TODO: Refactor - this information is in the user, no need to go to devices
      getOwnerDevices(vm.device, -6)
        .then(function(ownerDevices){
          vm.sampleDevices = ownerDevices;
        });
    }

    function setChartTimeRange() {
      if(vm.allowUpdateChart) {
        /* Init the chart range to default if doesn't exist of the user hasn't interacted */
        picker = initializePicker();
      }
    }

    function setDeviceOnMap() {
      animation.deviceLoaded({lat: vm.device.latitude, lng: vm.device.longitude,
          id: vm.device.id});
    }

    function setSensors(sensorsRes){

      var mainSensors = sensorsRes[0];
      var compareSensors = sensorsRes[1];

      vm.battery = _.find(mainSensors, {name: 'Battery SCK'});
      vm.sensors = mainSensors.reverse();
      vm.sensors.forEach(checkRaw);
      vm.sensors.forEach(getHardwareName);

      setSensorSideChart();

      if (!vm.selectedSensor) {
        vm.chartSensors = vm.sensors;
        vm.sensorsToCompare = compareSensors;
        vm.selectedSensor = (vm.sensors && vm.sensors[0]) ? vm.sensors[0].id : undefined;
      }

      animation.mapStateLoaded();
    }

    function checkRaw(value){
      vm.hasRaw |= (value.tags.indexOf('raw') !== -1);
    }

    function getHardwareName(value) {
      vm.sensorNames[value.id] = vm.device.sensors.find(element => element.id === value.id).name;
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

    // function removeDevice() {
    //   var confirm = $mdDialog.confirm()
    //     .title('Delete this kit?')
    //     .textContent('Are you sure you want to delete this kit?')
    //     .ariaLabel('')
    //     .ok('DELETE')
    //     .cancel('Cancel')
    //     .theme('primary')
    //     .clickOutsideToClose(true);

    //   $mdDialog
    //     .show(confirm)
    //     .then(function(){
    //       device
    //         .removeDevice(vm.device.id)
    //         .then(function(){
    //           alert.success('Your kit was deleted successfully');
    //           device.updateContext().then(function(){
    //             $state.transitionTo('layout.myProfile.kits', $stateParams,
    //               { reload: false,
    //                 inherit: false,
    //                 notify: true
    //               });
    //           });
    //         })
    //         .catch(function(){
    //           alert.error('Error trying to delete your kit.');
    //         });
    //     });
    // }

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
        var time = timeUtils.formatDate(dataPoint[0]);
        var value = dataPoint[1];
        var count = value === null ? 0 : value;
        return {
          time: time,
          count: count,
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

    function colorSensorCompareName() {
      var name = angular.element('.sensor_compare').find('md-select-label').find('span');
      name.css('color', vm.selectedSensorToCompareData.color || 'white');
      var icon = angular.element('.sensor_compare').find('md-select-label').find('.md-select-icon');
      icon.css('color', 'white');
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
        if( timeUtils.isSameDay(today, timeUtils.getMillisFromDate(currentValueTo)) ) {
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

      function getSevenDaysAgoFromLatestUpdate() {
        var lastTime = moment(vm.device.lastReadingAt.raw);
        return lastTime.subtract(7, 'days').valueOf();
      }

      function getLatestUpdated() {
        return moment(vm.device.lastReadingAt.raw).toDate();
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

      if(vm.device){
        if(vm.device.systemTags.includes('new')){
          var lastUpdate = getLatestUpdated();
          setRange(timeUtils.getHourBefore(lastUpdate), lastUpdate);
        } else if (timeUtils.isWithin(7, 'days', vm.device.lastReadingAt.raw) || !vm.device.lastReadingAt.raw) {
          //set from-picker to seven days ago and set to-picker to today
          setRange(timeUtils.getSevenDaysAgo(), timeUtils.getToday());
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
                  return new HasSensorDevice(device);
                })
                .filter(function(device) {
                  return !!device.longitude && !!device.latitude;
                })
                .find(function(device) {
                  return _.includes(device.labels, 'online');
                })
                .tap(function(closestDevice) {
                  if(focused){
                    if(closestDevice) {
                      $state.go('layout.home.kit', {id: closestDevice.id});
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

    function downloadData(device){
      $mdDialog.show({
        hasBackdrop: true,
        controller: 'DownloadModalController',
        controllerAs: 'vm',
        templateUrl: 'app/components/download/downloadModal.html',
        clickOutsideToClose: true,
        locals: {thisDevice: device}
      }).then(function(){
        var alert = $mdDialog.alert()
        .title('SUCCESS')
        .textContent('We are processing your data. Soon you will be notified in your inbox')
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
        .textContent('Uh-oh, something went wrong')
        .ariaLabel('')
        .ok('D\'oh')
        .theme('primary')
        .clickOutsideToClose(false);

        $mdDialog.show(errorAlert);
      });
    }

    function getMainSensors(deviceData) {
      if(!deviceData) {
        return undefined;
      }
      return deviceData.getSensors({type: 'main'});
    }
    function getCompareSensors(deviceData) {
      if(!vm.device) {
        return undefined;
      }
      deviceData.getSensors({type: 'compare'});
    }
    function getOwnerDevices(deviceData, sampling) {
      if(!deviceData) {
        return undefined;
      }
      var deviceIDs = deviceData.owner.devices.slice(sampling);
      // var ownerID = deviceData.owner.id;
      // TODO: Refactor This is in the user endpoint, no need to query devices
      return $q.all(
        deviceIDs.map(function(id) {
          return device.getDevice(id)
            .then(function(data) {
              return new PreviewDevice(data);
            });
        })
      );
    }

    function setFromLast(what){
      /* This will not show the last 60 minutes or 24 hours,
      instead it will show the last hour or day*/
      var to, from;
      if (what === '60 minutes') {
        to = moment(vm.device.lastReadingAt.raw);
        from = moment(vm.device.lastReadingAt.raw).subtract(60, 'minutes');
      } else {
        to = moment(vm.device.lastReadingAt.raw).endOf(what);
        from = moment(vm.device.lastReadingAt.raw).startOf(what);
      }
      // Check if we are in the future
      if (moment().diff(to) < 0){
        to = moment(vm.device.lastReadingAt.raw);
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
