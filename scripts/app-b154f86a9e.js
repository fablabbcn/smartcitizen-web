(function() {
	'use strict';


	angular.module('app.components', []);
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('User', ['COUNTRY_CODES', function(COUNTRY_CODES) {

      /**
       * User constructor
       * @param {Object} userData - User data sent from API
       * @property {number} id - User ID
       * @property {string} username - Username
       * @property {string} profile_picture - Avatar URL of user
       * @property {Array} devices - Kits that belongs to this user
       * @property {string} url - URL
       * @property {string} city - User city
       * @property {string} country - User country
       */

      function User(userData) {
        this.id = userData.id;
        this.username = userData.username;
        this.profile_picture = userData.profile_picture;
        this.devices = userData.devices;
        this.url = userData.url;
        this.city = userData.location.city;
        /*jshint camelcase: false */
        this.country = COUNTRY_CODES[userData.location.country_code];
      }
      return User;
    }]);

})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('NonAuthUser', ['User', function(User) {

      function NonAuthUser(userData) {
        User.call(this, userData);
      }
      NonAuthUser.prototype = Object.create(User.prototype);
      NonAuthUser.prototype.constructor = User;

      return NonAuthUser;
    }]);
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('AuthUser', ['User', function(User) {

      /**
       * AuthUser constructor. Used for authenticated users
       * @extends User
       * @param {Object} userData - Contains user data sent from API
       * @property {string} email - User email
       * @property {string} role - User role. Ex: admin
       * @property {string} key - Personal API Key
       */

      function AuthUser(userData) {
        User.call(this, userData);

        this.email = userData.email;
        this.role = userData.role;
        /*jshint camelcase: false */
        this.key = userData.legacy_api_key;
      }
      AuthUser.prototype = Object.create(User.prototype);
      AuthUser.prototype.constructor = User;

      return AuthUser;
    }]);
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('Sensor', ['sensorUtils', 'timeUtils', function(sensorUtils, timeUtils) {

      /**
       * Sensor constructor
       * @param {Object} sensorData - Contains the data of a sensor sent from the API
       * @property {string} name - Name of sensor
       * @property {number} id - ID of sensor
       * @property {string} unit - Unit of sensor. Ex: %
       * @property {string} value - Last value sent. Ex: 95
       * @property {string} prevValue - Previous value before last value
       * @property {string} lastReadingAt - last_reading_at for the sensor reading
       * @property {string} icon - Icon URL for sensor
       * @property {string} arrow - Icon URL for sensor trend(up, down or equal)
       * @property {string} color - Color that belongs to sensor
       * @property {object} measurement - Measurement
       * @property {string} fullDescription - Full Description for popup
       * @property {string} previewDescription - Short Description for dashboard. Max 140 chars
       * @property {string} tags - Contains sensor tags for filtering the view
       */
      function Sensor(sensorData) {

        this.id = sensorData.id;
        this.name = sensorData.name;
        this.unit = sensorData.unit;
        this.value = sensorUtils.getSensorValue(sensorData);
        this.prevValue = sensorUtils.getSensorPrevValue(sensorData);
        this.lastReadingAt = timeUtils.parseDate(sensorData.last_reading_at);
        this.icon = sensorUtils.getSensorIcon(this.name);
        this.arrow = sensorUtils.getSensorArrow(this.value, this.prevValue);
        this.color = sensorUtils.getSensorColor(this.name);
        this.measurement = sensorData.measurement;

        // Some sensors don't have measurements because they are ancestors
        if (sensorData.measurement) {
          var description = sensorData.measurement.description;
          this.fullDescription = description;
          this.previewDescription = description.length > 140 ? description.slice(
            0, 140).concat(' ... ') : description;
          this.is_ancestor = false;
        } else {
          this.is_ancestor = true;
        }

        // Get sensor tags
        this.tags = sensorData.tags;
      }

      return Sensor;
    }]);
})();
(function() {
  'use strict';

  angular.module('app.components')
    .factory('SearchResultLocation', ['SearchResult', function(SearchResult) {

      /**
       * Search Result Location constructor
       * @extends SearchResult
       * @param {Object} object - Object that contains the search result data from API 
       * @property {number} lat - Latitude
       * @property {number} lng - Longitude
       */
      function SearchResultLocation(object) {
        SearchResult.call(this, object);

        this.lat = object.latitude;
        this.lng = object.longitude;
        this.layer = object.layer;
      }
      return SearchResultLocation;
    }]);

})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('SearchResult', ['searchUtils', function(searchUtils) {

      /**
       * Search Result constructor
       * @param {Object} object - Object that belongs to a search result from API
       * @property {string} type - Type of search result. Ex: Country, City, User, Device
       * @property {number} id - ID of search result, only for user & device
       * @property {string} name - Name of search result, only for user & device
       * @property {string} location - Location of search result. Ex: 'Paris, France'
       * @property {string} icon - URL for the icon that belongs to this search result
       * @property {string} iconType - Type of icon. Can be either img or div
       */
      
      function SearchResult(object) {
        this.type = object.type;
        this.id = object.id;
        this.name = searchUtils.parseName(object);
        this.location = searchUtils.parseLocation(object);
        this.icon = searchUtils.parseIcon(object, this.type);
        this.iconType = searchUtils.parseIconType(this.type);
      }
      return SearchResult;
    }]);
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('Marker', ['deviceUtils', 'markerUtils', 'timeUtils', '$state', function(deviceUtils, markerUtils, timeUtils, $state) {
      /**
       * Marker constructor
       * @constructor
       * @param {Object} deviceData - Object with data about marker from API
       * @property {number} lat - Latitude
       * @property {number} lng - Longitude
       * @property {string} message - Message inside marker popup
       * @property {Object} icon - Object with classname, size and type of marker icon
       * @property {string} layer - Map layer that icons belongs to
       * @property {boolean} focus - Whether marker popup is opened
       * @property {Object} myData - Marker id and labels
       */
      function Marker(deviceData) {
        let linkStart = '', linkEnd = '';
        const id = deviceData.id;
        if ($state.$current.name === 'embbed') {
          linkStart = '<a target="_blank" href="https://smartcitizen.me/kits/' + id + '">';
          linkEnd = '</a>';
        }
        this.lat = deviceUtils.parseCoordinates(deviceData).lat;
        this.lng = deviceUtils.parseCoordinates(deviceData).lng;
        // TODO: Bug, pop-up lastreading at doesn't get updated by publication
        this.message = '<div class="popup"><div class="popup_top sck' +
          '">' + linkStart + '<p class="popup_name">' + deviceUtils.parseName(deviceData, true) +
          '</p><p class="popup_type">' +
          deviceUtils.parseHardwareName(deviceData) +
          '</p><p class="popup_time"><md-icon class="popup_icon" ' +
          'md-svg-src="./assets/images/update_icon.svg"></md-icon>' +
          timeUtils.parseDate(deviceData.last_reading_at).ago + '</p>' + linkEnd + '</div>' +
          '<div class="popup_bottom"><p class="popup_location">' +
          '<md-icon class="popup_icon" ' +
          'md-svg-src="./assets/images/location_icon_dark.svg"></md-icon>' +
          deviceUtils.parseLocation(deviceData) +
          '</p><div class="popup_labels">' +
          createTagsTemplate(deviceUtils.parseSystemTags(deviceData), 'label') +
          createTagsTemplate(deviceUtils.parseUserTags(deviceData),
            'tag', true) +
          '</div></div></div>';

        this.icon = markerUtils.getIcon(deviceData);
        this.layer = 'devices';
        this.focus = false;
        this.myData = {
          id: id,
          labels: deviceUtils.parseSystemTags(deviceData),
          tags: deviceUtils.parseUserTags(deviceData)
        };
      }
      return Marker;

      function createTagsTemplate(tagsArr, tagType, clickable) {
        if(typeof(clickable) === 'undefined'){
          clickable = false;
        }
        var clickablTag = '';
        if(clickable){
          clickablTag = 'clickable';
        }

        if(!tagType){
          tagType = 'tag';
        }

        return _.reduce(tagsArr, function(acc, label) {
          var element ='';
          if(tagType === 'tag'){
            element = '<tag ng-attr-tag-name="\''+ label +'\'" ' +
              clickablTag +'></tag>';
          }else{
            element = '<span class="'+tagType+'">'+label+'</span>';
          }
          return acc.concat(element);
        }, '');
      }

    }]);
})();

(function () {
  'use strict';

  angular.module('app.components')
    .factory('PreviewDevice', ['Device', function (Device) {

      /**
       * Preview Device constructor.
       * Used for devices stacked in a list, like in User Profile or Device states
       * @extends Device
       * @constructor
       * @param {Object} object - Object with all the data about the device from the API
       */
      function PreviewDevice(object) {
        Device.call(this, object);

        this.dropdownOptions = [];
        this.dropdownOptions.push({ text: 'EDIT', value: '1', href: 'kits/' + this.id + '/edit', icon: 'fa fa-edit' });
        this.dropdownOptions.push({ text: 'SD CARD UPLOAD', value: '2', href: 'kits/' + this.id + '/upload', icon: 'fa fa-sd-card' });
      }
      PreviewDevice.prototype = Object.create(Device.prototype);
      PreviewDevice.prototype.constructor = Device;
      return PreviewDevice;
    }]);
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('HasSensorDevice', ['Device', function(Device) {

      function HasSensorDevice(object) {
        Device.call(this, object);

        this.sensors = object.data.sensors;
        this.longitude = object.data.location.longitude;
        this.latitude = object.data.location.latitude;
      }

      HasSensorDevice.prototype = Object.create(Device.prototype);
      HasSensorDevice.prototype.constructor = Device;

      HasSensorDevice.prototype.sensorsHasData = function() {
        var parsedSensors = this.sensors.map(function(sensor) {
          return sensor.value;
        });

        return _.some(parsedSensors, function(sensorValue) {
          return !!sensorValue;
        });
      };

      return HasSensorDevice;
    }]);
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('FullDevice', ['Device', 'Sensor', 'deviceUtils', function(Device, Sensor, deviceUtils) {

      /**
       * Full Device constructor.
       * @constructor
       * @extends Device
       * @param {Object} object - Object with all the data about the device from the API
       * @property {Object} owner - Device owner data
       * @property {Array} data - Device sensor's data
       * @property {Array} sensors - Device sensors data
       * @property {Array} postProcessing - Device postprocessing
       */
      function FullDevice(object) {
        Device.call(this, object);

        this.owner = deviceUtils.parseOwner(object);
        this.postProcessing = object.postprocessing;
        this.data = object.data;
        this.sensors = object.data.sensors;
      }

      FullDevice.prototype = Object.create(Device.prototype);
      FullDevice.prototype.constructor = FullDevice;

      FullDevice.prototype.getSensors = function(options) {
        var sensors = _(this.data.sensors)
          .chain()
          .map(function(sensor) {
            return new Sensor(sensor);
          }).sort(function(a, b) {
            /* This is a temporary hack to set always PV panel at the end*/
            if (a.id === 18){ return -1;}
            if (b.id === 18){ return  1;}
            /* This is a temporary hack to set always the Battery at the end*/
            if (a.id === 17){ return -1;}
            if (b.id === 17){ return  1;}
            /* This is a temporary hack to set always the Battery at the end*/
            if (a.id === 10){ return -1;}
            if (b.id === 10){ return  1;}
            /* After the hacks, sort the sensors by id */
            return b.id - a.id;
          })
          .tap(function(sensors) {
            if(options.type === 'compare') {
              sensors.unshift({
                name: 'NONE',
                color: 'white',
                id: -1
              });
            }
          })
          .value();
          return sensors;
      };

      return FullDevice;
    }]);
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('Device', ['deviceUtils', 'timeUtils', function(deviceUtils, timeUtils) {

      /**
       * Device constructor.
       * @constructor
       * @param {Object} object - Object with all the data about the device from the API
       * @property {number} id - ID of the device
       * @property {string} name - Name of the device
       * @property {string} state - State of the device. Ex: Never published
       * @property {string} description - Device description
       * @property {Array} systemTags - System tags
       * @property {Array} userTags - User tags. Ex: ''
       * @property {bool} isPrivate - True if private device
       * @property {Array} notifications - Notifications for low battery and stopped publishing
       * @property {Object} lastReadingAt - last_reading_at: raw, ago, and parsed
       * @property {Object} createdAt - created_at: raw, ago, and parsed
       * @property {Object} updatedAt - updated_at: raw, ago, and parsed
       * @property {Object} location - Location of device. Object with lat, long, elevation, city, country, country_code
       * @property {string} locationString - Location of device. Ex: Madrid, Spain; Germany; Paris, France
       * @property {Object} hardware - Device hardware field. Contains type, version, info, slug and name
       * @property {string} hardwareName - Device hardware name
       * @property {bool} isLegacy - True if legacy device
       * @property {bool} isSCK - True if SC device
       * @property {string} avatar - URL that contains the user avatar
       */
      function Device(object) {
        // Basic information
        this.id = object.id;
        this.name = object.name;
        this.state = deviceUtils.parseState(object);
        this.description = object.description;
        this.token = object.device_token;
        this.macAddress = object.mac_address;

        // Tags and dates
        this.systemTags = deviceUtils.parseSystemTags(object);
        this.userTags = deviceUtils.parseUserTags(object);
        this.isPrivate = deviceUtils.isPrivate(object);
        this.preciseLocation = deviceUtils.preciseLocation(object);
        this.enableForwarding = deviceUtils.enableForwarding(object);
        this.notifications = deviceUtils.parseNotifications(object);
        this.lastReadingAt = timeUtils.parseDate(object.last_reading_at);
        this.createdAt = timeUtils.parseDate(object.created_at);
        this.updatedAt = timeUtils.parseDate(object.updated_at);

        // Location
        this.location = object.location;
        this.locationString = deviceUtils.parseLocation(object);

        // Hardware
        this.hardware = deviceUtils.parseHardware(object);
        this.hardwareName = deviceUtils.parseHardwareName(this);
        this.isLegacy = deviceUtils.isLegacyVersion(this);
        this.isSCK = deviceUtils.isSCKHardware(this);
        // this.class = deviceUtils.classify(object); // TODO - Do we need this?

        this.avatar = deviceUtils.parseAvatar();
        /*jshint camelcase: false */
      }

      return Device;
    }]);
})();

(function() {
  'use strict';

  angular.module('app.components')
    .directive('noDataBackdrop', noDataBackdrop);

  /**
   * Backdrop for chart section when kit has no data
   *
   */
  noDataBackdrop.$inject = [];

  function noDataBackdrop() {
    return {
      restrict: 'A',
      scope: {},
      templateUrl: 'app/core/animation/backdrop/noDataBackdrop.html',
      controller: function($scope, $timeout) {
        var vm = this;

        vm.deviceWithoutData = false;
        vm.scrollToComments = scrollToComments;

        $scope.$on('deviceWithoutData', function(ev, data) {

          $timeout(function() {
            vm.device = data.device;
            vm.deviceWithoutData = true;

            if (data.belongsToUser) {
              vm.user = 'owner';
            } else {
              vm.user = 'visitor';
            }
          }, 0);

        });

        function scrollToComments(){
          location.hash = '';
          location.hash = '#disqus_thread';
        }
      },
      controllerAs: 'vm'
    };
  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .directive('loadingBackdrop', loadingBackdrop);

    /**
     * Backdrop for app initialization and between states
     *
     */
    loadingBackdrop.$inject = [];
    function loadingBackdrop() {
      return {
        templateUrl: 'app/core/animation/backdrop/loadingBackdrop.html',
        controller: function($scope) {
          var vm = this;
          vm.isViewLoading = true;
          vm.mapStateLoading = false;

          // listen for app loading event
          $scope.$on('viewLoading', function() {
            vm.isViewLoading = true;
          });

          $scope.$on('viewLoaded', function() {
            vm.isViewLoading = false;
          });

          // listen for map state loading event
          $scope.$on('mapStateLoading', function() {
            if(vm.isViewLoading) {
              return;
            }
            vm.mapStateLoading = true;
          });

          $scope.$on('mapStateLoaded', function() {
            vm.mapStateLoading = false;
          });
        },
        controllerAs: 'vm'
      };
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('KitController', KitController);

  KitController.$inject = ['$state','$scope', '$stateParams',
    'sensor', 'FullDevice', '$mdDialog', 'belongsToUser',
    'timeUtils', 'animation', 'auth',
    '$timeout', 'alert', '$q', 'device',
    'HasSensorDevice', 'geolocation', 'PreviewDevice'];
  function KitController($state, $scope, $stateParams,
    sensor, FullDevice, $mdDialog, belongsToUser,
    timeUtils, animation, auth,
    $timeout, alert, $q, device,
    HasSensorDevice, geolocation, PreviewDevice) {

    var vm = this;
    var sensorsData = [];

    var mainSensorID, compareSensorID;
    var picker;
    vm.deviceID = $stateParams.id;
    vm.battery = {};
    vm.downloadData = downloadData;
    vm.geolocate = geolocate;
    vm.device = undefined;
    vm.deviceBelongsToUser = belongsToUser;
    vm.deviceWithoutData = false;
    vm.legacyApiKey = belongsToUser ?
      auth.getCurrentUser().data.key :
      undefined;
    vm.loadingChart = true;
    vm.moveChart = moveChart;
    vm.allowUpdateChart = true;
    vm.ownerDevices = [];
    vm.removeDevice = removeDevice;
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

    function removeDevice() {
      var confirm = $mdDialog.confirm()
        .title('Delete this kit?')
        .textContent('Are you sure you want to delete this kit?')
        .ariaLabel('')
        .ok('DELETE')
        .cancel('Cancel')
        .theme('primary')
        .clickOutsideToClose(true);

      $mdDialog
        .show(confirm)
        .then(function(){
          device
            .removeDevice(vm.device.id)
            .then(function(){
              alert.success('Your kit was deleted successfully');
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

(function() {
  'use strict';

  angular.module('app.components')
    .controller('NewKitController', NewKitController);

    NewKitController.$inject = ['$scope', '$state', 'animation', 'device', 'tag', 'alert', 'auth', '$stateParams', '$timeout'];
    function NewKitController($scope, $state, animation, device, tag, alert, auth, $stateParams, $timeout) {
      var vm = this;

      vm.step = 1;
      vm.submitStepOne = submitStepOne;
      vm.backToProfile = backToProfile;

      // FORM INFO
      vm.deviceForm = {
        name: undefined,
        exposure: undefined,
        location: {
          lat: undefined,
          lng: undefined,
          zoom: 16
        },
        is_private: false,
        legacyVersion: '1.1',
        tags: []
      };

      // EXPOSURE SELECT
      vm.exposure = [
        {name: 'indoor', value: 1},
        {name: 'outdoor', value: 2}
      ];

      // VERSION SELECT
      vm.version = [
        {name: 'Smart Citizen Kit 1.0', value: '1.0'},
        {name: 'Smart Citizen Kit 1.1', value: '1.1'}
      ];

      $scope.$on('leafletDirectiveMarker.dragend', function(event, args){
        vm.deviceForm.location.lat = args.model.lat;
        vm.deviceForm.location.lng = args.model.lng;
      });

      // TAGS SELECT
      vm.tags = [];
      $scope.$watch('vm.tag', function(newVal, oldVal) {
        if(!newVal) {
          return;
        }
        // remove selected tag from select element
        vm.tag = undefined;

        var alreadyPushed = _.some(vm.deviceForm.tags, function(tag) {
          return tag.id === newVal;
        });
        if(alreadyPushed) {
          return;
        }

        var tag = _.find(vm.tags, function(tag) {
          return tag.id === newVal;
        });
        vm.deviceForm.tags.push(tag);
      });
      vm.removeTag = removeTag;

      // MAP CONFIGURATION
      var mapBoxToken = 'pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg';

      vm.getLocation = getLocation;
      vm.markers = {
        main: {
          lat: undefined,
          lng: undefined,
          draggable: true
        }
      };
      vm.tiles = {
        url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/{z}/{x}/{y}?access_token=' + mapBoxToken
      };
      vm.defaults = {
        scrollWheelZoom: false
      };

      vm.macAddress = undefined;

      initialize();

      //////////////

      function initialize() {
        animation.viewLoaded();
        getTags();
        vm.userRole = auth.getCurrentUser().data.role;
      }

      function getLocation() {
        window.navigator.geolocation.getCurrentPosition(function(position) {
          $scope.$apply(function() {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            vm.deviceForm.location.lat = lat;
            vm.deviceForm.location.lng = lng;
            vm.markers.main.lat = lat;
            vm.markers.main.lng = lng;
          });
        });
      }

      function removeTag(tagID) {
        vm.deviceForm.tags = _.filter(vm.deviceForm.tags, function(tag) {
          return tag.id !== tagID;
        });
      }

      function submitStepOne() {
        var data = {
          name: vm.deviceForm.name,
          description: vm.deviceForm.description,
          exposure: findExposure(vm.deviceForm.exposure),
          latitude: vm.deviceForm.location.lat,
          longitude: vm.deviceForm.location.lng,
          is_private: vm.deviceForm.is_private,
          hardware_version_override: vm.deviceForm.legacyVersion,
          /*jshint camelcase: false */
          user_tags: _.map(vm.deviceForm.tags, 'name').join(',')
        };

        device.createDevice(data)
          .then(
            function(response) {
              device.updateContext().then(function(){
                auth.setCurrentUser('appLoad').then(function(){
                  $timeout($state.go('layout.kitEdit', {id:response.id, step:2}), 2000);
                });
              });
            },
            function(err) {
              vm.errors = err.data.errors;
              alert.error('There has been an error during kit set up');
            });
      }

      function getTags() {
        tag.getTags()
          .then(function(tagsData) {
            vm.tags = tagsData;
          });
      }

      function toProfile(){
        $state.transitionTo('layout.myProfile.kits', $stateParams,
        { reload: false,
          inherit: false,
          notify: true
        });
      }

      function backToProfile(){
        // TODO: Refactor Check
        toProfile();
      }

      //TODO: move to utils
      function findExposure(nameOrValue) {
        var findProp, resultProp;
        //if it's a string
        if(isNaN(parseInt(nameOrValue))) {
          findProp = 'name';
          resultProp = 'value';
        } else {
          findProp = 'value';
          resultProp = 'name';
        }

        var option = _.find(vm.exposure, function(exposureFromList) {
          return exposureFromList[findProp] === nameOrValue;
        });
        if(option) {
          return option[resultProp];
        }
      }
    }
})();

(function() {
  'use strict';

  // Taken from this answer on SO:
  // https://stackoverflow.com/questions/17893708/angularjs-textarea-bind-to-json-object-shows-object-object
  angular.module('app.components').directive('jsonText', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attr, ngModel){
        function into(input) {
          return JSON.parse(input);
        }
        function out(data) {
          return JSON.stringify(data);
        }
        ngModel.$parsers.push(into);
        ngModel.$formatters.push(out);
      }
    };
  });

  angular.module('app.components')
    .controller('EditKitController', EditKitController);

    EditKitController.$inject = ['$scope', '$element', '$location', '$timeout', '$state',
    'animation','auth','device', 'tag', 'alert', 'step', '$stateParams', 'FullDevice'];
    function EditKitController($scope, $element, $location, $timeout, $state, animation,
      auth, device, tag, alert, step, $stateParams, FullDevice) {

      var vm = this;

      // WAIT INTERVAL FOR USER FEEDBACK and TRANSITIONS (This will need to change)
      var timewait = {
          long: 5000,
          normal: 2000,
          short: 1000
      };

      vm.step = step;

      // KEY USER ACTIONS
      vm.submitFormAndKit = submitFormAndKit;
      vm.backToProfile = backToProfile;
      vm.backToDevice = backToDevice;
      vm.submitForm = submitForm;
      vm.goToStep = goToStep;
      vm.nextAction = 'save';

      // EXPOSURE SELECT
      vm.exposure = [
        {name: 'indoor', value: 1},
        {name: 'outdoor', value: 2}
      ];

      // FORM INFO
      vm.deviceForm = {};
      vm.device = undefined;

      $scope.clearSearchTerm = function() {
        $scope.searchTerm = '';
      };
      // The md-select directive eats keydown events for some quick select
      // logic. Since we have a search input here, we don't need that logic.
      $element.find('input').on('keydown', function(ev) {
          ev.stopPropagation();
      });

      $scope.$on('leafletDirectiveMarker.dragend', function(event, args){
        vm.deviceForm.location.lat = args.model.lat;
        vm.deviceForm.location.lng = args.model.lng;
      });

      // MAP CONFIGURATION
      var mapBoxToken = 'pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg';

      vm.getLocation = getLocation;
      vm.markers = {};
      vm.tiles = {
        url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/{z}/{x}/{y}?access_token=' + mapBoxToken
      };
      vm.defaults = {
        scrollWheelZoom: false
      };

      initialize();

      /////////////////

      function initialize() {
        var deviceID = $stateParams.id;

        animation.viewLoaded();
        getTags();

        if (!deviceID || deviceID === ''){
          return;
        }
        device.getDevice(deviceID)
          .then(function(deviceData) {
            vm.device = new FullDevice(deviceData);
            vm.userRole = auth.getCurrentUser().data.role;
            vm.deviceForm = {
              name: vm.device.name,
              exposure: findExposureFromLabels(vm.device.systemTags),
              location: {
                lat: vm.device.location.latitude,
                lng: vm.device.location.longitude,
                zoom: 16
              },
              is_private: vm.device.isPrivate,
              precise_location: vm.device.preciseLocation,
              enable_forwarding: vm.device.enableForwarding,
              notify_low_battery: vm.device.notifications.lowBattery,
              notify_stopped_publishing: vm.device.notifications.stopPublishing,
              tags: vm.device.userTags,
              postprocessing: vm.device.postProcessing,
              description: vm.device.description,
              hardwareName: vm.device.hardware.name
            };
            vm.markers = {
              main: {
                lat: vm.device.location.latitude,
                lng: vm.device.location.longitude,
                draggable: true
              }
            };

            if (vm.device.isLegacy) {
              vm.deviceForm.macAddress = vm.device.macAddress;
            }
          });
      }

      // Return tags in a comma separated list
      function joinSelectedTags(){
        let tmp = []
        $scope.selectedTags.forEach(function(e){
          tmp.push(e.name)
        })
        return tmp.join(', ');
      }

      function getLocation() {
        window.navigator.geolocation.getCurrentPosition(function(position) {
          $scope.$apply(function() {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            vm.deviceForm.location.lat = lat;
            vm.deviceForm.location.lng = lng;
            vm.markers.main.lat = lat;
            vm.markers.main.lng = lng;
          });
        });
      }

      function submitFormAndKit(){
        submitForm(backToProfile, timewait.normal);
      }

      function submitForm(next, delayTransition) {
        var data = {
          name: vm.deviceForm.name,
          description: vm.deviceForm.description,
          postprocessing_attributes: vm.deviceForm.postprocessing,
          exposure: findExposure(vm.deviceForm.exposure),
          latitude: vm.deviceForm.location.lat,
          longitude: vm.deviceForm.location.lng,
          is_private: vm.deviceForm.is_private,
          enable_forwarding: vm.deviceForm.enable_forwarding,
          precise_location: vm.deviceForm.precise_location,
          notify_low_battery: vm.deviceForm.notify_low_battery,
          notify_stopped_publishing: vm.deviceForm.notify_stopped_publishing,
          mac_address: "",
          /*jshint camelcase: false */
          user_tags: joinSelectedTags(),
        };

        vm.errors={};

        if(!vm.device.isSCK) {
          data.hardware_name_override = vm.deviceForm.hardwareName;
        }

        // Workaround for the mac_address bypass
        // If mac_address is "", we get an error on the request -> we use it for the newKit
        // If mac_address is null, no problem -> we use it for the
        if ($stateParams.step === "2") {
          data.mac_address = vm.deviceForm.macAddress ? vm.deviceForm.macAddress : "";
        } else {
          data.mac_address = vm.deviceForm.macAddress ? vm.deviceForm.macAddress : null;
        }

        device.updateDevice(vm.device.id, data)
          .then(
            function() {

              if (next){
                alert.success('Your kit was updated!');
              }

              device.updateContext().then(function(){
                if (next){
                  $timeout(next, delayTransition);
                }
              });
            })
            .catch(function(err) {
              if(err.data.errors) {
                vm.errors = err.data.errors;
                var message = Object.keys(vm.errors).map(function (key, _) {
                  return [key, vm.errors[key][0]].join(' '); }).join('');
                alert.error('Oups! Check the input. Something went wrong!');
                throw new Error('[Client:error] ' + message);
              }
              $timeout(function(){ }, timewait.long);
            });
      }

      function findExposureFromLabels(labels){
        var label = vm.exposure.filter(function(n) {
            return labels.indexOf(n.name) !== -1;
        })[0];
        if(label) {
          return findExposure(label.name);
        } else {
          return findExposure(vm.exposure[0].name);
        }
      }

      function findExposure(nameOrValue) {
        var findProp, resultProp;

        //if it's a string
        if(isNaN(parseInt(nameOrValue))) {
          findProp = 'name';
          resultProp = 'value';
        } else {
          findProp = 'value';
          resultProp = 'name';
        }

        var option = _.find(vm.exposure, function(exposureFromList) {
          return exposureFromList[findProp] === nameOrValue;
        });
        if(option) {
          return option[resultProp];
        } else {
          return vm.exposure[0][resultProp];
        }
      }

      function getTags() {
        tag.getTags()
          .then(function(tagsData) {
            vm.tags = tagsData;
          });
      }

      function backToProfile(){
        $state.transitionTo('layout.myProfile.kits', $stateParams,
        { reload: false,
          inherit: false,
          notify: true
        });
      }

      function backToDevice(){
        $state.transitionTo('layout.home.kit', $stateParams,
        { reload: false,
          inherit: false,
          notify: true
        });
      }

      function goToStep(step) {
        vm.step = step;
        $state.transitionTo('layout.kitEdit', { id:$stateParams.id, step: step} ,
        {
          reload: false,
          inherit: false,
          notify: false
        });
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('userUtils', userUtils);

    function userUtils() {
      var service = {
        isAdmin: isAdmin,
        isAuthUser: isAuthUser
      };
      return service;

      ///////////

      function isAdmin(userData) {
        return userData.role === 'admin';
      }
      function isAuthUser(userID, authUserData) {
        return userID === authUserData.id;
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('timeUtils', timeUtils);

  function timeUtils() {
    var service = {
      getSecondsFromDate: getSecondsFromDate,
      getMillisFromDate: getMillisFromDate,
      getCurrentRange: getCurrentRange,
      getToday: getToday,
      getHourBefore: getHourBefore,
      getSevenDaysAgo: getSevenDaysAgo,
      getDateIn: getDateIn,
      convertTime: convertTime,
      formatDate: formatDate,
      isSameDay: isSameDay,
      isWithin15min: isWithin15min,
      isWithin1Month: isWithin1Month,
      isWithin: isWithin,
      isDiffMoreThan15min: isDiffMoreThan15min,
      parseDate: parseDate
    };
    return service;

    ////////////

    function getDateIn(timeMS, format) {
      if(!format) {
        return timeMS;
      }

      var result;
      if(format === 'ms') {
        result = timeMS;
      } else if(format === 's') {
        result = timeMS / 1000;
      } else if(format === 'm') {
        result = timeMS / 1000 / 60;
      } else if(format === 'h') {
        result = timeMS / 1000 / 60 / 60;
      } else if(format === 'd') {
        result = timeMS / 1000 / 60 / 60 / 24;
      }
      return result;
    }

    function convertTime(time) {
      return moment(time).toISOString();
    }

    function formatDate(time) {
      return moment(time).format('YYYY-MM-DDTHH:mm:ss');
    }

    function getSecondsFromDate(date) {
      return (new Date(date)).getTime();
    }

    function getMillisFromDate(date) {
      return (new Date(date)).getTime();
    }

    function getCurrentRange(fromDate, toDate) {
      return moment(toDate).diff(moment(fromDate), 'days');
    }

    function getToday() {
      return (new Date()).getTime();
    }

    function getSevenDaysAgo() {
      return getSecondsFromDate( getToday() - (7 * 24 * 60 * 60 * 1000) );
    }

    function getHourBefore(date) {
      var now = moment(date);
      return now.subtract(1, 'hour').valueOf();
    }

    function isSameDay(day1, day2) {
      day1 = moment(day1);
      day2 = moment(day2);

      if(day1.startOf('day').isSame(day2.startOf('day'))) {
        return true;
      }
      return false;
    }

    function isDiffMoreThan15min(dateToCheckFrom, dateToCheckTo) {
      var duration = moment.duration(moment(dateToCheckTo).diff(moment(dateToCheckFrom)));
      return duration.as('minutes') > 15;
    }

    function isWithin15min(dateToCheck) {
      var fifteenMinAgo = moment().subtract(15, 'minutes').valueOf();
      dateToCheck = moment(dateToCheck).valueOf();

      return dateToCheck > fifteenMinAgo;
    }

    function isWithin1Month(dateToCheck) {
      var oneMonthAgo = moment().subtract(1, 'months').valueOf();
      dateToCheck = moment(dateToCheck).valueOf();

      return dateToCheck > oneMonthAgo;
    }

    function isWithin(number, type, dateToCheck) {
      var ago = moment().subtract(number, type).valueOf();
      dateToCheck = moment(dateToCheck).valueOf();

      return dateToCheck > ago;
    }

    function parseDate(object){
      var time = object;
      return {
        raw: time,
        parsed: !time ? 'No time' : moment(time).format('MMMM DD, YYYY - HH:mm'),
        ago: !time ? 'No time' : moment(time).fromNow()
      }
    }
  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('sensorUtils', sensorUtils);

    sensorUtils.$inject = ['timeUtils'];
    function sensorUtils(timeUtils) {
      var service = {
        getRollup: getRollup,
        getSensorName: getSensorName,
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
        // TODO: Improvement check how we set new names
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

      function getSensorValue(sensor) {
        var value = sensor.value;

        if(isNaN(parseInt(value))) {
          value =  'NA';
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

(function() {
  'use strict';

  angular.module('app.components')
    .factory('searchUtils', searchUtils);


    searchUtils.$inject = [];
    function searchUtils() {
      var service = {
        parseLocation: parseLocation,
        parseName: parseName,
        parseIcon: parseIcon,
        parseIconType: parseIconType
      };
      return service;

      /////////////////

      function parseLocation(object) {
        var location = '';

        if(!!object.city) {
          location += object.city;
        }
        if(!!object.city && !!object.country) {
          location += ', '; 
        }
        if(!!object.country) {
          location += object.country;
        }

        return location;
      }

      function parseName(object) {
        var name = object.type === 'User' ? object.username : object.name;
        return name;
      }

      function parseIcon(object, type) {
        switch(type) {
          case 'User':
            return object.profile_picture;
          case 'Device':
            return 'assets/images/kit.svg';
          case 'Country':
          case 'City':
            return 'assets/images/location_icon_normal.svg';
        }
      }

      function parseIconType(type) {
        switch(type) {
          case 'Device':
            return 'div';
          default:
            return 'img';
        }
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('markerUtils', markerUtils);

    markerUtils.$inject = ['deviceUtils', 'MARKER_ICONS'];
    function markerUtils(deviceUtils, MARKER_ICONS) {
      var service = {
        getIcon: getIcon,
        getMarkerIcon: getMarkerIcon,
      };
      _.defaults(service, deviceUtils);
      return service;

      ///////////////

      function getIcon(object) {
        var icon;
        var labels = deviceUtils.parseSystemTags(object);
        var isSCKHardware = deviceUtils.isSCKHardware(object);

        if(hasLabel(labels, 'offline')) {
          icon = MARKER_ICONS.markerSmartCitizenOffline;
        } else if (isSCKHardware) {
          icon = MARKER_ICONS.markerSmartCitizenOnline;
        } else {
          icon = MARKER_ICONS.markerExperimentalNormal;
        }
        return icon;
      }

      function hasLabel(labels, targetLabel) {
        return _.some(labels, function(label) {
          return label === targetLabel;
        });
      }

      function getMarkerIcon(marker, state) {
        var markerType = marker.icon.className;

        if(state === 'active') {
          marker.icon = MARKER_ICONS[markerType + 'Active'];
          marker.focus = true;
        } else if(state === 'inactive') {
          var targetClass = markerType.split(' ')[0];
          marker.icon = MARKER_ICONS[targetClass];
        }
        return marker;
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('mapUtils', mapUtils);

    mapUtils.$inject = [];
    function mapUtils() {
      var service = {
        getDefaultFilters: getDefaultFilters,
        setDefaultFilters: setDefaultFilters,
        canFilterBeRemoved: canFilterBeRemoved
      };
      return service;

      //////////////

      function getDefaultFilters(filterData, defaultFilters) {
        var obj = {};
        if(!filterData.indoor && !filterData.outdoor) {
          obj[defaultFilters.exposure] = true;          
        } 
        if(!filterData.online && !filterData.offline) {
          obj[defaultFilters.status] = true;            
        } 
        return obj;
      }

      function setDefaultFilters(filterData) {
        var obj = {};
        if(!filterData.indoor || !filterData.outdoor) {
          obj.exposure = filterData.indoor ? 'indoor' : 'outdoor';
        } 
        if(!filterData.online || !filterData.offline) {
          obj.status = filterData.online ? 'online' : 'offline';
        }
        return obj;
      }

      function canFilterBeRemoved(filterData, filterName) {
        if(filterName === 'indoor' || filterName === 'outdoor') {
          return filterData.indoor && filterData.outdoor;
        } else if(filterName === 'online' || filterName === 'offline') {
          return filterData.online && filterData.offline;
        }
      }
    }
})();

(function() {
  'use strict';
  angular.module('app.components')
   .config(function ($provide) {
        $provide.decorator('$exceptionHandler', ['$delegate', function($delegate) {
          return function (exception, cause) {
            /*jshint camelcase: false */
            $delegate(exception, cause);
          };
        }]);

    });
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('deviceUtils', deviceUtils);

    deviceUtils.$inject = ['COUNTRY_CODES', 'device'];
    function deviceUtils(COUNTRY_CODES, device) {
      var service = {
        parseLocation: parseLocation,
        parseCoordinates: parseCoordinates,
        parseSystemTags: parseSystemTags,
        parseUserTags: parseUserTags,
        classify: classify,
        parseNotifications: parseNotifications,
        parseOwner: parseOwner,
        parseName: parseName,
        parseString: parseString,
        parseHardware: parseHardware,
        parseHardwareInfo: parseHardwareInfo,
        parseHardwareName: parseHardwareName,
        isPrivate: isPrivate,
        preciseLocation: preciseLocation,
        enableForwarding: enableForwarding,
        isLegacyVersion: isLegacyVersion,
        isSCKHardware: isSCKHardware,
        parseState: parseState,
        parseAvatar: parseAvatar,
        belongsToUser: belongsToUser,
        parseSensorTime: parseSensorTime
      };

      return service;

      ///////////////

      function parseLocation(object) {
        var location = '';
        var city = '';
        var country = '';

        if (object.location) {
          city = object.location.city;
          country = object.location.country;
          if(!!city) {
            location += city;
          }
          if(!!city && !!location) {
            location += ', '
          }
          if(!!country) {
            location += country;
          }
        }
        return location;
      }

      function parseCoordinates(object) {
        if (object.location) {
          return {
            lat: object.location.latitude,
            lng: object.location.longitude
          };
        }
        // TODO: Bug - what happens if no location?
      }

      function parseSystemTags(object) {
        /*jshint camelcase: false */
        return object.system_tags;
      }

      function parseUserTags(object) {
        return object.user_tags;
      }

      function parseNotifications(object){
        return {
          lowBattery: object.notify.low_battery,
          stopPublishing: object.notify.stopped_publishing
        }
      }

      function classify(kitType) {
        if(!kitType) {
          return '';
        }
        return kitType.toLowerCase().split(' ').join('_');
      }

      function parseName(object, trim=false) {
        if(!object.name) {
          return;
        }
        if (trim) {
          return object.name.length <= 41 ? object.name : object.name.slice(0, 35).concat(' ... ');
        }
        return object.name;
      }

      function parseHardware(object) {
        if (!object.hardware) {
          return;
        }

        return {
          name: parseString(object.hardware.name),
          type: parseString(object.hardware.type),
          description: parseString(object.hardware.description),
          version: parseVersionString(object.hardware.version),
          slug: object.hardware.slug,
          info: parseHardwareInfo(object.hardware.info)
        }
      }

      function parseString(str) {
          if (typeof(str) !== 'string') { return null; }
          return str;
      }

      function parseVersionString (str) {
          if (typeof(str) !== 'string') { return null; }
          var x = str.split('.');
          // parse from string or default to 0 if can't parse
          var maj = parseInt(x[0]) || 0;
          var min = parseInt(x[1]) || 0;
          var pat = parseInt(x[2]) || 0;
          return {
              major: maj,
              minor: min,
              patch: pat
          };
      }

      function parseHardwareInfo (object) {
        if (!object) { return null; } // null
        if (typeof(object) == 'string') { return null; } // FILTERED

        var id = parseString(object.id);
        var mac = parseString(object.mac);
        var time = Date(object.time);
        var esp_bd = parseString(object.esp_bd);
        var hw_ver = parseString(object.hw_ver);
        var sam_bd = parseString(object.sam_bd);
        var esp_ver = parseString(object.esp_ver);
        var sam_ver = parseString(object.sam_ver);

        return {
          id: id,
          mac: mac,
          time: time,
          esp_bd: esp_bd,
          hw_ver: hw_ver,
          sam_bd: sam_bd,
          esp_ver: esp_ver,
          sam_ver: sam_ver
        };
      }

      function parseHardwareName(object) {
        if (object.hasOwnProperty('hardware')) {
          if (!object.hardware.name) {
            return 'Unknown hardware'
          }
          return object.hardware.name;
        } else {
          return 'Unknown hardware'
        }
      }

      function isPrivate(object) {
        return object.data_policy.is_private;
      }

      function preciseLocation(object) {
        return object.data_policy.precise_location;
      }

      function enableForwarding(object) {
        return object.data_policy.enable_forwarding	;
      }

      function isLegacyVersion (object) {
        if (!object.hardware || !object.hardware.version || object.hardware.version.major > 1) {
          return false;
        } else {
          if (object.hardware.version.major == 1 && object.hardware.version.minor <5 ){
            return true;
          }
          return false;
        }
      }

      function isSCKHardware (object){
        if (!object.hardware || !object.hardware.type || object.hardware.type != 'SCK') {
          return false;
        } else {
          return true;
        }
      }

      function parseOwner(object) {
        return {
          id: object.owner.id,
          username: object.owner.username,
          /*jshint camelcase: false */
          devices: object.owner.device_ids,
          city: object.owner.location.city,
          country: COUNTRY_CODES[object.owner.location.country_code],
          url: object.owner.url,
          profile_picture: object.owner.profile_picture
        };
      }

      function parseState(status) {
        var name = parseStateName(status);
        var className = classify(name);

        return {
          name: name,
          className: className
        };
      }

      function parseStateName(object) {
        return object.state.replace('_', ' ');
      }

      function parseAvatar() {
        return './assets/images/sckit_avatar.jpg';
      }

      function parseSensorTime(sensor) {
        /*jshint camelcase: false */
        return moment(sensor.recorded_at).format('');
      }

      function belongsToUser(devicesArray, deviceID) {
        return _.some(devicesArray, function(device) {
          return device.id === deviceID;
        });
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .filter('filterLabel', filterLabel);


    function filterLabel() {
      return function(devices, targetLabel) {
        if(targetLabel === undefined) {
          return devices;
        }
        if(devices) {
          return _.filter(devices, function(device) {
            var containsLabel = device.systemTags.indexOf(targetLabel) !== -1;
            if(containsLabel) {
              return containsLabel;
            }
            // This should be fixed or polished in the future
            // var containsNewIfTargetIsOnline = targetLabel === 'online' && _.some(kit.labels, function(label) {return label.indexOf('new') !== -1;});
            // return containsNewIfTargetIsOnline;
          });
        }
      };
    }
})();

(function() {
  'use strict';

  /**
   * Tools links for user profile
   * @constant
   * @type {Array}
   */

  angular.module('app.components')
    .constant('PROFILE_TOOLS', [{
      type: 'documentation',
      title: 'How to connect your Smart Citizen Kit tutorial',
      description: 'Adding a Smart Citizen Kit tutorial',
      avatar: '',
      href: 'http://docs.smartcitizen.me/#/start/adding-a-smart-citizen-kit'
    }, {
      type: 'documentation',
      title: 'Download the latest Smart Citizen Kit Firmware',
      description: 'The latest Arduino firmware for your kit',
      avatar: '',
      href: 'https://github.com/fablabbcn/Smart-Citizen-Kit/releases/latest'
    }, {
      type: 'documentation',
      title: 'API Documentation',
      description: 'Documentation for the new API',
      avatar: '',
      href: 'http://developer.smartcitizen.me/'
    }, {
      type: 'community',
      title: 'Smart Citizen Forum',
      description: 'Join the community discussion. Your feedback is important for us.',
      avatar: '',
      href:'http://forum.smartcitizen.me/'
    }, {
      type: 'documentation',
      title: 'Smart Citizen Kit hardware details',
      description: 'Visit the docs',
      avatar: 'https://docs.smartcitizen.me/#/start/hardware'
    }, {
      type: 'documentation',
      title: 'Style Guide',
      description: 'Guidelines of the Smart Citizen UI',
      avatar: '',
      href: '/styleguide'
    }, {
      type: 'social',
      title: 'Like us on Facebook',
      description: 'Join the community on Facebook',
      avatar: '',
      href: 'https://www.facebook.com/smartcitizenBCN'
    }, {
      type: 'social',
      title: 'Follow us on Twitter',
      description: 'Follow our news on Twitter',
      avatar: '',
      href: 'https://twitter.com/SmartCitizenKit'
    }]);
})();

(function() {
  'use strict';

  /**
   * Marker icons
   * @constant
   * @type {Object}
   */

  angular.module('app.components')
    .constant('MARKER_ICONS', {
      defaultIcon: {},
      markerSmartCitizenNormal: {
        type: 'div',
        className: 'markerSmartCitizenNormal',
        iconSize: [24, 24]
      },
      markerExperimentalNormal: {
        type: 'div',
        className: 'markerExperimentalNormal',
        iconSize: [24, 24]
      },
      markerSmartCitizenOnline: {
        type: 'div',
        className: 'markerSmartCitizenOnline',
        iconSize: [24, 24]
      },
      markerSmartCitizenOnlineActive: {
        type: 'div',
        className: 'markerSmartCitizenOnline marker_blink',
        iconSize: [24, 24]
      },
      markerSmartCitizenOffline: {
        type: 'div',
        className: 'markerSmartCitizenOffline',
        iconSize: [24, 24]
      },
      markerSmartCitizenOfflineActive: {
        type: 'div',
        className: 'markerSmartCitizenOffline marker_blink',
        iconSize: [24, 24]
      }
    });
})();

(function() {
  'use strict';

  /**
   * Dropdown options for user
   * @constant
   * @type {Array}
   */
  angular.module('app.components')
    .constant('DROPDOWN_OPTIONS_USER', [
      {divider: true, text: 'Hi,', href: './profile'},
      {text: 'My profile', href: './profile'},
      {text: 'Log out', href: './logout'}
    ]);
})();

(function() {
  'use strict';

  /**
   * Dropdown options for community button
   * @constant
   * @type {Array}
   */

  angular.module('app.components')
    .constant('DROPDOWN_OPTIONS_COMMUNITY', [
      {text: 'About', href: '/about'},
      {text: 'Forum', href: 'https://forum.smartcitizen.me/'},
      {text: 'Documentation', href: 'http://docs.smartcitizen.me/'},
      {text: 'API Reference', href: 'http://developer.smartcitizen.me/'},
      {text: 'Github', href: 'https://github.com/fablabbcn/Smart-Citizen-Kit'},
      {text: 'Legal', href: '/policy'}
    ]);
})();

(function() {
  'use strict';

  /**
   * Country codes.
   * @constant 
   * @type {Object}
   */
  
  angular.module('app.components')
    .constant('COUNTRY_CODES', {
      'AF': 'Afghanistan',
      'AX': 'Aland Islands',
      'AL': 'Albania',
      'DZ': 'Algeria',
      'AS': 'American Samoa',
      'AD': 'Andorra',
      'AO': 'Angola',
      'AI': 'Anguilla',
      'AQ': 'Antarctica',
      'AG': 'Antigua And Barbuda',
      'AR': 'Argentina',
      'AM': 'Armenia',
      'AW': 'Aruba',
      'AU': 'Australia',
      'AT': 'Austria',
      'AZ': 'Azerbaijan',
      'BS': 'Bahamas',
      'BH': 'Bahrain',
      'BD': 'Bangladesh',
      'BB': 'Barbados',
      'BY': 'Belarus',
      'BE': 'Belgium',
      'BZ': 'Belize',
      'BJ': 'Benin',
      'BM': 'Bermuda',
      'BT': 'Bhutan',
      'BO': 'Bolivia',
      'BA': 'Bosnia And Herzegovina',
      'BW': 'Botswana',
      'BV': 'Bouvet Island',
      'BR': 'Brazil',
      'IO': 'British Indian Ocean Territory',
      'BN': 'Brunei Darussalam',
      'BG': 'Bulgaria',
      'BF': 'Burkina Faso',
      'BI': 'Burundi',
      'KH': 'Cambodia',
      'CM': 'Cameroon',
      'CA': 'Canada',
      'CV': 'Cape Verde',
      'KY': 'Cayman Islands',
      'CF': 'Central African Republic',
      'TD': 'Chad',
      'CL': 'Chile',
      'CN': 'China',
      'CX': 'Christmas Island',
      'CC': 'Cocos (Keeling) Islands',
      'CO': 'Colombia',
      'KM': 'Comoros',
      'CG': 'Congo',
      'CD': 'Congo, Democratic Republic',
      'CK': 'Cook Islands',
      'CR': 'Costa Rica',
      'CI': 'Cote D\'Ivoire',
      'HR': 'Croatia',
      'CU': 'Cuba',
      'CY': 'Cyprus',
      'CZ': 'Czech Republic',
      'DK': 'Denmark',
      'DJ': 'Djibouti',
      'DM': 'Dominica',
      'DO': 'Dominican Republic',
      'EC': 'Ecuador',
      'EG': 'Egypt',
      'SV': 'El Salvador',
      'GQ': 'Equatorial Guinea',
      'ER': 'Eritrea',
      'EE': 'Estonia',
      'ET': 'Ethiopia',
      'FK': 'Falkland Islands (Malvinas)',
      'FO': 'Faroe Islands',
      'FJ': 'Fiji',
      'FI': 'Finland',
      'FR': 'France',
      'GF': 'French Guiana',
      'PF': 'French Polynesia',
      'TF': 'French Southern Territories',
      'GA': 'Gabon',
      'GM': 'Gambia',
      'GE': 'Georgia',
      'DE': 'Germany',
      'GH': 'Ghana',
      'GI': 'Gibraltar',
      'GR': 'Greece',
      'GL': 'Greenland',
      'GD': 'Grenada',
      'GP': 'Guadeloupe',
      'GU': 'Guam',
      'GT': 'Guatemala',
      'GG': 'Guernsey',
      'GN': 'Guinea',
      'GW': 'Guinea-Bissau',
      'GY': 'Guyana',
      'HT': 'Haiti',
      'HM': 'Heard Island & Mcdonald Islands',
      'VA': 'Holy See (Vatican City State)',
      'HN': 'Honduras',
      'HK': 'Hong Kong',
      'HU': 'Hungary',
      'IS': 'Iceland',
      'IN': 'India',
      'ID': 'Indonesia',
      'IR': 'Iran, Islamic Republic Of',
      'IQ': 'Iraq',
      'IE': 'Ireland',
      'IM': 'Isle Of Man',
      'IL': 'Israel',
      'IT': 'Italy',
      'JM': 'Jamaica',
      'JP': 'Japan',
      'JE': 'Jersey',
      'JO': 'Jordan',
      'KZ': 'Kazakhstan',
      'KE': 'Kenya',
      'KI': 'Kiribati',
      'KR': 'Korea',
      'KW': 'Kuwait',
      'KG': 'Kyrgyzstan',
      'LA': 'Lao People\'s Democratic Republic',
      'LV': 'Latvia',
      'LB': 'Lebanon',
      'LS': 'Lesotho',
      'LR': 'Liberia',
      'LY': 'Libyan Arab Jamahiriya',
      'LI': 'Liechtenstein',
      'LT': 'Lithuania',
      'LU': 'Luxembourg',
      'MO': 'Macao',
      'MK': 'Macedonia',
      'MG': 'Madagascar',
      'MW': 'Malawi',
      'MY': 'Malaysia',
      'MV': 'Maldives',
      'ML': 'Mali',
      'MT': 'Malta',
      'MH': 'Marshall Islands',
      'MQ': 'Martinique',
      'MR': 'Mauritania',
      'MU': 'Mauritius',
      'YT': 'Mayotte',
      'MX': 'Mexico',
      'FM': 'Micronesia, Federated States Of',
      'MD': 'Moldova',
      'MC': 'Monaco',
      'MN': 'Mongolia',
      'ME': 'Montenegro',
      'MS': 'Montserrat',
      'MA': 'Morocco',
      'MZ': 'Mozambique',
      'MM': 'Myanmar',
      'NA': 'Namibia',
      'NR': 'Nauru',
      'NP': 'Nepal',
      'NL': 'Netherlands',
      'AN': 'Netherlands Antilles',
      'NC': 'New Caledonia',
      'NZ': 'New Zealand',
      'NI': 'Nicaragua',
      'NE': 'Niger',
      'NG': 'Nigeria',
      'NU': 'Niue',
      'NF': 'Norfolk Island',
      'MP': 'Northern Mariana Islands',
      'NO': 'Norway',
      'OM': 'Oman',
      'PK': 'Pakistan',
      'PW': 'Palau',
      'PS': 'Palestinian Territory, Occupied',
      'PA': 'Panama',
      'PG': 'Papua New Guinea',
      'PY': 'Paraguay',
      'PE': 'Peru',
      'PH': 'Philippines',
      'PN': 'Pitcairn',
      'PL': 'Poland',
      'PT': 'Portugal',
      'PR': 'Puerto Rico',
      'QA': 'Qatar',
      'RE': 'Reunion',
      'RO': 'Romania',
      'RU': 'Russian Federation',
      'RW': 'Rwanda',
      'BL': 'Saint Barthelemy',
      'SH': 'Saint Helena',
      'KN': 'Saint Kitts And Nevis',
      'LC': 'Saint Lucia',
      'MF': 'Saint Martin',
      'PM': 'Saint Pierre And Miquelon',
      'VC': 'Saint Vincent And Grenadines',
      'WS': 'Samoa',
      'SM': 'San Marino',
      'ST': 'Sao Tome And Principe',
      'SA': 'Saudi Arabia',
      'SN': 'Senegal',
      'RS': 'Serbia',
      'SC': 'Seychelles',
      'SL': 'Sierra Leone',
      'SG': 'Singapore',
      'SK': 'Slovakia',
      'SI': 'Slovenia',
      'SB': 'Solomon Islands',
      'SO': 'Somalia',
      'ZA': 'South Africa',
      'GS': 'South Georgia And Sandwich Isl.',
      'ES': 'Spain',
      'LK': 'Sri Lanka',
      'SD': 'Sudan',
      'SR': 'Suriname',
      'SJ': 'Svalbard And Jan Mayen',
      'SZ': 'Swaziland',
      'SE': 'Sweden',
      'CH': 'Switzerland',
      'SY': 'Syrian Arab Republic',
      'TW': 'Taiwan',
      'TJ': 'Tajikistan',
      'TZ': 'Tanzania',
      'TH': 'Thailand',
      'TL': 'Timor-Leste',
      'TG': 'Togo',
      'TK': 'Tokelau',
      'TO': 'Tonga',
      'TT': 'Trinidad And Tobago',
      'TN': 'Tunisia',
      'TR': 'Turkey',
      'TM': 'Turkmenistan',
      'TC': 'Turks And Caicos Islands',
      'TV': 'Tuvalu',
      'UG': 'Uganda',
      'UA': 'Ukraine',
      'AE': 'United Arab Emirates',
      'GB': 'United Kingdom',
      'US': 'United States',
      'UM': 'United States Outlying Islands',
      'UY': 'Uruguay',
      'UZ': 'Uzbekistan',
      'VU': 'Vanuatu',
      'VE': 'Venezuela',
      'VN': 'Viet Nam',
      'VG': 'Virgin Islands, British',
      'VI': 'Virgin Islands, U.S.',
      'WF': 'Wallis And Futuna',
      'EH': 'Western Sahara',
      'YE': 'Yemen',
      'ZM': 'Zambia',
      'ZW': 'Zimbabwe' 
    });
})();

(function() {
	'use strict';

	angular.module('app.components')
	  .factory('user', user);

	  user.$inject = ['Restangular'];
	  function user(Restangular) {
      var service = {
        createUser: createUser,
        getUser: getUser,
        updateUser: updateUser
      };
      return service;

      ////////////////////

      function createUser(signupData) {
        return Restangular.all('users').post(signupData);
      }

      function getUser(id) {
        return Restangular.one('users', id).get();
      }

      function updateUser(updateData) {
        return Restangular.all('me').customPUT(updateData);
      }
	  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('tag', tag);

    tag.$inject = ['Restangular'];
    function tag(Restangular) {
      var tags = [];
      var selectedTags = [];

      var service = {
        getTags: getTags,
        getSelectedTags: getSelectedTags,
        setSelectedTags: setSelectedTags,
        tagWithName: tagWithName,
        filterMarkersByTag: filterMarkersByTag
      };

      return service;

      /////////////////

      function getTags() {
        return Restangular.all('tags')
          .getList({'per_page': 200})
          .then(function(fetchedTags){
            tags = fetchedTags.plain();
            return tags;
          });
      }

      function getSelectedTags(){
        return selectedTags;
      }
      
      function setSelectedTags(tags){
        selectedTags = tags;
      }

      function tagWithName(name){
        var result = _.where(tags, {name: name});
        if (result && result.length > 0){
          return result[0];
        }else{
          return;
        }
      }

      function filterMarkersByTag(tmpMarkers) {
        var markers = filterMarkers(tmpMarkers);
        return markers;
      }

      function filterMarkers(tmpMarkers) {
        if (service.getSelectedTags().length === 0){
          return tmpMarkers;
        }
        return tmpMarkers.filter(function(marker) {
          var tags = marker.myData.tags;
          if (tags.length === 0){
            return false;
          }
          return _.some(tags, function(tag) {
            return _.includes(service.getSelectedTags(), tag);
          });
        });
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('sensor', sensor);

    sensor.$inject = ['Restangular', 'timeUtils', 'sensorUtils'];
    function sensor(Restangular, timeUtils, sensorUtils) {
      var sensorTypes;
      callAPI().then(function(data) {
        setTypes(data);
      });

      var service = {
        callAPI: callAPI,
        setTypes: setTypes,
        getTypes: getTypes,
        getSensorsData: getSensorsData
      };
      return service;

      ////////////////

      function callAPI() {
        return Restangular.all('sensors').getList({'per_page': 1000});
      }

      function setTypes(sensorTypes) {
        sensorTypes = sensorTypes;
      }

      function getTypes() {
        return sensorTypes;
      }

      function getSensorsData(deviceID, sensorID, dateFrom, dateTo) {
        var rollup = sensorUtils.getRollup(dateFrom, dateTo);
        dateFrom = timeUtils.convertTime(dateFrom);
        dateTo = timeUtils.convertTime(dateTo);

        return Restangular.one('devices', deviceID).customGET('readings', {'from': dateFrom, 'to': dateTo, 'rollup': rollup, 'sensor_id': sensorID, 'all_intervals': true});
      }
    }
})();

(function() { 
  'use strict';

  angular.module('app.components')
    .factory('search', search);
    
    search.$inject = ['$http', 'Restangular'];
    function search($http, Restangular) {
      var service = {
        globalSearch: globalSearch
      };

      return service;

      /////////////////////////

      function globalSearch(query) {
    	  return Restangular.all('search').getList({q: query});
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('measurement', measurement);

  measurement.$inject = ['Restangular'];

  function measurement(Restangular) {

    var service = {
      getTypes: getTypes,
      getMeasurement: getMeasurement

    };
    return service;

    ////////////////


    function getTypes() {
      return Restangular.all('measurements').getList({'per_page': 1000});
    }

    function getMeasurement(mesID) {

      return Restangular.one('measurements', mesID).get();
    }
  }
})();
(function() {
	'use strict';

	angular.module('app.components')
	  .factory('geolocation', geolocation);

	  geolocation.$inject = ['$http', '$window'];
	  function geolocation($http, $window) {

      var service = {
				grantHTML5Geolocation: grantHTML5Geolocation,
				isHTML5GeolocationGranted: isHTML5GeolocationGranted
      };
      return service;

      ///////////////////////////


			function grantHTML5Geolocation(){
				$window.localStorage.setItem('smartcitizen.geolocation_granted', true);
			}

			function isHTML5GeolocationGranted(){
				return $window.localStorage
					.getItem('smartcitizen.geolocation_granted');
			}
	  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('file', file);

    file.$inject = ['Restangular', 'Upload'];
    function file(Restangular, Upload) {
      var service = {
        getCredentials: getCredentials,
        uploadFile: uploadFile,
        getImageURL: getImageURL
      };
      return service;

      ///////////////

      function getCredentials(filename) {
        var data = {
          filename: filename
        };
        return Restangular.all('me/avatar').post(data);
      }

      function uploadFile(fileData, key, policy, signature) {
        return Upload.upload({
          url: 'https://smartcitizen.s3-eu-west-1.amazonaws.com',
          method: 'POST',
          data: {
            key: key,
            policy: policy,
            signature: signature,
            AWSAccessKeyId: 'AKIAJ753OQI6JPSDCPHA',
            acl: 'public-read',
            "Content-Type": fileData.type || 'application/octet-stream',
            /*jshint camelcase: false */
            success_action_status: 200,
            file: fileData
          }
        });
      }

      function getImageURL(filename, size) {
        size = size === undefined ? 's101' : size;

        return 'https://images.smartcitizen.me/' + size + '/' + filename;
      }
    }
})();

(function() {
	'use strict';

	angular.module('app.components')
	  .factory('device', device);

    device.$inject = ['Restangular', '$window', 'timeUtils','$http', 'auth', '$rootScope'];
	  function device(Restangular, $window, timeUtils, $http, auth, $rootScope) {
      var worldMarkers;

      initialize();

	  	var service = {
        getDevices: getDevices,
        getAllDevices: getAllDevices,
        getDevice: getDevice,
        createDevice: createDevice,
        updateDevice: updateDevice,
        getWorldMarkers: getWorldMarkers,
        setWorldMarkers: setWorldMarkers,
        mailReadings: mailReadings,
        postReadings: postReadings,
				removeDevice: removeDevice,
        updateContext: updateContext
	  	};

	  	return service;

	  	//////////////////////////

      function initialize() {
        if(areMarkersOld()) {
          removeMarkers();
        }
      }

      function getDevices(location) {
      	var parameter = '';
      	parameter += location.lat + ',' + location.lng;
      	return Restangular.all('devices').getList({near: parameter, 'per_page': '100'});
      }

      function getAllDevices(forceReload) {
        if (forceReload || auth.isAuth()) {
          return getAllDevicesNoCached();
        } else {
          return getAllDevicesCached();
        }
      }

      function getAllDevicesCached() {
        return Restangular.all('devices/world_map')
          .getList()
          .then(function(fetchedDevices){
            return fetchedDevices.plain();
        });
      }

      function getAllDevicesNoCached() {
        return Restangular.all('devices/fresh_world_map')
          .getList()
          .then(function(fetchedDevices){
            return fetchedDevices.plain();
        });
      }

      function getDevice(id) {
        return Restangular.one('devices', id).get();
      }

      function createDevice(data) {
        return Restangular.all('devices').post(data);
      }

      function updateDevice(id, data) {
        return Restangular.one('devices', id).patch(data);
      }

      function getWorldMarkers() {
        return worldMarkers || ($window.localStorage.getItem('smartcitizen.markers') && JSON.parse($window.localStorage.getItem('smartcitizen.markers') ).data);
      }

      function setWorldMarkers(data) {
        var obj = {
          timestamp: new Date(),
          data: data
        };
        try {
          $window.localStorage.setItem('smartcitizen.markers', JSON.stringify(obj) );
        } catch (e) {
          console.log("Could not store markers in localstorage. skipping...");
        }
        worldMarkers = obj.data;
      }

      function getTimeStamp() {
        return ($window.localStorage.getItem('smartcitizen.markers') &&
					JSON.parse($window.localStorage
						.getItem('smartcitizen.markers') ).timestamp);
      }

      function areMarkersOld() {
        var markersDate = getTimeStamp();
        return !timeUtils.isWithin(1, 'minutes', markersDate);
      }

      function removeMarkers() {
        worldMarkers = null;
        $window.localStorage.removeItem('smartcitizen.markers');
      }

      function mailReadings(kit) {
      	return Restangular
          .one('devices', kit.id)
          .customGET('readings/csv_archive');
      }

			function postReadings(kit, readings) {
				return Restangular
          .one('devices', kit.id)
          .post('readings', readings);
			}

			function removeDevice(deviceID){
				return Restangular
          .one('devices', deviceID)
					.remove().then(function () {
            $rootScope.$broadcast('devicesContextUpdated');
          })
        ;
			}

      function updateContext (){
        return auth.updateUser().then(function(){
          removeMarkers();
          $rootScope.$broadcast('devicesContextUpdated');
        });
      }

	  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('auth', auth);

    auth.$inject = ['$location', '$window', '$state', 'Restangular',
      '$rootScope', 'AuthUser', '$timeout', 'alert', '$cookies'];
    function auth($location, $window, $state, Restangular, $rootScope, AuthUser,
       $timeout, alert, $cookies) {

    	var user = {};

      //wait until http interceptor is added to Restangular
      $timeout(function() {
    	  initialize();
      }, 100);

    	var service = {
        isAuth: isAuth,
        setCurrentUser: setCurrentUser,
        getCurrentUser: getCurrentUser,
        updateUser: updateUser,
        saveToken: saveToken,
        getToken: getToken,
        login: login,
        logout: logout,
        recoverPassword: recoverPassword,
        getResetPassword: getResetPassword,
        patchResetPassword: patchResetPassword,
        isAdmin: isAdmin
    	};
    	return service;

      //////////////////////////

      function initialize() {
        //console.log('---- AUTH INIT -----');
        setCurrentUser('appLoad');
      }

      //run on app initialization so that we can keep auth across different sessions
      // 1. Check if token in cookie exists. Return if it doesn't, user needs to login (and save a token to the cookie)
      // 2. Populate user.data with the response from the API.
      // 3. Broadcast logged in
      function setCurrentUser(time) {
        // TODO later: Should we check if token is expired here?
        if (getToken()) {
          user.token = getToken();
        }else{
          //console.log('token not found in cookie, returning');
          return;
        }

        return getCurrentUserFromAPI()
          .then(function(data) {
            // Save user.data also in localStorage. It is beeing used across the app.
            // Should it instead just be saved in the user object? Or is it OK to also have it in localStorage?
            $window.localStorage.setItem('smartcitizen.data', JSON.stringify(data.plain()) );

            var newUser = new AuthUser(data);
            //check sensitive information
            if(user.data && user.data.role !== newUser.role) {
              user.data = newUser;
              $location.path('/');
            }
            user.data = newUser;

            //console.log('-- User populated with data: ', user)
            // Broadcast happens 2x, so the user wont think he is not logged in.
            // The 2nd broadcast waits 3sec, because f.x. on the /kits/ page, the layout has not loaded when the broadcast is sent
            $rootScope.$broadcast('loggedIn');

            // used for app initialization
            if(time && time === 'appLoad') {
              //wait until navbar is loaded to emit event
              $timeout(function() {
                $rootScope.$broadcast('loggedIn', {time: 'appLoad'});
              }, 3000);
            } else {
              // used for login
              //$state.reload();
              $timeout(function() {
                alert.success('Login was successful');
                $rootScope.$broadcast('loggedIn', {});
              }, 2000);
            }
          });
      }

      // Called from device.service.js updateContext(), which is called from multiple /kit/ pages
      function updateUser() {
        return getCurrentUserFromAPI()
          .then(function(data) {
            // TODO: Should this update the token or user.data? Then it could instead call setCurrentUser?
            $window.localStorage.setItem('smartcitizen.data', JSON.stringify(data.plain()) );
            return getCurrentUser();
          });
      }

      function getCurrentUser() {
        user.token = getToken();
        user.data = $window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') ));
        return user;
      }

      // Should check if user.token exists - but now checks if the cookies.token exists.
      function isAuth() {
        // TODO: isAuth() is called from many different services BEFORE auth.init has run.
        // That means that the user.token is EMPTY, meaning isAuth will be false
        // We can cheat and just check the cookie, but we should NOT. Because auth.init should also check if the cookie is valid / expired
        // Ideally it should return !!user.token
        //return !!user.token;
        return !!getToken();
      }

      // LoginModal calls this after it receives the token from the API, and wants to save it in a cookie.
      function saveToken(token) {
        //console.log('saving Token to cookie:', token);
        $cookies.put('smartcitizen.token', token);
        setCurrentUser();
      }

      function getToken(){
        return $cookies.get('smartcitizen.token');
      }

      function login(loginData) {
        return Restangular.all('sessions').post(loginData);
      }

      function logout() {
        $cookies.remove('smartcitizen.token');
      }

      function getCurrentUserFromAPI() {
        return Restangular.all('').customGET('me');
      }

      function recoverPassword(data) {
        return Restangular.all('password_resets').post(data);
      }

      function getResetPassword(code) {
        return Restangular.one('password_resets', code).get();
      }
      function patchResetPassword(code, data) {
        return Restangular.one('password_resets', code).patch(data);
      }
      function isAdmin(userData) {
        return userData.role === 'admin';
      }
    }
})();

(function() {
  'use strict';

  /**
   * Unused directive. Double-check before removing.
   * 
   */
  angular.module('app.components')
    .directive('slide', slide)
    .directive('slideMenu', slideMenu);

    function slideMenu() {
      return {
        controller: controller,
        link: link
      };

      function link(scope, element) {
        scope.element = element;
      }

      function controller($scope) {
        $scope.slidePosition = 0;
        $scope.slideSize = 20;

        this.getTimesSlided = function() {
          return $scope.slideSize;
        };
        this.getPosition = function() {
          return $scope.slidePosition * $scope.slideSize;
        };
        this.decrementPosition = function() {
          $scope.slidePosition -= 1;
        };
        this.incrementPosition = function() {
          $scope.slidePosition += 1;
        };
        this.scrollIsValid = function(direction) {
          var scrollPosition = $scope.element.scrollLeft();
          console.log('scrollpos', scrollPosition);
          if(direction === 'left') {
            return scrollPosition > 0 && $scope.slidePosition >= 0;
          } else if(direction === 'right') {
            return scrollPosition < 300;
          }
        };
      }
    }

    slide.$inject = [];
    function slide() {
      return {
        link: link, 
        require: '^slide-menu',
        restrict: 'A',
        scope: {
          direction: '@'
        }
      };

      function link(scope, element, attr, slideMenuCtrl) {
        //select first sensor container
        var sensorsContainer = angular.element('.sensors_container');

        element.on('click', function() {

          if(slideMenuCtrl.scrollIsValid('left') && attr.direction === 'left') {
            slideMenuCtrl.decrementPosition();                       
            sensorsContainer.scrollLeft(slideMenuCtrl.getPosition());
            console.log(slideMenuCtrl.getPosition());  
          } else if(slideMenuCtrl.scrollIsValid('right') && attr.direction === 'right') {
            slideMenuCtrl.incrementPosition(); 
            sensorsContainer.scrollLeft(slideMenuCtrl.getPosition()); 
            console.log(slideMenuCtrl.getPosition()); 
          }          
        });
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .directive('showPopupInfo', showPopupInfo);

    /**
     * Used to show/hide explanation of sensor value at kit dashboard
     * 
     */
    showPopupInfo.$inject = [];
    function showPopupInfo() {
      return {
        link: link
      };

      //////


      function link(scope, elem) {
        elem.on('mouseenter', function() {
          angular.element('.sensor_data_description').css('display', 'inline-block');
        });
        elem.on('mouseleave', function() {
          angular.element('.sensor_data_description').css('display', 'none');
        });
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .directive('showPopup', showPopup);

    /**
     * Used on kit dashboard to open full sensor description
     */

    showPopup.$inject = [];
    function showPopup() {
      return {
        link: link
      };

      /////

      function link(scope, element) {
        element.on('click', function() {
          var text = angular.element('.sensor_description_preview').text();
          if(text.length < 140) {
            return;
          }
          angular.element('.sensor_description_preview').hide();
          angular.element('.sensor_description_full').show();
        });
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .directive('moveFilters', moveFilters);

    /**
     * Moves map filters when scrolling
     * 
     */
    moveFilters.$inject = ['$window', '$timeout'];
    function moveFilters($window, $timeout) {
      return {
        link: link
      };

      function link() {
        var chartHeight;
        $timeout(function() {
          chartHeight = angular.element('.kit_chart').height();          
        }, 1000);

        /*
        angular.element($window).on('scroll', function() {
          var windowPosition = document.body.scrollTop;
          if(chartHeight > windowPosition) {
            elem.css('bottom', 12 + windowPosition + 'px');
          }
        });
        */
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('layout', layout);


    function layout() {

      var kitHeight;

      var service = {
        setKit: setKit,
        getKit: getKit
      };
      return service;

      function setKit(height) {
        kitHeight = height;
      }

      function getKit() {
        return kitHeight;
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .directive('horizontalScroll', horizontalScroll);

  /**
   * Used to highlight and unhighlight buttons on the kit dashboard when scrolling horizontally
   * 
   */
  horizontalScroll.$inject = ['$window', '$timeout'];
  function horizontalScroll($window, $timeout) {
    return {
      link: link,
      restrict: 'A'
    };

    ///////////////////


    function link(scope, element) {

      element.on('scroll', function() {
        // horizontal scroll position
        var position = angular.element(this).scrollLeft();
        // real width of element
        var scrollWidth = this.scrollWidth;
        // visible width of element
        var width = angular.element(this).width();

        // if you cannot scroll, unhighlight both
        if(scrollWidth === width) {
          angular.element('.button_scroll_left').css('opacity', '0.5');
          angular.element('.button_scroll_right').css('opacity', '0.5');          
        }
        // if scroll is in the middle, highlight both
        if(scrollWidth - width > 2) {
          angular.element('.button_scroll_left').css('opacity', '1');          
          angular.element('.button_scroll_right').css('opacity', '1');
        }
        // if scroll is at the far right, unhighligh right button
        if(scrollWidth - width - position <= 2) {
          angular.element('.button_scroll_right').css('opacity', '0.5');
          return;
        }
        // if scroll is at the far left, unhighligh left button
        if(position === 0) { 
          angular.element('.button_scroll_left').css('opacity', '0.5');
          return;
        } 

        //set opacity back to normal otherwise
        angular.element('.button_scroll_left').css('opacity', '1');
        angular.element('.button_scroll_right').css('opacity', '1');
      });

      $timeout(function() {
        element.trigger('scroll');        
      });

      angular.element($window).on('resize', function() {
        $timeout(function() {
          element.trigger('scroll');
        }, 1000);
      });
    }
  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .directive('hidePopup', hidePopup);

    /**
     * Used on kit dashboard to hide popup with full sensor description
     * 
     */
    
    hidePopup.$inject = [];
    function hidePopup() {
      return {
        link: link
      };

      /////////////

      function link(scope, elem) {
        elem.on('mouseleave', function() {
          angular.element('.sensor_description_preview').show();
          angular.element('.sensor_description_full').hide();            
        });
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .directive('disableScroll', disableScroll);

    disableScroll.$inject = ['$timeout'];
    function disableScroll($timeout) {
      return {
        // link: {
          // pre: link
        // },
        compile: link,
        restrict: 'A',
        priority: 100000
      };


      //////////////////////

      function link(elem) {
        console.log('i', elem);
        // var select = elem.find('md-select'); 
        // angular.element(select).on('click', function() {
        elem.on('click', function() {
          console.log('e'); 
          angular.element(document.body).css('overflow', 'hidden');
          $timeout(function() {
            angular.element(document.body).css('overflow', 'initial'); 
          });
        });
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('animation', animation);

    /**
     * Used to emit events from rootscope.
     *
     * This events are then listened by $scope on controllers and directives that care about that particular event
     */

    animation.$inject = ['$rootScope'];
    function animation($rootScope) {

    	var service = {
        blur: blur,
        unblur: unblur,
        removeNav: removeNav,
        addNav: addNav,
        showChartSpinner: showChartSpinner,
        hideChartSpinner: hideChartSpinner,
        deviceLoaded: deviceLoaded,
        showPasswordRecovery: showPasswordRecovery,
        showLogin: showLogin,
        showSignup: showSignup,
        showPasswordReset: showPasswordReset,
        hideAlert: hideAlert,
        viewLoading: viewLoading,
        viewLoaded: viewLoaded,
        deviceWithoutData: deviceWithoutData,
        deviceIsPrivate: deviceIsPrivate,
        goToLocation: goToLocation,
        mapStateLoading: mapStateLoading,
        mapStateLoaded: mapStateLoaded
    	};
    	return service;

      //////////////

    	function blur() {
        $rootScope.$broadcast('blur');
    	}
    	function unblur() {
    	  $rootScope.$broadcast('unblur');
    	}
      function removeNav() {
        $rootScope.$broadcast('removeNav');
      }
      function addNav() {
        $rootScope.$broadcast('addNav');
      }
      function showChartSpinner() {
        $rootScope.$broadcast('showChartSpinner');
      }
      function hideChartSpinner() {
        $rootScope.$broadcast('hideChartSpinner');
      }
      function deviceLoaded(data) {
        $rootScope.$broadcast('deviceLoaded', data);
      }
      function showPasswordRecovery() {
        $rootScope.$broadcast('showPasswordRecovery');
      }
      function showLogin() {
        $rootScope.$broadcast('showLogin');
      }
      function showSignup() {
        $rootScope.$broadcast('showSignup');
      }
      function showPasswordReset() {
        $rootScope.$broadcast('showPasswordReset');
      }
      function hideAlert() {
        $rootScope.$broadcast('hideAlert');
      }
      function viewLoading() {
        $rootScope.$broadcast('viewLoading');
      }
      function viewLoaded() {
        $rootScope.$broadcast('viewLoaded');
      }
      function deviceWithoutData(data) {
        $rootScope.$broadcast('deviceWithoutData', data);
      }
      function deviceIsPrivate(data) {
        $rootScope.$broadcast('deviceIsPrivate', data);
      }
      function goToLocation(data) {
        $rootScope.$broadcast('goToLocation', data);
      }
      function mapStateLoading() {
        $rootScope.$broadcast('mapStateLoading');
      }
      function mapStateLoaded() {
        $rootScope.$broadcast('mapStateLoaded');
      }
    }
})();

(function() {
  'use strict';

    /**
     * TODO: Improvement These directives can be split up each one in a different file
     */

    angular.module('app.components')
      .directive('moveDown', moveDown)
      .directive('stick', stick)
      .directive('blur', blur)
      .directive('focus', focus)
      .directive('changeMapHeight', changeMapHeight)
      .directive('changeContentMargin', changeContentMargin)
      .directive('focusInput', focusInput);

    /**
     * It moves down kit section to ease the transition after the kit menu is sticked to the top
     *
     */
    moveDown.$inject = [];
    function moveDown() {

      function link(scope, element) {
        scope.$watch('moveDown', function(isTrue) {
          if(isTrue) {
            element.addClass('move_down');
          } else {
            element.removeClass('move_down');
          }
        });
      }

      return {
        link: link,
        scope: false,
        restrict: 'A'
      };
    }

    /**
     * It sticks kit menu when kit menu touchs navbar on scrolling
     *
     */
    stick.$inject = ['$window', '$timeout'];
    function stick($window, $timeout) {
      function link(scope, element) {
        var elementPosition = element[0].offsetTop;
        //var elementHeight = element[0].offsetHeight;
        var navbarHeight = angular.element('.stickNav').height();

        $timeout(function() {
          elementPosition = element[0].offsetTop;
          //var elementHeight = element[0].offsetHeight;
          navbarHeight = angular.element('.stickNav').height();
        }, 1000);


        angular.element($window).on('scroll', function() {
          var windowPosition = document.body.scrollTop;

          //sticking menu and moving up/down
          if(windowPosition + navbarHeight >= elementPosition) {
            element.addClass('stickMenu');
            scope.$apply(function() {
              scope.moveDown = true;
            });
          } else {
            element.removeClass('stickMenu');
            scope.$apply(function() {
              scope.moveDown = false;
            });
          }
        });
      }

      return {
        link: link,
        scope: false,
        restrict: 'A'
      };
    }

    /**
     * Unused directive. Double-check is not being used before removing it
     *
     */

    function blur() {

      function link(scope, element) {

        scope.$on('blur', function() {
          element.addClass('blur');
        });

        scope.$on('unblur', function() {
          element.removeClass('blur');
        });
      }

      return {
        link: link,
        scope: false,
        restrict: 'A'
      };
    }

    /**
     * Used to remove nav and unable scrolling when searching
     *
     */
    focus.$inject = ['animation'];
    function focus(animation) {
      function link(scope, element) {
        element.on('focusin', function() {
          animation.removeNav();
        });

        element.on('focusout', function() {
          animation.addNav();
        });

        var searchInput = element.find('input');
        searchInput.on('blur', function() {
          //enable scrolling on body when search input is not active
          angular.element(document.body).css('overflow', 'auto');
        });

        searchInput.on('focus', function() {
          angular.element(document.body).css('overflow', 'hidden');
        });
      }

      return {
        link: link
      };
    }

    /**
     * Changes map section based on screen size
     *
     */
    changeMapHeight.$inject = ['$document', 'layout', '$timeout'];
    function changeMapHeight($document, layout, $timeout) {
      function link(scope, element) {

        var screenHeight = $document[0].body.clientHeight;
        var navbarHeight = angular.element('.stickNav').height();

        // var overviewHeight = angular.element('.kit_overview').height();
        // var menuHeight = angular.element('.kit_menu').height();
        // var chartHeight = angular.element('.kit_chart').height();

        function resizeMap(){
          $timeout(function() {
            var overviewHeight = angular.element('.over_map').height();

            var objectsHeight = navbarHeight + overviewHeight;
            var objectsHeightPercentage = parseInt((objectsHeight * 100) / screenHeight);
            var mapHeightPercentage = 100 - objectsHeightPercentage;

            element.css('height', mapHeightPercentage + '%');

            var aboveTheFoldHeight = screenHeight - overviewHeight;
            angular
              .element('section[change-content-margin]')
              .css('margin-top', aboveTheFoldHeight + 'px');
          });
        }

        resizeMap();

        scope.element = element;

        scope.$on('resizeMapHeight',function(){
          resizeMap();
        });

      }

      return {
        link: link,
        scope: true,
        restrict: 'A'
      };
    }

    /**
     * Changes margin on kit section based on above-the-fold space left after map section is resize
     */

    changeContentMargin.$inject = ['layout', '$timeout', '$document'];
    function changeContentMargin(layout, $timeout, $document) {
      function link(scope, element) {
          var screenHeight = $document[0].body.clientHeight;

          var overviewHeight = angular.element('.over_map').height();

          var aboveTheFoldHeight = screenHeight - overviewHeight;
          element.css('margin-top', aboveTheFoldHeight + 'px');
      }

      return {
        link: link
      };
    }

    /**
     * Fixes autofocus for inputs that are inside modals
     *
     */
    focusInput.$inject = ['$timeout'];
    function focusInput($timeout) {
      function link(scope, elem) {
        $timeout(function() {
          elem.focus();
        });
      }
      return {
        link: link
      };
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .directive('activeButton', activeButton);

    /**
     * Used to highlight and unhighlight buttons on kit menu
     *
     * It attaches click handlers dynamically
     */

    activeButton.$inject = ['$timeout', '$window'];
    function activeButton($timeout, $window) {
      return {
        link: link,
        restrict: 'A'

      };

      ////////////////////////////

      function link(scope, element) {
        var childrens = element.children();
        var container;

        $timeout(function() {
          var navbar = angular.element('.stickNav');
          var kitMenu = angular.element('.kit_menu');
          var kitOverview = angular.element('.kit_overview');
          var kitDashboard = angular.element('.kit_chart');
          var kitDetails = angular.element('.kit_details');
          var kitOwner = angular.element('.kit_owner');
          var kitComments = angular.element('.kit_comments');

          container = {
            navbar: {
              height: navbar.height()
            },
            kitMenu: {
              height: kitMenu.height()
            },
            kitOverview: {
              height: kitOverview.height(),
              offset: kitOverview.offset().top,
              buttonOrder: 0
            },
            kitDashboard: {
              height: kitDashboard.height(),
              offset: kitDashboard.offset().top,
              buttonOrder: 40
            },
            kitDetails: {
              height: kitDetails.height(),
              offset: kitDetails.offset() ? kitDetails.offset().top : 0,
              buttonOrder: 1
            },
            kitOwner: {
              height: kitOwner.height(),
              offset: kitOwner.offset() ? kitOwner.offset().top : 0,
              buttonOrder: 2
            },
            kitComments: {
              height: kitComments.height(),
              offset: kitComments.offset() ? kitComments.offset().top : 0,
              buttonOrder: 3
            }
          };
        }, 1000);

        function scrollTo(offset) {
          if(!container) {
            return;
          }
          angular.element($window).scrollTop(offset - container.navbar.height - container.kitMenu.height);
        }

        function getButton(buttonOrder) {
          return childrens[buttonOrder];
        }

        function unHighlightButtons() {
          //remove border, fill and stroke of every icon
          var activeButton = angular.element('.md-button.button_active');
          if(activeButton.length) {
            activeButton.removeClass('button_active');

            var strokeContainer = activeButton.find('.stroke_container');
            strokeContainer.css('stroke', 'none');
            strokeContainer.css('stroke-width', '1');

            var fillContainer = strokeContainer.find('.fill_container');
            fillContainer.css('fill', '#FF8600');
          }
        }

        function highlightButton(button) {
          var clickedButton = angular.element(button);
          //add border, fill and stroke to every icon
          clickedButton.addClass('button_active');

          var strokeContainer = clickedButton.find('.stroke_container');
          strokeContainer.css('stroke', 'white');
          strokeContainer.css('stroke-width', '0.01px');

          var fillContainer = strokeContainer.find('.fill_container');
          fillContainer.css('fill', 'white');
        }

        //attach event handlers for clicks for every button and scroll to a section when clicked
        _.each(childrens, function(button) {
          angular.element(button).on('click', function() {
            var buttonOrder = angular.element(this).index();
            for(var elem in container) {
              if(container[elem].buttonOrder === buttonOrder) {
                var offset = container[elem].offset;
                scrollTo(offset);
                angular.element($window).trigger('scroll');
              }
            }
          });
        });

        var currentSection;

        //on scroll, check if window is on a section
        angular.element($window).on('scroll', function() {
          if(!container){ return; }

          var windowPosition = document.body.scrollTop;
          var appPosition = windowPosition + container.navbar.height + container.kitMenu.height;
          var button;
          if(currentSection !== 'none' && appPosition <= container.kitOverview.offset) {
            button = getButton(container.kitOverview.buttonOrder);
            unHighlightButtons();
            currentSection = 'none';
          } else if(currentSection !== 'overview' && appPosition >= container.kitOverview.offset && appPosition <= container.kitOverview.offset + container.kitOverview.height) {
            button = getButton(container.kitOverview.buttonOrder);
            unHighlightButtons();
            highlightButton(button);
            currentSection = 'overview';
          } else if(currentSection !== 'details' && appPosition >= container.kitDetails.offset && appPosition <= container.kitDetails.offset + container.kitDetails.height) {
            button = getButton(container.kitDetails.buttonOrder);
            unHighlightButtons();
            highlightButton(button);
            currentSection = 'details';
          } else if(currentSection !== 'owner' && appPosition >= container.kitOwner.offset && appPosition <= container.kitOwner.offset + container.kitOwner.height) {
            button = getButton(container.kitOwner.buttonOrder);
            unHighlightButtons();
            highlightButton(button);
            currentSection = 'owner';
          } else if(currentSection !== 'comments' && appPosition >= container.kitComments.offset && appPosition <= container.kitComments.offset + container.kitOwner.height) {
            button = getButton(container.kitComments.buttonOrder);
            unHighlightButtons();
            highlightButton(button);
            currentSection = 'comments';
          }
        });
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('UserProfileController', UserProfileController);

    UserProfileController.$inject = ['$scope', '$stateParams', '$location',
       'user', 'auth', 'userUtils', '$timeout', 'animation',
      'NonAuthUser', '$q', 'PreviewDevice'];
    function UserProfileController($scope, $stateParams, $location,
        user, auth, userUtils, $timeout, animation,
        NonAuthUser, $q, PreviewDevice) {

      var vm = this;
      var userID = parseInt($stateParams.id);

      vm.status = undefined;
      vm.user = {};
      vm.devices = [];
      vm.filteredDevices = [];
      vm.filterDevices = filterDevices;

      $scope.$on('loggedIn', function() {
        var authUser = auth.getCurrentUser().data;
        if( userUtils.isAuthUser(userID, authUser) ) {
          $location.path('/profile');
        }
      });

      initialize();

      //////////////////

      function initialize() {

        user.getUser(userID)
          .then(function(user) {
            vm.user = new NonAuthUser(user);

            if(!vm.user.devices.length) {
              return [];
            }

            $q.all(vm.devices = vm.user.devices.map(function(data){
              return new PreviewDevice(data);
            }))

          }).then(function(error) {
            if(error && error.status === 404) {
              $location.url('/404');
            }
          });

        $timeout(function() {
          setSidebarMinHeight();
          animation.viewLoaded();
        }, 500);
      }

      function filterDevices(status) {
        if(status === 'all') {
          status = undefined;
        }
        vm.status = status;
      }

      function setSidebarMinHeight() {
        var height = document.body.clientHeight / 4 * 3;
        angular.element('.profile_content').css('min-height', height + 'px');
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('UploadController', UploadController);

  UploadController.$inject = ['kit', '$state', '$stateParams', 'animation'];
  function UploadController(kit, $state, $stateParams, animation) {
    var vm = this;

    vm.kit = kit;

    vm.backToProfile = backToProfile;

    initialize();

    /////////////////

    function initialize() {
      animation.viewLoaded();
    }

    function backToProfile() {
      $state.transitionTo('layout.myProfile.kits', $stateParams,
      { reload: false,
        inherit: false,
        notify: true
      });
    }
  }
})();

(function(){
'use strict';



function parseDataForPost(csvArray) {
  /*
  EXPECTED PAYLOAD
  {
    "data": [{
      "recorded_at": "2016-06-08 10:30:00",
      "sensors": [{
        "id": 22,
        "value": 21
      }]
    }]
  }
  */
  const ids = csvArray[3];                      // save ids from the 4th header
  csvArray.splice(0,4);                         // remove useless headers
  return {
    data: csvArray.map((data) => {
      return {
        recorded_at: data.shift(),              // get the timestamp from the first column
        sensors: data.map((value, index) => {
          return {
            id: ids[index+1],                   // get ID of sensor from headers
            value: value
          };
        })
        .filter((sensor) => sensor.value && sensor.id)   // remove empty value or id
      };
    })
  };
}



controller.$inject = ['device', 'Papa', '$mdDialog', '$q'];
function controller(device, Papa, $mdDialog, $q) {
  var vm = this;
  vm.loadingStatus = false;
  vm.loadingProgress = 0;
  vm.loadingType = 'indeterminate';
  vm.csvFiles = [];
  vm.$onInit = function() {
    vm.kitLastUpdate = Math.floor(new Date(vm.kit.time).getTime() / 1000);
  }
  vm.onSelect = function() {
    vm.loadingStatus = true;
    vm.loadingType = 'indeterminate';
  }
  vm.change = function(files, invalidFiles) {
    let count = 0;
    vm.invalidFiles = invalidFiles;
    if (!files) { return; }
    vm.loadingStatus = true;
    vm.loadingType = 'determinate';
    vm.loadingProgress = 0;
    $q.all(
      files
      .filter((file) => vm._checkDuplicate(file))
      .map((file, index, filteredFiles) => {
        vm.csvFiles.push(file);
        return vm._analyzeData(file)
        .then((result) => {
          if (result.errors && result.errors.length > 0) {
            file.parseErrors = result.errors;
          }
          const lastTimestamp = Math.floor((new Date(result.data[result.data.length - 1][0])).getTime() / 1000);
          const isNew = vm.kitLastUpdate < lastTimestamp;
          file.checked = isNew;
          file.progress = null;
          file.isNew = isNew;
        })
        .then(() => {
          count += 1;
          vm.loadingProgress = (count)/filteredFiles.length * 100;

        });
      })
    ).then(() => {
      vm.loadingStatus = false;
    }).catch(() => {
      vm.loadingStatus = false;
    });
  }

  vm.haveSelectedFiles = function() {
    return vm.csvFiles && vm.csvFiles.some((file) => file.checked);
  };

  vm.haveSelectedNoFiles = function() {
    return vm.csvFiles && !vm.csvFiles.some((file) => file.checked);
  };

  vm.haveSelectedAllFiles = function() {
    return vm.csvFiles && vm.csvFiles.every((file) => file.checked);
  };

  vm.doAction = function() {
    switch (vm.action) {
      case 'selectAll':
        vm.selectAll(true);
        break;
      case 'deselectAll':
        vm.selectAll(false);
        break;
      case 'upload':
        vm.uploadData();
        break;
      case 'remove':
        vm.csvFiles = vm.csvFiles.filter((file) => !file.checked);
        break;
    }
    vm.action = null;
  };

  vm.selectAll = function(value) {
    vm.csvFiles.forEach((file) => { file.checked = value });
  };

  vm.removeFile = function(index) {
    vm.csvFiles.splice(index, 1);
  };
  vm._analyzeData = function(file) {
    file.progress = true;
    return Papa.parse(file, {
      delimiter: ',',
      dynamicTyping: true,
      worker: false,
      skipEmptyLines: true
    }).catch((err) => {
      file.progress = null;
      console('catch',err)
    });
  };

  vm._checkDuplicate = function(file) {
    if (vm.csvFiles.some((csvFile) => file.name === csvFile.name)) {
      file.$errorMessages = {};
      file.$errorMessages.duplicate = true;
      vm.invalidFiles.push(file);
      return false;
    } else {
      return true;
    }
  };

  vm.showErrorModal = function(csvFile) {
    $mdDialog.show({
      hasBackdrop: true,
      controller: ['$mdDialog',function($mdDialog) {
        this.parseErrors = csvFile.parseErrors;
        this.backEndErrors = csvFile.backEndErrors;
        this.cancel = function() { $mdDialog.hide(); };
      }],
      controllerAs: 'csvFile',
      templateUrl: 'app/components/upload/errorModal.html',
      clickOutsideToClose: true
    });
  }


  vm.uploadData = function() {
    vm.loadingStatus = true;
    vm.loadingType = 'indeterminate';
    vm.loadingProgress = 0;
    let count = 0;

    $q.all(
      vm.csvFiles
      .filter((file) => file.checked && !file.success)
      .map((file, index, filteredFiles) => {
        file.progress = true;
        return vm._analyzeData(file)
        .then((result) => parseDataForPost(result.data)) // TODO: Improvement remove
        // TODO: Improvement with workers
        .then((payload) => device.postReadings(vm.kit, payload))
        .then(() => {
          if (vm.loadingType === 'indeterminate') { vm.loadingType = 'determinate'; };
          file.success = true;
          file.progress = null;
          count += 1;
          vm.loadingProgress = (count)/filteredFiles.length * 100;
        })
        .catch((errors) =>  {
          console.log(errors);
          file.detailShowed = true;
          file.backEndErrors = errors;
          file.progress = null;
        });
      })
    ).then(() => {
      vm.loadingStatus = false;
    })
    .catch(() => {
      vm.loadingStatus = false;
    });
  }
};


angular.module('app.components')
  .component('scCsvUpload', {
    templateUrl: 'app/components/upload/csvUpload.html',
    controller: controller,
    bindings: {
      kit: '<'
    },
    controllerAs: 'vm'
  });
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('tagsController', tagsController);

  tagsController.$inject = ['tag', '$scope', 'device', '$state', '$q',
    'PreviewDevice', 'animation'
  ];

  function tagsController(tag, $scope, device, $state, $q, PreviewDevice,
    animation) {

    var vm = this;

    vm.selectedTags = tag.getSelectedTags();
    vm.markers = [];
    vm.kits = [];
    vm.percActive = 0;

    initialize();

    /////////////////////////////////////////////////////////

    function initialize() {
      if(vm.selectedTags.length === 0){
        $state.transitionTo('layout.home.kit');
      }

      if (device.getWorldMarkers()) {
        // If the user has already loaded a prev page and has markers in mem or localstorage
        updateSelectedTags();
      } else {
        // If the user is new we wait the map to load the markers
        $scope.$on('mapStateLoaded', function(event, data) {
          updateSelectedTags();
        });
      }

    }

    function updateSelectedTags(){

      vm.markers = tag.filterMarkersByTag(device.getWorldMarkers());

      var onlineMarkers = _.filter(vm.markers, isOnline);
      if (vm.markers.length === 0) {
        vm.percActive = 0;
      } else {
        vm.percActive = Math.floor(onlineMarkers.length / vm.markers.length *
          100);
      }

      animation.viewLoaded();

      getTaggedDevices()
        .then(function(res){
          vm.kits = res;
        });
    }


    function isOnline(marker) {
      return _.includes(marker.myData.labels, 'online');
    }

    function descLastUpdate(o) {
        return -new Date(o.last_reading_at).getTime();
    }

    function getTaggedDevices() {

      var deviceProm = _.map(vm.markers, getMarkerDevice);

      return $q.all(deviceProm)
        .then(function(devices) {
          return _.map(_.sortBy(devices, descLastUpdate), toPreviewDevice); // This sort is temp
        });
    }

    function toPreviewDevice(dev) {
      return new PreviewDevice(dev);
    }

    function getMarkerDevice(marker) {
      return device.getDevice(marker.myData.id);
    }
  }

})();

(function(){
  'use strict';
  angular.module('app.components')
    .directive('tag',tag);

  function tag(){
    return{
      restrict: 'E',
      scope:{
        tagName: '=',
        openTag: '&'
      },
      controller:function($scope, $state){
        $scope.openTag = function(){
          $state.go('layout.home.tags', {tags:[$scope.tagName]});
        };
      },
      template:'{{tagName}}',
      link: function(scope, element, attrs){
        element.addClass('tag');

        if(typeof(attrs.clickable) !== 'undefined'){
          element.bind('click', scope.openTag);
        }
      }
    };
  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('StoreModalController', StoreModalController);

    StoreModalController.$inject = ['$scope', '$mdDialog'];
    function StoreModalController($scope, $mdDialog) {

      $scope.cancel = function() {
        $mdDialog.hide();
      };
    }
})();

(function() {
  'use strict';

    angular.module('app.components')
      .directive('store', store);

    function store() {
      return {
        scope: {
          isLoggedin: '=logged'
        },
        restrict: 'A',
        controller: 'StoreController',
        controllerAs: 'vm',
        templateUrl: 'app/components/store/store.html'
      };
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('StoreController', StoreController);

  StoreController.$inject = ['$scope', '$mdDialog'];
  function StoreController($scope, $mdDialog) {

    $scope.showStore = showStore;

    $scope.$on('showStore', function() {
      showStore();
    });
    
    ////////////////

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

(function() {
  'use strict';

  angular.module('app.components')
    .controller('StaticController', StaticController);

  StaticController.$inject = ['$timeout', 'animation', '$mdDialog', '$location', '$anchorScroll'];

  function StaticController($timeout, animation, $mdDialog, $location, $anchorScroll) {
    var vm = this;

    vm.showStore = showStore;

    $anchorScroll.yOffset = 80;

    ///////////////////////

    initialize();

    //////////////////

    function initialize() {
      $timeout(function() {
        animation.viewLoaded();
        if($location.hash()){
          $anchorScroll();
        }
      }, 500);
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

(function() {
  'use strict';

  angular.module('app.components')
    .controller('SignupModalController', SignupModalController);

    SignupModalController.$inject = ['$scope', '$mdDialog', 'user',
      'alert', 'animation'];
    function SignupModalController($scope, $mdDialog, user,
      alert, animation ) {
      var vm = this;
      vm.answer = function(signupForm) {

        if (!signupForm.$valid){
          return;
        }

        $scope.waitingFromServer = true;
        user.createUser(vm.user)
          .then(function() {
            alert.success('Signup was successful');
            $mdDialog.hide();
          }).catch(function(err) {
            alert.error('Signup failed');
            $scope.errors = err.data.errors;
          })
          .finally(function() {
            $scope.waitingFromServer = false;
          });
      };
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.openLogin = function() {
        animation.showLogin();
        $mdDialog.hide();
      };
    }
})();

(function() {
  'use strict';

    angular.module('app.components')
      .directive('signup', signup);

    function signup() {
      return {
        scope: {
          show: '=',
        },
        restrict: 'A',
        controller: 'SignupController',
        controllerAs: 'vm',
        templateUrl: 'app/components/signup/signup.html'
      };
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('SignupController', SignupController);

    SignupController.$inject = ['$scope', '$mdDialog'];
    function SignupController($scope, $mdDialog) {
      var vm = this;

      vm.showSignup = showSignup;

      $scope.$on('showSignup', function() {
        showSignup();
      });
      ////////////////////////


      function showSignup() {
        $mdDialog.show({
          fullscreen: true,
          hasBackdrop: true,
          controller: 'SignupModalController',
          controllerAs: 'vm',
          templateUrl: 'app/components/signup/signupModal.html',
          clickOutsideToClose: true
        });
      }
    }
})();

(function() {
'use strict';


  angular.module('app.components')
    .directive('search', search);

  function search() {
    return {
      scope: true,
      restrict: 'E',
      templateUrl: 'app/components/search/search.html',
      controller: 'SearchController',
      controllerAs: 'vm'
    };
  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('SearchController', SearchController);

    SearchController.$inject = ['$scope', 'search', 'SearchResult', '$location', 'animation', 'SearchResultLocation'];
    function SearchController($scope, search, SearchResult, $location, animation, SearchResultLocation) {
      var vm = this;

      vm.searchTextChange = searchTextChange;
      vm.selectedItemChange = selectedItemChange;
      vm.querySearch = querySearch;

      ///////////////////

      function searchTextChange() {
      }

      function selectedItemChange(result) {
        if (!result) { return; }
        if(result.type === 'User') {
          $location.path('/users/' + result.id);
        } else if(result.type === 'Device') {
          $location.path('/kits/' + result.id);
        } else if (result.type === 'City'){
          animation.goToLocation({lat: result.lat, lng: result.lng, type: result.type, layer: result.layer});
        }
      }

      function querySearch(query) {
        if(query.length < 3) {
          return [];
        }

        return search.globalSearch(query)
          .then(function(data) {

            return data.map(function(object) {

              if(object.type === 'City' || object.type === 'Country') {
                return new SearchResultLocation(object);
              } else {
                return new SearchResult(object);
              }
            });
          });
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('PasswordResetController', PasswordResetController);

    PasswordResetController.$inject = ['$mdDialog', '$stateParams', '$timeout',
      'animation', '$location', 'alert', 'auth'];
    function PasswordResetController($mdDialog, $stateParams, $timeout,
      animation, $location, alert, auth) {
        
      var vm = this;
      vm.showForm = false;
      vm.form = {};
      vm.isDifferent = false;
      vm.answer = answer;

      initialize();
      ///////////

      function initialize() {
        $timeout(function() {
          animation.viewLoaded();
        }, 500);
        getUserData();
      }

      function getUserData() {
        auth.getResetPassword($stateParams.code)
          .then(function() {
            vm.showForm = true;
          })
          .catch(function() {
            alert.error('Wrong url');
            $location.path('/');
          });
      }

      function answer(data) {
        vm.waitingFromServer = true;
        vm.errors = undefined;

        if(data.newPassword === data.confirmPassword) {
          vm.isDifferent = false;
        } else {
          vm.isDifferent = true;
          return;
        }

        auth.patchResetPassword($stateParams.code, {password: data.newPassword})
          .then(function() {
            alert.success('Your data was updated successfully');
            $location.path('/profile');
          })
          .catch(function(err) {
            alert.error('Your data wasn\'t updated');
            vm.errors = err.data.errors;
          })
          .finally(function() {
            vm.waitingFromServer = false;
          });
      }
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('PasswordRecoveryModalController', PasswordRecoveryModalController);

    PasswordRecoveryModalController.$inject = ['$scope', 'animation', '$mdDialog', 'auth', 'alert'];
    function PasswordRecoveryModalController($scope, animation, $mdDialog, auth, alert) {

      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.recoverPassword = function() {
        $scope.waitingFromServer = true;
        var data = {
          /*jshint camelcase: false */
          email_or_username: $scope.input
        };

        auth.recoverPassword(data)
          .then(function() {
            alert.success('You were sent an email to recover your password');
            $mdDialog.hide();
          })
          .catch(function(err) {          
            alert.error('That username doesn\'t exist');
            $scope.errors = err.data;
          })
          .finally(function() {
            $scope.waitingFromServer = false;
          }); 
      };

      $scope.openSignup = function() {
        animation.showSignup();
        $mdDialog.hide();
      };
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('PasswordRecoveryController', PasswordRecoveryController);

    PasswordRecoveryController.$inject = ['auth', 'alert', '$mdDialog'];
    function PasswordRecoveryController(auth, alert, $mdDialog) {
      var vm = this;

      vm.waitingFromServer = false;
      vm.errors = undefined;
      vm.recoverPassword = recoverPassword;

      ///////////////

      function recoverPassword() {
        vm.waitingFromServer = true;
        vm.errors = undefined;
        
        var data = {
          username: vm.username
        };

        auth.recoverPassword(data)
          .then(function() {
            alert.success('You were sent an email to recover your password');
            $mdDialog.hide();
          })
          .catch(function(err) {          
            vm.errors = err.data.errors;
            if(vm.errors) {
              alert.error('That email/username doesn\'t exist');              
            } 
          })
          .finally(function() {
            vm.waitingFromServer = false;
          }); 
      }
    } 
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('MyProfileController', MyProfileController);

    MyProfileController.$inject = ['$scope', '$location', '$q', '$interval',
    'userData', 'AuthUser', 'user', 'auth', 'alert',
    'COUNTRY_CODES', '$timeout', 'file', 'animation',
    '$mdDialog', 'PreviewDevice', 'device', 'deviceUtils',
    'userUtils', '$filter', '$state', 'Restangular', '$window'];
    function MyProfileController($scope, $location, $q, $interval,
      userData, AuthUser, user, auth, alert,
      COUNTRY_CODES, $timeout, file, animation,
      $mdDialog, PreviewDevice, device, deviceUtils,
      userUtils, $filter, $state, Restangular, $window) {

      var vm = this;

      vm.unhighlightIcon = unhighlightIcon;

      //PROFILE TAB
      vm.formUser = {};
      vm.getCountries = getCountries;

      vm.user = userData;
      copyUserToForm(vm.formUser, vm.user);
      vm.searchText = vm.formUser.country;

      vm.updateUser = updateUser;
      vm.removeUser = removeUser;
      vm.uploadAvatar = uploadAvatar;

      //THIS IS TEMPORARY.
      // Will grow on to a dynamic API KEY management
      // with the new /accounts oAuth mgmt methods

      // The auth controller has not populated the `user` at this point,
      // so  user.token is undefined
      // This controller depends on auth has already been run.
      vm.user.token = auth.getToken();
      vm.addNewDevice = addNewDevice;

      //KITS TAB
      vm.devices = [];
      vm.deviceStatus = undefined;
      vm.removeDevice = removeDevice;
      vm.downloadData = downloadData;

      vm.filteredDevices = [];
      vm.dropdownSelected = undefined;

      //SIDEBAR
      vm.filterDevices = filterDevices;
      vm.filterTools = filterTools;

      vm.selectThisTab = selectThisTab;

      $scope.$on('loggedOut', function() {
        $location.path('/');
      });

      $scope.$on('devicesContextUpdated', function(){
        var userData = auth.getCurrentUser().data;
        if(userData){
          vm.user = userData;
        }
        initialize();
      });

      initialize();

      //////////////////

      function initialize() {

        startingTab();
        if(!vm.user.devices.length) {
          vm.devices = [];
          animation.viewLoaded();
        } else {

          vm.devices = vm.user.devices.map(function(data) {
            return new PreviewDevice(data);
          })

          $timeout(function() {
            mapWithBelongstoUser(vm.devices);
            filterDevices(vm.status);
            setSidebarMinHeight();
            animation.viewLoaded();
          });

        }
      }

      function filterDevices(status) {
        if(status === 'all') {
          status = undefined;
        }
        vm.deviceStatus = status;
        vm.filteredDevices = $filter('filterLabel')(vm.devices, vm.deviceStatus);
      }

      function filterTools(type) {
        if(type === 'all') {
          type = undefined;
        }
        vm.toolType = type;
      }

      function updateUser(userData) {
        if(userData.country) {
          _.each(COUNTRY_CODES, function(value, key) {
            if(value === userData.country) {
              /*jshint camelcase: false */
              userData.country_code = key;
              return;
            }
          });
        } else {
          userData.country_code = null;
        }

        user.updateUser(userData)
          .then(function(data) {
            var user = new AuthUser(data);
            _.extend(vm.user, user);
            auth.updateUser();
            vm.errors = {};
            alert.success('User updated');
          })
          .catch(function(err) {
            alert.error('User could not be updated ');
            vm.errors = err.data.errors;
          });
      }

      function removeUser() {
        var confirm = $mdDialog.confirm()
          .title('Delete your account?')
          .textContent('Are you sure you want to delete your account?')
          .ariaLabel('')
          .ok('delete')
          .cancel('cancel')
          .theme('primary')
          .clickOutsideToClose(true);

        $mdDialog.show(confirm)
          .then(function(){
            return Restangular.all('').customDELETE('me')
              .then(function(){
                alert.success('Account removed successfully. Redirecting you…');
                $timeout(function(){
                  auth.logout();
                  $state.transitionTo('landing');
                }, 2000);
              })
              .catch(function(){
                alert.error('Error occurred trying to delete your account.');
              });
          });
      }

      function selectThisTab(iconIndex, uistate){
        /* This looks more like a hack but we need to workout how to properly use md-tab with ui-router */

        highlightIcon(iconIndex);

        if ($state.current.name.includes('myProfileAdmin')){
            var transitionState = 'layout.myProfileAdmin.' + uistate;
            $state.transitionTo(transitionState, {id: userData.id});
        } else {
            var transitionState = 'layout.myProfile.' + uistate;
            $state.transitionTo(transitionState);
        }

      }

      function startingTab() {
        /* This looks more like a hack but we need to workout how to properly use md-tab with ui-router */

        var childState = $state.current.name.split('.').pop();

        switch(childState) {
          case 'user':
            vm.startingTab = 1;
            break;
          default:
            vm.startingTab = 0;
            break;
        }

      }

      function highlightIcon(iconIndex) {

        var icons = angular.element('.myProfile_tab_icon');

        _.each(icons, function(icon) {
          unhighlightIcon(icon);
        });

        var icon = icons[iconIndex];

        angular.element(icon).find('.stroke_container').css({'stroke': 'white', 'stroke-width': '0.01px'});
        angular.element(icon).find('.fill_container').css('fill', 'white');
      }

      function unhighlightIcon(icon) {
        icon = angular.element(icon);

        icon.find('.stroke_container').css({'stroke': 'none'});
        icon.find('.fill_container').css('fill', '#FF8600');
      }

      function setSidebarMinHeight() {
        var height = document.body.clientHeight / 4 * 3;
        angular.element('.profile_content').css('min-height', height + 'px');
      }

      function getCountries(searchText) {
        return _.filter(COUNTRY_CODES, createFilter(searchText));
      }

      function createFilter(searchText) {
        searchText = searchText.toLowerCase();
        return function(country) {
          country = country.toLowerCase();
          return country.indexOf(searchText) !== -1;
        };
      }

      function uploadAvatar(fileData) {
        if(fileData && fileData.length) {

          // TODO: Improvement Is there a simpler way to patch the image to the API and use the response?
          // Something like:
          //Restangular.all('/me').patch(data);
          // Instead of doing it manually like here:
          var fd = new FormData();
          fd.append('profile_picture', fileData[0]);
          Restangular.one('/me')
            .withHttpConfig({transformRequest: angular.identity})
            .customPATCH(fd, '', undefined, {'Content-Type': undefined})
            .then(function(resp){
              vm.user.profile_picture = resp.profile_picture;
            })
        }
      }

      function copyUserToForm(formData, userData) {
        var props = {username: true, email: true, city: true, country: true, country_code: true, url: true, constructor: false};

        for(var key in userData) {
          if(props[key]) {
            formData[key] = userData[key];
          }
        }
      }

      function mapWithBelongstoUser(devices){
        _.map(devices, addBelongProperty);
      }

      function addBelongProperty(device){
        device.belongProperty = deviceBelongsToUser(device);
        return device;
      }


      function deviceBelongsToUser(device){
        if(!auth.isAuth() || !device || !device.id) {
          return false;
        }
        var deviceID = parseInt(device.id);
        var userData = ( auth.getCurrentUser().data ) ||
          ($window.localStorage.getItem('smartcitizen.data') &&
          new AuthUser( JSON.parse(
            $window.localStorage.getItem('smartcitizen.data') )));

        var belongsToUser = deviceUtils.belongsToUser(userData.devices, deviceID);
        var isAdmin = userUtils.isAdmin(userData);

        return isAdmin || belongsToUser;
      }

      function downloadData(device){
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'DownloadModalController',
          controllerAs: 'vm',
          templateUrl: 'app/components/download/downloadModal.html',
          clickOutsideToClose: true,
          locals: {thisDevice:device}
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

      function removeDevice(deviceID) {
        var confirm = $mdDialog.confirm()
          .title('Delete this kit?')
          .textContent('Are you sure you want to delete this kit?')
          .ariaLabel('')
          .ok('DELETE')
          .cancel('Cancel')
          .theme('primary')
          .clickOutsideToClose(true);

        $mdDialog
          .show(confirm)
          .then(function(){
            device
              .removeDevice(deviceID)
              .then(function(){
                alert.success('Your kit was deleted successfully');
                device.updateContext();
              })
              .catch(function(){
                alert.error('Error trying to delete your kit.');
              });
          });
      }

      $scope.addDeviceSelector = addDeviceSelector;
      function addDeviceSelector(){
        $mdDialog.show({
          templateUrl: 'app/components/myProfile/addDeviceSelectorModal.html',
          clickOutsideToClose: true,
          multiple: true,
          controller: DialogController,
        });
      }

      function DialogController($scope, $mdDialog){
        $scope.cancel = function(){
          $mdDialog.cancel();
        };
      }

      function addNewDevice() {
        var confirm = $mdDialog.confirm()
          .title('Hey! Do you want to add a new kit?')
          .textContent('Please, notice this currently supports just the SCK 1.0 and SCK 1.1')
          .ariaLabel('')
          .ok('Ok')
          .cancel('Cancel')
          .theme('primary')
          .clickOutsideToClose(true);

        $mdDialog
          .show(confirm)
          .then(function(){
           $state.go('layout.kitAdd');
          });
      }


    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapTagModalController', MapTagModalController);

  MapTagModalController.$inject = ['$mdDialog', 'tag', 'selectedTags'];

  function MapTagModalController($mdDialog, tag, selectedTags) {

    var vm = this;

    vm.checks = {};

    vm.answer = answer;
    vm.hide = hide;
    vm.clear = clear;
    vm.cancel = cancel;
    vm.tags = [];

    init();

    ////////////////////////////////////////////////////////

    function init() {
      tag.getTags()
        .then(function(tags) {
          vm.tags = tags;

          _.forEach(selectedTags, select);

        });
    }

    function answer() {

      var selectedTags = _(vm.tags)
        .filter(isTagSelected)
        .value();
      $mdDialog.hide(selectedTags);
    }

    function hide() {
      answer();
    }

    function clear() {
      $mdDialog.hide(null);
    }

    function cancel() {
      answer();
    }

    function isTagSelected(tag) {
      return vm.checks[tag.name];
    }

    function select(tag){
      vm.checks[tag] = true;
    }
  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapFilterModalController', MapFilterModalController);

  MapFilterModalController.$inject = ['$mdDialog','selectedFilters', '$timeout'];

  function MapFilterModalController($mdDialog, selectedFilters, $timeout) {

    var vm = this;

    vm.checks = {};

    vm.answer = answer;
    vm.hide = hide;
    vm.clear = clear;
    vm.cancel = cancel;
    vm.toggle = toggle;

    vm.location = ['indoor', 'outdoor'];
    vm.status = ['online', 'offline'];
    vm.new = ['new'];

    vm.filters = [];

    init();

    ////////////////////////////////////////////////////////

    function init() {
      _.forEach(selectedFilters, select);
    }

    function answer() {
      vm.filters = vm.filters.concat(vm.location, vm.status, vm.new);
      var selectedFilters = _(vm.filters)
        .filter(isFilterSelected)
        .value();
      $mdDialog.hide(selectedFilters);
    }

    function hide() {
      answer();
    }

    function clear() {
      vm.filters = vm.filters.concat(vm.location, vm.status, vm.new);
      $mdDialog.hide(vm.filters);
    }

    function cancel() {
      answer();
    }

    function isFilterSelected(filter) {
      return vm.checks[filter];
    }

    function toggle(filters) {
      $timeout(function() {

        for (var i = 0; i < filters.length - 1; i++) {
          if (vm.checks[filters[i]] === false && vm.checks[filters[i]] === vm.checks[filters[i+1]]) {
            for (var n = 0; n < filters.length; n++) {
              vm.checks[filters[n]] = true;
            }
          }
        }

      });
    }

    function select(filter){
      vm.checks[filter] = true;
    }
  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);

    MapController.$inject = ['$scope', '$state', '$stateParams', '$timeout', 'device',
    '$mdDialog', 'leafletData', 'alert',
    'Marker', 'tag', 'animation', '$q'];
    function MapController($scope, $state, $stateParams, $timeout, device,
      $mdDialog, leafletData, alert, Marker, tag, animation, $q) {
      var vm = this;
      var updateType;
      var focusedMarkerID;

      vm.markers = [];

      var retinaSuffix = isRetina() ? '512' : '256';
      var retinaLegacySuffix = isRetina() ? '@2x' : '';

      var mapBoxToken = 'pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg';

      vm.layers = {
        baselayers: {
          osm: {
            name: 'OpenStreetMap',
            type: 'xyz',
            url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/' + retinaSuffix + '/{z}/{x}/{y}?access_token=' + mapBoxToken
          },
          legacy: {
            name: 'Legacy',
            type: 'xyz',
            url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}'+ retinaLegacySuffix +'.png' + '?access_token=' + mapBoxToken
          },
          sat: {
            name: 'Satellite',
            type: 'xyz',
            url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/' + retinaSuffix + '/{z}/{x}/{y}?access_token=' + mapBoxToken
          }
        },
        overlays: {
          devices: {
            name: 'Devices',
            type: 'markercluster',
            visible: true,
            layerOptions: {
              showCoverageOnHover: false
            }
          }
        }
      };

      vm.center = {
        lat: $stateParams.lat ? parseInt($stateParams.lat, 10) : 13.14950321154457,
        lng: $stateParams.lng ? parseInt($stateParams.lng, 10) : -1.58203125,
        zoom: $stateParams.zoom ? parseInt($stateParams.zoom, 10) : 2
      };

      vm.defaults = {
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        minZoom:2,
        worldCopyJump: true
      };

      vm.events = {
        map: {
          enable: ['dragend', 'zoomend', 'moveend', 'popupopen', 'popupclose',
          'mousedown', 'dblclick', 'click', 'touchstart', 'mouseup'],
          logic: 'broadcast'
        }
      };

      $scope.$on('leafletDirectiveMarker.click', function(event, data) {
        var id = undefined;
        var currentMarker = vm.markers[data.modelName];

        if(currentMarker) {
          id = currentMarker.myData.id;
        }

        vm.deviceLoading = true;
        vm.center.lat = data.leafletEvent.latlng.lat;
        vm.center.lng = data.leafletEvent.latlng.lng;

        if(id === parseInt($state.params.id)) {
          $timeout(function() {
            vm.deviceLoading = false;
          });
          return;
        }

        updateType = 'map';

        if ($state.$current.name === 'embbed') { return; }
        $state.go('layout.home.kit', {id: id});

        // angular.element('section.map').scope().$broadcast('resizeMapHeight');
      });


      $scope.$on('leafletDirectiveMarker.popupclose', function() {
        if(focusedMarkerID) {
          var marker = vm.markers[focusedMarkerID];
          if(marker) {
            vm.markers[focusedMarkerID].focus = false;
          }
        }
      });

      vm.readyForDevice = {
        device: false,
        map: false
      };

      $scope.$on('deviceLoaded', function(event, data) {
        vm.readyForDevice.device = data;
      });

      $scope.$watch('vm.readyForDevice', function() {
        if (vm.readyForDevice.device && vm.readyForDevice.map) {
          zoomDeviceAndPopUp(vm.readyForDevice.device);
        }
      }, true);

      $scope.$on('goToLocation', function(event, data) {
        goToLocation(data);
      });

      vm.filters = ['indoor', 'outdoor', 'online', 'offline'];

      vm.openFilterPopup = openFilterPopup;
      vm.openTagPopup = openTagPopup;
      vm.removeFilter = removeFilter;
      vm.removeTag = removeTag;
      vm.selectedTags = tag.getSelectedTags();
      vm.selectedFilters = ['indoor', 'outdoor', 'online', 'offline', 'new'];

      vm.checkAllFiltersSelected = checkAllFiltersSelected;

      initialize();

      /////////////////////

      function initialize() {

        vm.readyForDevice.map = false;

        $q.all([device.getAllDevices($stateParams.reloadMap)])
          .then(function(data){

            data = data[0];

            vm.markers = _.chain(data)
                .map(function(device) {
                  return new Marker(device);
                })
                .filter(function(marker) {
                  return !!marker.lng && !!marker.lat;
                })
                .tap(function(data) {
                  device.setWorldMarkers(data);
                })
                .value();

            var markersByIndex = _.keyBy(vm.markers, function(marker) {
              return marker.myData.id;
            });

            if($state.params.id && markersByIndex[parseInt($state.params.id)]){
              focusedMarkerID = markersByIndex[parseInt($state.params.id)]
                                .myData.id;
              vm.readyForDevice.map = true;
            } else {
              updateMarkers();
              vm.readyForDevice.map = true;
            }

          });
      }

      function zoomDeviceAndPopUp(data){

        if(updateType === 'map') {
          vm.deviceLoading = false;
          updateType = undefined;
          return;
        } else {
          vm.deviceLoading = true;
        }

        leafletData.getMarkers()
          .then(function(markers) {
            var currentMarker = _.find(markers, function(marker) {
              return data.id === marker.options.myData.id;
            });

            var id = data.id;

            leafletData.getLayers()
              .then(function(layers) {
                if(currentMarker){
                  layers.overlays.devices.zoomToShowLayer(currentMarker,
                    function() {
                      var selectedMarker = currentMarker;
                      if(selectedMarker) {
                        // Ensures the marker is not just zoomed but the marker is centered to improve UX
                        // The $timeout can be replaced by an event but tests didn't show good results
                        $timeout(function() {
                          vm.center.lat = selectedMarker.options.lat;
                          vm.center.lng = selectedMarker.options.lng;
                          selectedMarker.openPopup();
                          vm.deviceLoading = false;
                        }, 1000);
                      }
                    });
                } else {
                  leafletData.getMap().then(function(map){
                    map.closePopup();
                  });
                }
            });
         });

      }

      function checkAllFiltersSelected() {
        var allFiltersSelected = _.every(vm.filters, function(filterValue) {
          return _.includes(vm.selectedFilters, filterValue);
        });
        return allFiltersSelected;
      }

      function openFilterPopup() {
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'MapFilterModalController',
          controllerAs: 'vm',
          templateUrl: 'app/components/map/mapFilterModal.html',
          clickOutsideToClose: true,
          locals: {
            selectedFilters: vm.selectedFilters
          }
        })
        .then(function(selectedFilters) {
          updateType = 'map';
          vm.selectedFilters = selectedFilters;
          updateMapFilters();
        });
      }

      function openTagPopup() {
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'MapTagModalController',
          controllerAs: 'vm',
          templateUrl: 'app/components/map/mapTagModal.html',
          //targetEvent: ev,
          clickOutsideToClose: true,
          locals: {
            selectedTags: vm.selectedTags
          }
        })
        .then(function(selectedTags) {
          if (selectedTags && selectedTags.length > 0) {
            updateType = 'map';
            tag.setSelectedTags(_.map(selectedTags, 'name'));
            vm.selectedTags = tag.getSelectedTags();
            reloadWithTags();
          } else if (selectedTags === null) {
            reloadNoTags();
          }
        });
      }

      function updateMapFilters(){
          vm.selectedTags = tag.getSelectedTags();
          checkAllFiltersSelected();
          updateMarkers();
      }

      function removeFilter(filterName) {
        vm.selectedFilters = _.filter(vm.selectedFilters, function(el){
          return el !== filterName;
        });
        if(vm.selectedFilters.length === 0){
          vm.selectedFilters = vm.filters;
        }
        updateMarkers();
      }

     function filterMarkersByLabel(tmpMarkers) {
        return tmpMarkers.filter(function(marker) {
          var labels = marker.myData.labels;
          if (labels.length === 0 && vm.selectedFilters.length !== 0){
            return false;
          }
          return _.every(labels, function(label) {
            return _.includes(vm.selectedFilters, label);
          });
        });
      }

      function updateMarkers() {
        $timeout(function() {
          $scope.$apply(function() {
            var allMarkers = device.getWorldMarkers();

            var updatedMarkers = allMarkers;

            updatedMarkers = tag.filterMarkersByTag(updatedMarkers);
            updatedMarkers = filterMarkersByLabel(updatedMarkers);
            vm.markers = updatedMarkers;

            animation.mapStateLoaded();

            vm.deviceLoading = false;

            zoomOnMarkers();
          });
        });
      }

      function getZoomLevel(data) {
        // data.layer is an array of strings like ["establishment", "point_of_interest"]
        var zoom = 18;

        if(data.layer && data.layer[0]) {
          switch(data.layer[0]) {
            case 'point_of_interest':
              zoom = 18;
              break;
            case 'address':
              zoom = 18;
              break;
            case "establishment":
              zoom = 15;
              break;
            case 'neighbourhood':
              zoom = 13;
              break;
            case 'locality':
              zoom = 13;
              break;
            case 'localadmin':
              zoom = 9;
              break;
            case 'county':
              zoom = 9;
              break;
            case 'region':
              zoom = 8;
              break;
            case 'country':
              zoom = 7;
              break;
            case 'coarse':
              zoom = 7;
              break;
          }
        }

        return zoom;
      }

      function isRetina(){
        return ((window.matchMedia &&
          (window.matchMedia('only screen and (min-resolution: 192dpi), ' +
            'only screen and (min-resolution: 2dppx), only screen and ' +
            '(min-resolution: 75.6dpcm)').matches ||
          window.matchMedia('only screen and (-webkit-min-device-pixel-ra' +
            'tio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only' +
            ' screen and (min--moz-device-pixel-ratio: 2), only screen and ' +
            '(min-device-pixel-ratio: 2)').matches)) ||
          (window.devicePixelRatio && window.devicePixelRatio >= 2)) &&
          /(iPad|iPhone|iPod|Apple)/g.test(navigator.userAgent);
      }

      function goToLocation(data){
        // This ensures the action runs after the event is registered
        $timeout(function() {
          vm.center.lat = data.lat;
          vm.center.lng = data.lng;
          vm.center.zoom = getZoomLevel(data);
        });
      }

      function removeTag(tagName){
        tag.setSelectedTags(_.filter(vm.selectedTags, function(el){
          return el !== tagName;
        }));

        vm.selectedTags = tag.getSelectedTags();

        if(vm.selectedTags.length === 0){
          reloadNoTags();
        } else {
          reloadWithTags();
        }

      }

      function zoomOnMarkers(){
        $timeout(function() {
          if(vm.markers && vm.markers.length > 0) {
              leafletData.getMap().then(function(map){
                  var bounds = L.latLngBounds(vm.markers);
                  map.fitBounds(bounds);
              });
          } else {
            alert.error('No markers found with those filters', 5000);
          }
        });
      }

      function reloadWithTags(){
        $state.transitionTo('layout.home.tags', {tags: vm.selectedTags}, {reload: true});
      }

      function reloadNoTags(){
        $state.transitionTo('layout.home.kit');
      }

    }

})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('LoginModalController', LoginModalController);

    LoginModalController.$inject = ['$scope', '$mdDialog', 'auth', 'animation'];
    function LoginModalController($scope, $mdDialog, auth, animation) {
      const vm = this;
      $scope.answer = function(answer) {
        $scope.waitingFromServer = true;
        auth.login(answer)
          .then(function(data) {
            /*jshint camelcase: false */
            var token = data.access_token;
            auth.saveToken(token);
            $mdDialog.hide();
          })
          .catch(function(err) {
            vm.errors = err.data;
          })
          .finally(function() {
            $scope.waitingFromServer = false;
          });
      };
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.hide();
      };

      $scope.openSignup = function() {
        animation.showSignup();
        $mdDialog.hide();
      };

      $scope.openPasswordRecovery = function() {
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'PasswordRecoveryModalController',
          templateUrl: 'app/components/passwordRecovery/passwordRecoveryModal.html',
          clickOutsideToClose: true
        });

        $mdDialog.hide();
      };
    }
})();

(function() {
  'use strict';

    angular.module('app.components')
      .directive('login', login);

    function login() {
      return {
        scope: {
          show: '='
        },
        restrict: 'A',
        controller: 'LoginController',
        controllerAs: 'vm',
        templateUrl: 'app/components/login/login.html'
      };
    }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$mdDialog'];
  function LoginController($scope, $mdDialog) {

    $scope.showLogin = showLogin;

    $scope.$on('showLogin', function() {
      showLogin();
    });

    ////////////////

    function showLogin() {
      $mdDialog.show({
        hasBackdrop: true,
        fullscreen: true,
        controller: 'LoginModalController',
        controllerAs: 'vm',
        templateUrl: 'app/components/login/loginModal.html',
        clickOutsideToClose: true
      });
    }

  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('LandingController', LandingController);

  LandingController.$inject = ['$timeout', 'animation', '$mdDialog', '$location', '$anchorScroll'];

  function LandingController($timeout, animation, $mdDialog, $location, $anchorScroll) {
    var vm = this;

    vm.showStore = showStore;
    vm.goToHash = goToHash;

    ///////////////////////

    initialize();

    //////////////////

    function initialize() {
      $timeout(function() {
        animation.viewLoaded();
        if($location.hash()) {
          $anchorScroll();
        }
      }, 500);
    }

    function goToHash(hash){
      $location.hash(hash);
      $anchorScroll();
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

(function() {
  'use strict';

  angular.module('app.components')
    .controller('LayoutController', LayoutController);

    LayoutController.$inject = ['$mdSidenav','$mdDialog', '$location', '$state', '$scope', '$transitions', 'auth', 'animation', '$timeout', 'DROPDOWN_OPTIONS_COMMUNITY', 'DROPDOWN_OPTIONS_USER'];
    function LayoutController($mdSidenav, $mdDialog, $location, $state, $scope, $transitions, auth, animation, $timeout, DROPDOWN_OPTIONS_COMMUNITY, DROPDOWN_OPTIONS_USER) {
      var vm = this;

      vm.navRightLayout = 'space-around center';

      $scope.toggleRight = buildToggler('right');

      function buildToggler(componentId) {
        return function() {
          $mdSidenav(componentId).toggle();
        };
      }

      // listen for any login event so that the navbar can be updated
      $scope.$on('loggedIn', function(ev, options) {
        // if(options && options.time === 'appLoad') {
        //   $scope.$apply(function() {
        //     vm.isLoggedin = true;
        //     vm.isShown = true;
        //     angular.element('.nav_right .wrap-dd-menu').css('display', 'initial');
        //     vm.currentUser = auth.getCurrentUser().data;
        //     vm.dropdownOptions[0].text = 'Hello, ' + vm.currentUser.username;
        //     vm.navRightLayout = 'end center';
        //   });
        // } else {
        //   vm.isLoggedin = true;
        //   vm.isShown = true;
        //   angular.element('.nav_right .wrap-dd-menu').css('display', 'initial');
        //   vm.currentUser = auth.getCurrentUser().data;
        //   vm.dropdownOptions[0].text = 'Hello, ' + vm.currentUser.username;
        //   vm.navRightLayout = 'end center';
        // }

        vm.isLoggedin = true;
        vm.isShown = true;
        angular.element('.nav_right .wrap-dd-menu').css('display', 'initial');
        vm.currentUser = auth.getCurrentUser().data;
        vm.dropdownOptions[0].text = 'Hi, ' + vm.currentUser.username + '!';
        vm.navRightLayout = 'end center';
        if(!$scope.$$phase) {
          $scope.$digest();
        }
      });

      // listen for logout events so that the navbar can be updated
      $scope.$on('loggedOut', function() {
        vm.isLoggedIn = false;
        vm.isShown = true;
        angular.element('navbar .wrap-dd-menu').css('display', 'none');
        vm.navRightLayout = 'space-around center';
      });


      vm.isShown = true;
      vm.isLoggedin = false;
      vm.logout = logout;

      vm.dropdownOptions = DROPDOWN_OPTIONS_USER;
      vm.dropdownSelected = undefined;

      vm.dropdownOptionsCommunity = DROPDOWN_OPTIONS_COMMUNITY;
      vm.dropdownSelectedCommunity = undefined;

      $scope.$on('removeNav', function() {
          vm.isShown = false;
      });

      $scope.$on('addNav', function() {
          vm.isShown = true;
      });

      initialize();

      //////////////////

      function initialize() {
        $timeout(function() {
          var hash = $location.search();
          if(hash.signup) {
            animation.showSignup();
          } else if(hash.login) {
            animation.showLogin();
          } else if(hash.passwordRecovery) {
            animation.showPasswordRecovery();
          }
        }, 1000);
      }

      function logout() {
        auth.logout();
        vm.isLoggedin = false;
      }
    }
})();

(function(){
  'use strict';
  angular.module('app.components')
    .directive('kitList',kitList);

  function kitList(){
    return{
      restrict:'E',
      scope:{
        devices:'=devices',
        actions: '=actions'
      },
      controllerAs:'vm',
      templateUrl:'app/components/kitList/kitList.html'
    };
  }
})();

(function() {
	'use strict';

	angular.module('app.components')
	  .controller('HomeController', HomeController);

	  function HomeController() {
	  }
})();
(function (){
	'use strict';

	angular.module('app.components')
		.controller('DownloadModalController', DownloadModalController);

	DownloadModalController.$inject = ['thisDevice', 'device', '$mdDialog'];

	function DownloadModalController(thisDevice, device, $mdDialog) {
		var vm = this;

		vm.device = thisDevice;
		vm.download = download;
		vm.cancel = cancel;

		////////////////////////////

		function download(){
			device.mailReadings(vm.device)
				.then(function (){
					$mdDialog.hide();
				}).catch(function(err){
					$mdDialog.cancel(err);
				});
		}

		function cancel(){
			$mdDialog.cancel();
		}
	}

})();

(function(){
'use strict';

angular.module('app.components')
  .directive('cookiesLaw', cookiesLaw);


cookiesLaw.$inject = ['$cookies'];

function cookiesLaw($cookies) {
  return {
    template:
      '<div class="cookies-policy_container" ng-hide="isCookieValidBool">' +
      'This site uses cookies to offer you a better experience.  ' +
      ' <a href="" ng-click="acceptCookie(true)">Accept</a> or' +
      ' <a ui-sref="layout.policy">Learn More.</a> ' +
      '</div>',
    controller: function($scope) {

      var init = function(){
        $scope.isCookieValid();
      }

      // Helpers to debug
      // You can also use `document.cookie` in the browser dev console.
      //console.log($cookies.getAll());

      $scope.isCookieValid = function() {
        // Use a boolean for the ng-hide, because using a function with ng-hide
        // is considered bad practice. The digest cycle will call it multiple
        // times, in our case around 240 times.
        $scope.isCookieValidBool = ($cookies.get('consent') === 'true')
      }

      $scope.acceptCookie = function() {
        //console.log('Accepting cookie...');
        var today = new Date();
        var expireDate = new Date(today);
        expireDate.setMonth(today.getMonth() + 6);

        $cookies.put('consent', true, {'expires' : expireDate.toUTCString()} );

        // Trigger the check again, after we click
        $scope.isCookieValid();
      };

      init();

    }
  };
}


})();

(function() {
  'use strict';

  angular.module('app.components')
    .directive('chart', chart);

    chart.$inject = ['sensor', 'animation', '$timeout', '$window'];
    function chart(sensor, animation, $timeout, $window) {
      var margin, width, height, svg, xScale, yScale0, yScale1, xAxis, yAxisLeft, yAxisRight, dateFormat, areaMain, valueLineMain, areaCompare, valueLineCompare, focusCompare, focusMain, popup, dataMain, colorMain, yAxisScale, unitMain, popupContainer;

      return {
        link: link,
        restrict: 'A',
        scope: {
          chartData: '='
        }
      };

      function link(scope, elem) {

        $timeout(function() {
          createChart(elem[0]);
        }, 0);

        var lastData = {};

        // on window resize, it re-renders the chart to fit into the new window size
        angular.element($window).on('resize', function() {
          createChart(elem[0]);
          updateChartData(lastData.data, {type: lastData.type, container: elem[0], color: lastData.color, unit: lastData.unit});
        });

        scope.$watch('chartData', function(newData) {
          if(!newData) {
            return;
          }

          if(newData !== undefined) {
            // if there's data for 2 sensors
            if(newData[0] && newData[1]) {
              var sensorDataMain = newData[0].data;
              // we could get some performance from saving the map in the showKit controller on line 218 and putting that logic in here
              var dataMain = sensorDataMain.map(function(dataPoint) {
                return {
                  date: dateFormat(dataPoint.time),
                  count: dataPoint && dataPoint.count,
                  value: dataPoint && dataPoint.value
                };
              });
              // sort data points by date
              dataMain.sort(function(a, b) {
                return a.date - b.date;
              });

              var sensorDataCompare = newData[1].data;
              var dataCompare = sensorDataCompare.map(function(dataPoint) {
                return {
                  date: dateFormat(dataPoint.time),
                  count: dataPoint && dataPoint.count,
                  value: dataPoint && dataPoint.value
                };
              });

              dataCompare.sort(function(a, b) {
                return a.date - b.date;
              });

              var data = [dataMain, dataCompare];
              var colors = [newData[0].color, newData[1].color];
              var units = [newData[0].unit, newData[1].unit];
              // saves everything in case we need to re-render
              lastData = {
                data: data,
                type: 'both',
                color: colors,
                unit: units
              };
              // call function to update the chart with the new data
              updateChartData(data, {type: 'both', container: elem[0], color: colors, unit: units });
            // if only data for the main sensor
            } else if(newData[0]) {

              var sensorData = newData[0].data;
              /*jshint -W004 */
              var data = sensorData.map(function(dataPoint) {
                return {
                  date: dateFormat(dataPoint.time),
                  count: dataPoint && dataPoint.count,
                  value: dataPoint && dataPoint.value
                };
              });

              data.sort(function(a, b) {
                return a.date - b.date;
              });

              var color = newData[0].color;
              var unit = newData[0].unit;

              lastData = {
                data: data,
                type: 'main',
                color: color,
                unit: unit
              };

              updateChartData(data, {type: 'main', container: elem[0], color: color, unit: unit });
            }
            animation.hideChartSpinner();
          }
        });
      }

      // creates the container that is re-used across different sensor charts
      function createChart(elem) {
        d3.select(elem).selectAll('*').remove();

        margin = {top: 20, right: 12, bottom: 20, left: 42};
        width = elem.clientWidth - margin.left - margin.right;
        height = elem.clientHeight - margin.top - margin.bottom;

        xScale = d3.time.scale().range([0, width]);
        xScale.tickFormat("%Y-%m-%d %I:%M:%S");
        yScale0 = d3.scale.linear().range([height, 0]);
        yScale1 = d3.scale.linear().range([height, 0]);
        yAxisScale = d3.scale.linear().range([height, 0]);

        dateFormat = d3.time.format('%Y-%m-%dT%H:%M:%S').parse;//d3.time.format('%Y-%m-%dT%X.%LZ').parse; //'YYYY-MM-DDTHH:mm:ssZ'

        xAxis = d3.svg.axis()
          .scale(xScale)
          .orient('bottom')
          .ticks(5);

        yAxisLeft = d3.svg.axis()
          .scale(yScale0)
          .orient('left')
          .ticks(5);

        yAxisRight = d3.svg.axis()
          .scale(yScale1)
          .orient('right')
          .ticks(5);

        areaMain = d3.svg.area()
          .defined(function(d) {return d.value != null })
          .interpolate('linear')
          .x(function(d) { return xScale(d.date); })
          .y0(height)
          .y1(function(d) { return yScale0(d.count); });

        valueLineMain = d3.svg.line()
          .defined(function(d) {return d.value != null })
          .interpolate('linear')
          .x(function(d) { return xScale(d.date); })
          .y(function(d) { return yScale0(d.count); });

        areaCompare = d3.svg.area()
          .defined(function(d) {return d.value != null })
          .interpolate('linear')
          .x(function(d) { return xScale(d.date); })
          .y0(height)
          .y1(function(d) { return yScale1(d.count); });

        valueLineCompare = d3.svg.line()
          .defined(function(d) {return d.value != null })
          .interpolate('linear')
          .x(function(d) { return xScale(d.date); })
          .y(function(d) { return yScale1(d.count); });

        svg = d3
          .select(elem)
          .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
          .append('g')
            .attr('transform', 'translate(' + (margin.left - margin.right) + ',' + margin.top + ')');
      }
      // calls functions depending on type of chart
      function updateChartData(newData, options) {
        if(options.type === 'main') {
          updateChartMain(newData, options);
        } else if(options.type === 'both') {
          updateChartCompare(newData, options);
        }
      }
      // function in charge of rendering when there's data for 1 sensor
      function updateChartMain(data, options) {
        xScale.domain(d3.extent(data, function(d) { return d.date; }));
        yScale0.domain([(d3.min(data, function(d) { return d.count; })) * 0.8, (d3.max(data, function(d) { return d.count; })) * 1.2]);

        svg.selectAll('*').remove();

        //Add the area path
        svg.append('path')
          .datum(data)
          .attr('class', 'chart_area')
          .attr('fill', options.color)
          .attr('d', areaMain);

        // Add the valueline path.
        svg.append('path')
          .attr('class', 'chart_line')
          .attr('stroke', options.color)
          .attr('d', valueLineMain(data));

        // Add the X Axis
        svg.append('g')
          .attr('class', 'axis x')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

        // Add the Y Axis
        svg.append('g')
          .attr('class', 'axis y_left')
          .call(yAxisLeft);

        // Draw the x Grid lines
        svg.append('g')
          .attr('class', 'grid')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xGrid()
            .tickSize(-height, 0, 0)
            .tickFormat('')
          );

        // Draw the y Grid lines
        svg.append('g')
          .attr('class', 'grid')
          .call(yGrid()
            .tickSize(-width, 0, 0)
            .tickFormat('')
          );

        focusMain = svg.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        focusMain.append('circle')
          .style('stroke', options.color)
          .attr('r', 4.5);

        var popupWidth = 84;
        var popupHeight = 46;

        popup = svg.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        popupContainer = popup.append('rect')
          .attr('width', popupWidth)
          .attr('height', popupHeight)
          .attr('transform', function() {
            var result = 'translate(-42, 5)';

            return result;
          })
          .style('stroke', 'grey')
          .style('stroke-width', '0.5')
          .style('fill', 'white');

        var text = popup.append('text')
          .attr('class', '');

        var textMain = text.append('tspan')
          .attr('class', 'popup_main')
          .attr('text-anchor', 'start')
          .attr('x', -popupWidth / 2)
          .attr('dx', 8)
          .attr('y', popupHeight / 2)
          .attr('dy', 3);

          textMain.append('tspan')
          .attr('class', 'popup_value');

          textMain.append('tspan')
          .attr('class', 'popup_unit')
          .attr('dx', 5);

        text.append('tspan')
          .attr('class', 'popup_date')
          .attr('x', -popupWidth / 2)
          .attr('dx', 8)
          .attr('y', popupHeight - 2)
          .attr('dy', 0)
          .attr( 'text-anchor', 'start' );

        svg.append('rect')
          .attr('class', 'overlay')
          .attr('width', width)
          .attr('height', height)
          .on('mouseover', function() {
            popup.style('display', null);
            focusMain.style('display', null);
          })
          .on('mouseout', function() {
            popup.style('display', 'none');
            focusMain.style('display', 'none');
          })
          .on('mousemove', mousemove);



        function mousemove() {
          var bisectDate = d3.bisector(function(d) { return d.date; }).left;

          var x0 = xScale.invert(d3.mouse(this)[0]);
          var i = bisectDate(data, x0, 1);
          var d0 = data[i - 1];
          var d1 = data[i];
          var d = d1 && (x0 - d0.date > d1.date - x0) ? d1 : d0;

          focusMain.attr('transform', 'translate(' + xScale(d.date) + ', ' + yScale0(d.count) + ')');
          var popupText = popup.select('text');
          var textMain = popupText.select('.popup_main');
          var valueMain = textMain.select('.popup_value').text(parseValue(d.value));
          var unitMain = textMain.select('.popup_unit').text(options.unit);
          var date = popupText.select('.popup_date').text(parseTime(d.date));

          var textContainers = [
            textMain,
            date
          ];

          var popupWidth = resizePopup(popupContainer, textContainers);

          if(xScale(d.date) + 80 + popupWidth > options.container.clientWidth) {
            popup.attr('transform', 'translate(' + (xScale(d.date) - 120) + ', ' + (d3.mouse(this)[1] - 20) + ')');
          } else {
            popup.attr('transform', 'translate(' + (xScale(d.date) + 80) + ', ' + (d3.mouse(this)[1] - 20) + ')');
          }
        }
      }

      // function in charge of rendering when there's data for 2 sensors
      function updateChartCompare(data, options) {
        xScale.domain(d3.extent(data[0], function(d) { return d.date; }));
        yScale0.domain([(d3.min(data[0], function(d) { return d.count; })) * 0.8, (d3.max(data[0], function(d) { return d.count; })) * 1.2]);
        yScale1.domain([(d3.min(data[1], function(d) { return d.count; })) * 0.8, (d3.max(data[1], function(d) { return d.count; })) * 1.2]);

        svg.selectAll('*').remove();

        //Add both area paths
        svg.append('path')
          .datum(data[0])
          .attr('class', 'chart_area')
          .attr('fill', options.color[0])
          .attr('d', areaMain);

        svg.append('path')
          .datum(data[1])
          .attr('class', 'chart_area')
          .attr('fill', options.color[1])
          .attr('d', areaCompare);

        // Add both valueline paths.
        svg.append('path')
          .attr('class', 'chart_line')
          .attr('stroke', options.color[0])
          .attr('d', valueLineMain(data[0]));

        svg.append('path')
          .attr('class', 'chart_line')
          .attr('stroke', options.color[1])
          .attr('d', valueLineCompare(data[1]));

        // Add the X Axis
        svg.append('g')
          .attr('class', 'axis x')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

        // Add both Y Axis
        svg.append('g')
          .attr('class', 'axis y_left')
          .call(yAxisLeft);

        svg.append('g')
          .attr('class', 'axis y_right')
          .attr('transform', 'translate(' + width + ' ,0)')
          .call(yAxisRight);

        // Draw the x Grid lines
        svg.append('g')
          .attr('class', 'grid')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xGrid()
            .tickSize(-height, 0, 0)
            .tickFormat('')
          );

        // Draw the y Grid lines
        svg.append('g')
          .attr('class', 'grid')
          .call(yGrid()
            .tickSize(-width, 0, 0)
            .tickFormat('')
          );

        focusCompare = svg.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        focusMain = svg.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        focusCompare.append('circle')
          .style('stroke', options.color[1])
          .attr('r', 4.5);

        focusMain.append('circle')
          .style('stroke', options.color[0])
          .attr('r', 4.5);

        var popupWidth = 84;
        var popupHeight = 75;

        popup = svg.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        popupContainer = popup.append('rect')
          .attr('width', popupWidth)
          .attr('height', popupHeight)
          .style('min-width', '40px')
          .attr('transform', function() {
            var result = 'translate(-42, 5)';

            return result;
          })
          .style('stroke', 'grey')
          .style('stroke-width', '0.5')
          .style('fill', 'white');

        popup.append('rect')
          .attr('width', 8)
          .attr('height', 2)
          .attr('transform', function() {
            return 'translate(' + (-popupWidth / 2 + 4).toString() + ', 20)';
          })
          .style('fill', options.color[0]);

        popup.append('rect')
          .attr('width', 8)
          .attr('height', 2)
          .attr('transform', function() {
            return 'translate(' + (-popupWidth / 2 + 4).toString() + ', 45)';
          })
          .style('fill', options.color[1]);

        var text = popup.append('text')
          .attr('class', '');

        var textMain = text.append('tspan')
          .attr('class', 'popup_main')
          .attr('x', -popupHeight / 2 + 7) //position of text
          .attr('dx', 8) //margin given to the element, will be applied to both sides thanks to resizePopup function
          .attr('y', popupHeight / 3)
          .attr('dy', 3);

        textMain.append('tspan')
          .attr('class', 'popup_value')
          .attr( 'text-anchor', 'start' );

        textMain.append('tspan')
          .attr('class', 'popup_unit')
          .attr('dx', 5);

        var textCompare = text.append('tspan')
          .attr('class', 'popup_compare')
          .attr('x', -popupHeight / 2 + 7) //position of text
          .attr('dx', 8) //margin given to the element, will be applied to both sides thanks to resizePopup function
          .attr('y', popupHeight / 1.5)
          .attr('dy', 3);

        textCompare.append('tspan')
          .attr('class', 'popup_value')
          .attr( 'text-anchor', 'start' );

        textCompare.append('tspan')
          .attr('class', 'popup_unit')
          .attr('dx', 5);

        text.append('tspan')
          .attr('class', 'popup_date')
          .attr('x', (- popupWidth / 2))
          .attr('dx', 8)
          .attr('y', popupHeight - 2)
          .attr('dy', 0)
          .attr( 'text-anchor', 'start' );

        svg.append('rect')
          .attr('class', 'overlay')
          .attr('width', width)
          .attr('height', height)
          .on('mouseover', function() {
            focusCompare.style('display', null);
            focusMain.style('display', null);
            popup.style('display', null);
          })
          .on('mouseout', function() {
            focusCompare.style('display', 'none');
            focusMain.style('display', 'none');
            popup.style('display', 'none');
          })
          .on('mousemove', mousemove);

        function mousemove() {
          var bisectDate = d3.bisector(function(d) { return d.date; }).left;

          var x0 = xScale.invert(d3.mouse(this)[0]);
          var i = bisectDate(data[1], x0, 1);
          var d0 = data[1][i - 1];
          var d1 = data[1][i];
          var d = x0 - d0.date > d1.date - x0 ? d1 : d0;
          focusCompare.attr('transform', 'translate(' + xScale(d.date) + ', ' + yScale1(d.count) + ')');


          var dMain0 = data[0][i - 1];
          var dMain1 = data[0][i];
          var dMain = x0 - dMain0.date > dMain1.date - x0 ? dMain1 : dMain0;
          focusMain.attr('transform', 'translate(' + xScale(dMain.date) + ', ' + yScale0(dMain.count) + ')');

          var popupText = popup.select('text');
          var textMain = popupText.select('.popup_main');
          textMain.select('.popup_value').text(parseValue(dMain.value));
          textMain.select('.popup_unit').text(options.unit[0]);
          var textCompare = popupText.select('.popup_compare');
          textCompare.select('.popup_value').text(parseValue(d.value));
          textCompare.select('.popup_unit').text(options.unit[1]);
          var date = popupText.select('.popup_date').text(parseTime(d.date));

          var textContainers = [
            textMain,
            textCompare,
            date
          ];

          var popupWidth = resizePopup(popupContainer, textContainers);

          if(xScale(d.date) + 80 + popupWidth > options.container.clientWidth) {
            popup.attr('transform', 'translate(' + (xScale(d.date) - 120) + ', ' + (d3.mouse(this)[1] - 20) + ')');
          } else {
            popup.attr('transform', 'translate(' + (xScale(d.date) + 80) + ', ' + (d3.mouse(this)[1] - 20) + ')');
          }
        }
      }

      function xGrid() {
        return d3.svg.axis()
          .scale(xScale)
          .orient('bottom')
          .ticks(5);
      }

      function yGrid() {
        return d3.svg.axis()
          .scale(yScale0)
          .orient('left')
          .ticks(5);
      }

      function parseValue(value) {
        if(value === null) {
          return 'No data on the current timespan';
        } else if(value.toString().indexOf('.') !== -1) {
          var result = value.toString().split('.');
          return result[0] + '.' + result[1].slice(0, 2);
        } else if(value > 99.99) {
          return value.toString();
        } else {
          return value.toString().slice(0, 2);
        }
      }

      function parseTime(time) {
        return moment(time).format('h:mm a ddd Do MMM YYYY');
      }

      function resizePopup(popupContainer, textContainers) {
        if(!textContainers.length) {
          return;
        }

        var widestElem = textContainers.reduce(function(widestElemSoFar, textContainer) {
          var currentTextContainerWidth = getContainerWidth(textContainer);
          var prevTextContainerWidth = getContainerWidth(widestElemSoFar);
          return prevTextContainerWidth >= currentTextContainerWidth ? widestElemSoFar : textContainer;
        }, textContainers[0]);

        var margins = widestElem.attr('dx') * 2;

        popupContainer
          .attr('width', getContainerWidth(widestElem) + margins);

        function getContainerWidth(container) {
          var node = container.node();
          var width;
          if(node.getComputedTextLength) {
            width = node.getComputedTextLength();
          } else if(node.getBoundingClientRect) {
            width = node.getBoundingClientRect().width;
          } else {
            width = node.getBBox().width;
          }
          return width;
        }
        return getContainerWidth(widestElem) + margins;
      }
    }

})();

(function(){
  'use strict';

  angular.module('app.components')
    .directive('apiKey', apiKey);

  function apiKey(){
    return {
      scope: {
        apiKey: '=apiKey'
      },
      restrict: 'A',
      controller: 'ApiKeyController',
      controllerAs: 'vm',
      templateUrl: 'app/components/apiKey/apiKey.html'
    };
  }
})();

(function(){
  'use strict';

  angular.module('app.components')
    .controller('ApiKeyController', ApiKeyController);

  ApiKeyController.$inject = ['alert'];
  function ApiKeyController(alert){
    var vm = this;

    vm.copied = copied;
    vm.copyFail = copyFail;

    ///////////////

    function copied(){
      alert.success('API key copied to your clipboard.');
    }

    function copyFail(err){
      console.log('Copy error: ', err);
      alert.error('Oops! An error occurred copying the api key.');
    }

  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('alert', alert);

  alert.$inject = ['$mdToast'];
  function alert($mdToast) {
    var service = {
      success: success,
      error: error,
      info: {
        noData: {
          visitor: infoNoDataVisitor,
          owner: infoNoDataOwner,
          private: infoDataPrivate,
        },
        longTime: infoLongTime,
        // TODO: Refactor, check why this was removed
        // inValid: infoDataInvalid,
        generic: info
      }
    };

    return service;

    ///////////////////

    function success(message) {
      toast('success', message);
    }

    function error(message) {
      toast('error', message);
    }

    function infoNoDataVisitor() {
      info('Woah! We couldn\'t locate this kit on the map because it hasn\'t published any data. Leave a ' +
        'comment to let its owner know.',
        10000,
        {
          button: 'Leave comment',
          href: 'https://forum.smartcitizen.me/'
        });
    }

    function infoNoDataOwner() {
      info('Woah! We couldn\'t locate this kit on the map because it hasn\'t published any data.',
        10000);
    }

    function infoDataPrivate() {
      info('Device not found, or it has been set to private. Leave a ' +
        'comment to let its owner know you\'re interested.',
        10000,
        {
          button: 'Leave comment',
          href: 'https://forum.smartcitizen.me/'
        });
    }

    // TODO: Refactor, check why this was removed
    // function infoDataInvalid() {
    //   info('Device not found, or it has been set to private.',
    //     10000);
    // }

    function infoLongTime() {
      info('😅 It looks like this kit hasn\'t posted any data in a long ' +
        'time. Why not leave a comment to let its owner know?',
        10000,
        {
          button: 'Leave comment',
          href: 'https://forum.smartcitizen.me/'
        });
    }

    function info(message, delay, options) {
      if(options && options.button) {
        toast('infoButton', message, options, undefined, delay);
      } else {
        toast('info', message, options, undefined, delay);
      }
    }

    function toast(type, message, options, position, delay) {
      position = position === undefined ? 'top': position;
      delay = delay === undefined ? 5000 : delay;

       $mdToast.show({
        controller: 'AlertController',
        controllerAs: 'vm',
        templateUrl: 'app/components/alert/alert' + type + '.html',
        hideDelay: delay,
        position: position,
        locals: {
          message: message,
          button: options && options.button,
          href: options && options.href
        }
      });
    }
  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('AlertController', AlertController);

    AlertController.$inject = ['$scope', '$mdToast', 'message', 'button', 'href'];
    function AlertController($scope, $mdToast, message, button, href) {
      var vm = this;

      vm.close = close;
      vm.message = message;
      vm.button = button;
      vm.href = href;

      // hideAlert will be triggered on state change
      $scope.$on('hideAlert', function() {
        close();
      });

      ///////////////////

      function close() {
        $mdToast.hide();
      }
    }
})();

'use strict';


angular.module('app', [
  'ngFileUpload',
	'ngMaterial',
	'ui.router',
	'restangular',
  'angularSpinner',
  'ngDropdowns',
  'oauth',
  'leaflet-directive',
	'app.components',
  'papa-promise',
  'angularLoad',
  'ngSanitize',
  'angular-clipboard',
  'ngCookies',
  'ngMessages',
  'ngtweet',
  'ngAnimate'
]).config(function($mdThemingProvider) {

  $mdThemingProvider.definePalette('customGreyPalette', {
    '50': '#d4d4d4',
    '100': '#d4d4d4',
    '200': '#d4d4d4',
    '300': '#d4d4d4',
    '400': '#fbfbfb',
    '500': '#aeaeae',
    '600': '#d4d4d4',
    '700': '#d4d4d4',
    '800': '#bbbbbb',
    '900': '#c8c8c8',
    'A100': '#d4d4d4',
    'A200': '#d4d4d4',
    'A400': '#d4d4d4',
    'A700': '#aeaeae',
    'contrastDefaultColor': 'dark'
  });

  $mdThemingProvider.definePalette('customYellowPalette', {
    '50': '#b08406',
    '100': '#c89707',
    '200': '#e1a908',
    '300': '#f6ba0c',
    '400': '#f7c125',
    '500': '#f8c83d',
    '600': '#fad66f',
    '700': '#fbdd87',
    '800': '#fce4a0',
    '900': '#fcebb8',
    'A100': '#fad66f',
    'A200': '#f9cf56',
    'A400': '#f8c83d',
    'A700': '#fdf2d1'
  });

  $mdThemingProvider.definePalette('customRedPalette', {
    '50': '#fbb6bc',
    '100': '#f99ea6',
    '200': '#f8858f',
    '300': '#f76d79',
    '400': '#f55563',
    '500': '#F43D4D',
    '600': '#f76d79',
    '700': '#f55563',
    '800': '#F43D4D',
    '900': '#c00b1b',
    'A100': '#fcced2',
    'A200': '#fee6e8',
    'A400': '#fffefe',
    'A700': '#a80a17',
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50', '100', '200', '300', '400', 'A100']
  });

  $mdThemingProvider.theme('default')
    .primaryPalette('customGreyPalette')
    .accentPalette('customYellowPalette')
    .warnPalette('customRedPalette');
});

// Here you can define a custom Palette:
// Theme configuration: https://material.angularjs.org/latest/Theming/03_configuring_a_theme

(function() {
  'use strict';

  angular.module('app')
    .config(config);

    /*
      Check app.config.js to know how states are protected
    */

    belongsToUser.$inject = ['$window', '$stateParams', 'auth', 'AuthUser', 'deviceUtils', 'userUtils'];
    function belongsToUser($window, $stateParams, auth, AuthUser, deviceUtils, userUtils) {
      if(!auth.isAuth() || !$stateParams.id) {
        return false;
      }
      var deviceID = parseInt($stateParams.id);

      var userData = ( auth.getCurrentUser().data ) || ($window.localStorage.getItem('smartcitizen.data') && new AuthUser( JSON.parse( $window.localStorage.getItem('smartcitizen.data') )));
      var belongsToUser = deviceUtils.belongsToUser(userData.devices, deviceID);
      var isAdmin = userUtils.isAdmin(userData);
      return isAdmin || belongsToUser;
    }

    redirectNotOwner.$inject = ['belongsToUser', '$location'];
    function redirectNotOwner(belongsToUser, $location) {
      if(!belongsToUser) {
        console.error('This kit does not belong to user');
        $location.path('/kits/');
      }
    }

    config.$inject = ['$stateProvider', '$urlServiceProvider', '$locationProvider', 'RestangularProvider', '$logProvider', '$mdAriaProvider', '$cookiesProvider'];
    function config($stateProvider, $urlServiceProvider, $locationProvider, RestangularProvider, $logProvider, $mdAriaProvider, $cookiesProvider) {
      $stateProvider
        /*
         -- Landing state --
         Grabs your location and redirects you to the closest marker with data
        */
        .state('landing', {
          url: '/',
          templateUrl: 'app/components/landing/landing.html',
          controller: 'LandingController',
          controllerAs: 'vm'
        })
        /*
        -- Layout state --
        Top-level state used for inserting the layout(navbar and footer)
        */
        .state('embbed', {
          url: '/embbed?tags&lat&lng&zoom',
          templateUrl: 'app/components/map/mapEmbbed.html',
          controller: 'MapController',
          controllerAs: 'vm',
          resolve: {
            selectedTags: function($stateParams, tag){
              if(typeof($stateParams.tags) === 'string'){
                tag.setSelectedTags([$stateParams.tags]);
              } else{
                // We have an array
                tag.setSelectedTags(_.uniq($stateParams.tags));
              }
            }
          }
        })
        .state('layout', {
          url: '',
          abstract: true,
          templateUrl: 'app/components/layout/layout.html',
          controller: 'LayoutController',
          controllerAs: 'vm',
          resolve:{
            isLogged: function(auth){
              auth.setCurrentUser();
            }
          }
        })
        .state('layout.styleguide',{
          url: '/styleguide',
          templateUrl: 'app/components/static/styleguide.html',
          controller: 'StaticController',
          controllerAs: 'vm'
        })
        /*
        -- Static page template --
        Template for creating other static pages.
        */
        // .state('layout.static', {
        //   url: '/static',
        //   templateUrl: 'app/components/static/static.html',
        //   controller: 'StaticController',
        //   controllerAs: 'vm'
        // })
        .state('layout.policy', {
          url: '/policy',
          templateUrl: 'app/components/static/policy.html',
          controller: 'StaticController',
          controllerAs: 'vm'
        })
        .state('layout.about', {
          url: '/about',
          templateUrl: 'app/components/static/about.html',
          controller: 'StaticController',
          controllerAs: 'vm'
        })
        /*
         -- 404 state --
         Standard error page
        */
        .state('layout.404', {
          url: '/404',
          templateUrl: 'app/components/static/404.html',
          controller: 'StaticController',
          controllerAs: 'vm'
        })
        .state('layout.kitEdit', {
          url: '/kits/:id/edit?step',
          templateUrl: 'app/components/kit/editKit/editKit.html',
          controller: 'EditKitController',
          controllerAs: 'vm',
          resolve: {
            belongsToUser: belongsToUser,
            redirectNotOwner: redirectNotOwner,
            step: function($stateParams) {
              return parseInt($stateParams.step) || 1;
            }
          }
        })
        .state('layout.kitUpload', {
          url: '/kits/:id/upload',
          templateUrl: 'app/components/upload/upload.html',
          controller: 'UploadController',
          controllerAs: 'vm',
          resolve: {
            belongsToUser: belongsToUser,
            kit: ['device', 'FullDevice', '$stateParams', function(device, FullDevice, $stateParams) {
              return device.getDevice($stateParams.id)
              .then(kit => new FullDevice(kit));
            }],
            redirectNotOwner: redirectNotOwner
         }
        })

        .state('layout.kitAdd', {
          url: '/kits/new',
          templateUrl: 'app/components/kit/newKit/newKit.html',
          controller: 'NewKitController',
          controllerAs: 'vm'
        })

        /*
        -- Home state --
        Nested inside the layout state
        It contains the map and all the data related to it
        Abstract state, it only activates when there's a child state activated
        */
        .state('layout.home', {
          url: '/kits?tags',
          abstract: true,
          views: {
            '': {
              templateUrl: 'app/components/home/template.html'
            },

            'map@layout.home': {
              templateUrl: 'app/components/map/map.html',
              controller: 'MapController',
              controllerAs: 'vm'
            }
          },
          resolve: {
            selectedTags: function($stateParams, tag){
              if(typeof($stateParams.tags) === 'string'){
                tag.setSelectedTags([$stateParams.tags]);
              }else{
                // We have an array
                tag.setSelectedTags(_.uniq($stateParams.tags));
              }
            }
          }
        })
        .state('layout.home.tags', {
          url: '/tags',
          views: {
            'container@layout.home': {
              templateUrl: 'app/components/tags/tags.html',
              controller: 'tagsController',
              controllerAs: 'tagsCtl'
            }
          },
          resolve: {
            belongsToUser:  belongsToUser
         }
        })
        /*
        -- Show Kit state --
        Nested inside layout and home state
        It's the state that displays all the data related to a kit below the map
        */
        .state('layout.home.kit', {
          url: '/:id',
          views: {
            'container@layout.home': {
              templateUrl: 'app/components/kit/showKit/showKit.html',
              controller: 'KitController',
              controllerAs: 'vm'
            }
          },
          params: {id: '', reloadMap: false},
          resolve: {
            belongsToUser: belongsToUser
          }
        })
        /*
        -- User Profile state --
        Nested inside layout state
        Public profile of a given user
        Redirects to My Profile/My Profile Admin if the user is the one authenticated or if the authenticated user is an admin
        */
        .state('layout.userProfile', {
          url: '/users/:id',
          templateUrl: 'app/components/userProfile/userProfile.html',
          controller: 'UserProfileController',
          controllerAs: 'vm',
          resolve: {
            isCurrentUser: function($stateParams, $location, auth) {
              if(!auth.isAuth()) {
                return;
              }
              var userID = parseInt($stateParams.id);
              var authUserID = auth.getCurrentUser().data && auth.getCurrentUser().data.id;
              if(userID === authUserID) {
                $location.path('/profile');
              }
            },
            isAdmin: function($window, $location, $stateParams, auth, AuthUser) {
              var userRole = (auth.getCurrentUser().data && auth.getCurrentUser().data.role) || ($window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') )).role);
              if(userRole === 'admin') {
                var userID = $stateParams.id;
                $location.path('/profile/' + userID);
              } else {
                return false;
              }
            }
          }
        })
        /*
        -- My Profile state --
        Private profile of the authenticated user at the moment
        */
        .state('layout.myProfile', {
          url: '/profile',
          authenticate: true,
          abstract: true,
          templateUrl: 'app/components/myProfile/myProfile.html',
          controller: 'MyProfileController',
          controllerAs: 'vm',
          resolve: {
            userData: function($location, $window, user, auth, AuthUser) {
              var userData = auth.getCurrentUser().data;
              if(!userData) {
                return;
              }
              return userData;
            }
          }
        })
        .state('layout.myProfile.kits', {
          url: '/kits',
          cache: false,
          authenticate: true,
          templateUrl: 'app/components/myProfile/Kits.html',
          controllerAs: 'vm',
        })
        .state('layout.myProfile.user', {
          url: '/users',
          authenticate: true,
          templateUrl: 'app/components/myProfile/Users.html',
          controllerAs: 'vm',
        })
        /*
        -- My Profile Admin --
        State to let admins see private profiles of users with full data
        */
        .state('layout.myProfileAdmin', {
          url: '/profile/:id',
          authenticate: true,
          abstract: true,
          templateUrl: 'app/components/myProfile/myProfile.html',
          controller: 'MyProfileController',
          controllerAs: 'vm',
          resolve: {
            isAdmin: function($window, auth, $location, AuthUser) {
              var userRole = (auth.getCurrentUser().data && auth.getCurrentUser().data.role) || ( $window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') )).role );
              if(userRole !== 'admin') {
                $location.path('/kits/');
              } else {
                return true;
              }
            },
            userData: function($stateParams, user, auth, AuthUser) {
              var userID = $stateParams.id;
              return user.getUser(userID)
                .then(function(user) {
                  return new AuthUser(user);
                });
            }
          }
        })
        .state('layout.myProfileAdmin.kits', {
          url: '/kits',
          cache: false,
          authenticate: true,
          templateUrl: 'app/components/myProfile/Kits.html',
          controllerAs: 'vm',
        })
        .state('layout.myProfileAdmin.user', {
          url: '/users',
          authenticate: true,
          templateUrl: 'app/components/myProfile/Users.html',
          controllerAs: 'vm',
        })
        /*
        -- Login --
        It redirects to a certain kit state and opens the login dialog automatically
        */
        .state('layout.login', {
          url: '/login',
          authenticate: false,
          resolve: {
            buttonToClick: function($location, auth) {
              // TODO: Bug These transitions get rejected (console error)
              if(auth.isAuth()) {
                $location.path('/kits/');
              }else{
                $location.path('/kits/');
                $location.search('login', 'true');
              }
            }
          }
        })
        /*
        -- Signup --
        It redirects to a certain kit state and opens the signup dialog automatically
        */
        .state('layout.signup', {
          url: '/signup',
          authenticate: false,
          resolve: {
            buttonToClick: function($location, auth) {
              if(auth.isAuth()) {
                return $location.path('/kits/');
              }
              $location.path('/kits/');
              $location.search('signup', 'true');
            }
          }
        })
        /*
        -- Logout --
        It removes all the user data from localstorage and redirects to landing state
        */
        .state('logout', {
          url: '/logout',
          authenticate: true,
          resolve: {
            logout: function($location, $state, auth, $rootScope) {
              auth.logout();
              $location.path('/kits/');
              $rootScope.$broadcast('loggedOut');
            }
          }
        })
        /*
        -- Password Recovery --
        Form to input your email address to receive an email to reset your password
        */
        .state('passwordRecovery', {
          url: '/password_reset',
          authenticate: false,
          templateUrl: 'app/components/passwordRecovery/passwordRecovery.html',
          controller: 'PasswordRecoveryController',
          controllerAs: 'vm'
        })
        /*
        -- Password Reset --
        This link will be given by the email you received after giving your email in the previous state
        Here, you can input your new password
        */
        .state('passwordReset', {
          url: '/password_reset/:code',
          authenticate: false,
          templateUrl: 'app/components/passwordReset/passwordReset.html',
          controller: 'PasswordResetController',
          controllerAs: 'vm'
        });

      /*  Disable missing aria-label warnings in console */
      $mdAriaProvider.disableWarnings();

      /* Default state */
      $urlServiceProvider.rules.otherwise('/kits');

      /* Default state */
      $urlServiceProvider.rules.when('/kits', '/kits/');

      /* Default profile state */
      $urlServiceProvider.rules.when('/profile', '/profile/kits');
      $urlServiceProvider.rules.when('/profile/:id', '/profile/:id/kits');


      /* Default profile state */
      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      }).hashPrefix('!');

      /*  Sets the default Smart Citizen API base url */
      RestangularProvider.setBaseUrl('https://api.smartcitizen.me/v0');
      //RestangularProvider.setBaseUrl('http://localhost:3000/v0');

      /* Remove angular leaflet logs */
      $logProvider.debugEnabled(false);

      /* Allow cookies across *.smartcitizen.me Apps */
      $cookiesProvider.defaults.path = '/';
      $cookiesProvider.defaults.domain = '.smartcitizen.me';

    }
})();

(function() {
  'use strict';

  angular.module('app')
    .run(run);

    run.$inject = ['$rootScope', '$state', 'Restangular', 'auth', '$templateCache', '$window', 'animation', '$timeout', '$transitions'];
    function run($rootScope, $state, Restangular, auth, $templateCache, $window, animation, $timeout, $transitions) {
      /**
       * every time the state changes, run this check for whether the state
       * requires authentication and, if needed, whether the user is
       * authenticated.
       *
       * authenticate can be: true, false or undefined
       * true when the user must be authenticated to access the route. ex: user profile
       * false when the user cannot be authenticated to access the route. ex: login, signup
       * undefined when it doesn't matter whether the user is logged in or not
       */

      /*jshint unused:false*/

      $transitions.onStart({}, function(trans) {

        if(trans.to().name === 'layout.home.kit' && trans.from().name !== 'layout.home.kit') {
          animation.mapStateLoading();
        }

        if(trans.to().authenticate === false) {
          if(auth.isAuth()) {
            console.log('-- already logged in users cannot go to /login or /signup');
            // TODO: Bug
            // does not redirect because e is undefined
            //e.preventDefault();
            //$state.go('layout.home.kit');
            return;
          }
        }

        if(trans.to().authenticate) {
          if(!auth.isAuth()) {
            $state.go('layout.login');
          }
        }

        // move window up on state change
        $window.scrollTo(0, 0);

        return;
      });

      $transitions.onCreate({}, function(trans) {
        animation.mapStateLoaded();
        animation.hideAlert();
      });

      Restangular.addFullRequestInterceptor(function (element, operation, what, url, headers, params, httpConfig) {
        if (auth.isAuth()) {
          var token = auth.getToken();
          headers.Authorization = 'Bearer ' + token;
        }
        return {
          element: element,
          headers: headers,
          params: params,
          httpConfig: httpConfig
        };
      });
    }

})();

angular.module('app').run(['$templateCache', function($templateCache) {$templateCache.put('app/components/alert/alerterror.html','<md-toast class="red" layout="row" layout-align="space-between center"><div flex=""><md-icon md-svg-src="./assets/images/alert_icon.svg" alt="Insert Drive Icon" class="alert_typeIcon"></md-icon><span ng-bind-html="vm.message" flex="">{{ vm.message }}</span></div><div flex-nogrow=""><md-button ng-click="vm.close()" aria-label=""><md-icon md-svg-src="./assets/images/close_icon_black.svg" alt="Insert Drive Icon" class="alert_closeIcon"></md-icon></md-button></div></md-toast>');
$templateCache.put('app/components/alert/alertinfo.html','<md-toast class="yellow" layout="row" layout-align="space-between center"><div flex=""><md-icon md-svg-src="./assets/images/alert_icon.svg" alt="Alert icon" class="alert_typeIcon"></md-icon><span flex="">{{ vm.message }}</span></div><div flex-nogrow=""><md-button ng-click="vm.close()" aria-label=""><md-icon md-svg-src="./assets/images/close_icon_black.svg" alt="Insert Drive Icon" class="alert_closeIcon"></md-icon></md-button></div></md-toast>');
$templateCache.put('app/components/alert/alertinfoButton.html','<md-toast class="yellow" layout="row" layout-align="space-between center"><div flex=""><md-icon md-svg-src="./assets/images/alert_icon.svg" alt="Alert icon" class="alert_typeIcon"></md-icon><span flex="">{{ vm.message }}</span><md-button ng-attr-target="_blank" ng-href="{{vm.href}}" class="alert_button">{{ vm.button }}</md-button></div><div flex-nogrow=""><md-button ng-click="vm.close()" aria-label=""><md-icon md-svg-src="./assets/images/close_icon_black.svg" alt="Insert Drive Icon" class="alert_closeIcon"></md-icon></md-button></div></md-toast>');
$templateCache.put('app/components/alert/alertsuccess.html','<md-toast class="green" layout="row" layout-align="space-between center"><div flex=""><md-icon md-svg-src="./assets/images/alert_icon.svg" alt="Insert Drive Icon" class="alert_typeIcon"></md-icon><span flex="">{{ vm.message }}</span></div><div flex-nogrow=""><md-button ng-click="vm.close()" aria-label=""><md-icon md-svg-src="./assets/images/close_icon_black.svg" alt="Insert Drive Icon" class="alert_closeIcon"></md-icon></md-button></div></md-toast>');
$templateCache.put('app/components/apiKey/apiKey.html','<div class="api_key_number">{{ apiKey }}</div><md-button clipboard="" text="apiKey" class="api_key_refresh_button" aria-label="" on-copied="vm.copied()" on-error="vm.copyFail(err)"><md-icon class="" md-svg-src="./assets/images/paste_icon.svg"></md-icon></md-button>');
$templateCache.put('app/components/disqus/disqus.html','<div id="disqus_thread"></div><script type="text/javascript">\n   /* * * CONFIGURATION VARIABLES * * */\n   var disqus_shortname = \'smartcitizen\';\n   // var disqus_identifier = \'newid1\';\n   // var disqus_url = \'http://example.com/unique-path-to-article-1/\';\n   // var disqus_config = function () {\n   //   this.language = "en";\n   // };\n\n\n   /* * * DON\'T EDIT BELOW THIS LINE * * */\n   (function() {\n       var dsq = document.createElement(\'script\'); dsq.type = \'text/javascript\'; dsq.async = true;\n       dsq.src = \'//\' + disqus_shortname + \'.disqus.com/embed.js\';\n       (document.getElementsByTagName(\'head\')[0] || document.getElementsByTagName(\'body\')[0]).appendChild(dsq);\n   })();\n</script><noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>');
$templateCache.put('app/components/download/downloadModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Download data</h2><span flex=""></span><md-button class="md-icon-button" ng-click="vm.cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content class="modal modal_download"><div class="md-dialog-content max-width-500px"><p>We will process your sensor data and send you an email with a download link when it is ready</p></div><md-button class="btn-blue btn-full" ng-click="vm.download()">Download</md-button></md-dialog-content></md-dialog>');
$templateCache.put('app/components/footer/footer.html','<footer class="p-60" style="padding-bottom: 10px"><div layout="row" layout-xs="column" layout-sm="column" layout-wrap="" layout-align="space-between center" layout-align-xs="space-between stretch" style="color:white; margin:0 auto; max-width:1050px"><div class="footer-block"><img style="height:80px" src="./assets/images/smartcitizen_logo2.svg" alt="logos"></div><div layout="row" layout-align="space-between center" class="border-white p-20 mb-10 footer-block"><div class="mr-10">A project by</div><a class="mr-10" href="https://fablabbcn.org"><img style="height:36px; margin-right: 7px" src="./assets/images/logo_fablab_bcn_small.png" alt="fablab"></a> <a href="https://iaac.net"><img style="height:16px" src="./assets/images/iaac.png" alt="fablab"></a></div><div flex="25" flex-xs="100" layout="row" layout-xs="column" layout-sm="column" layout-align="start center" class="footer-block"><img class="flag" style="height:48px" src="./assets/images/eu_flag.png" alt="fablab"><p class="color-white text-funding">Smart Citizen has received funding from the European Community\'s H2020 and HORIZON Programmes.</p></div><div layout="row" layout-align="space-between center" class="footer-block uptimerobot-sponsor"><div class="uptimerobot-sponsor-text"><p>Monitoring sponsored by</p></div><div><a href="https://uptimerobot.com/" target="_blank"><img class="uptimerobot-logo" src="./assets/images/uptimerobot-logo.svg" alt="fablab"></a></div></div><div flex="100" layout="row" layout-align="center center" style="margin-top:20px; padding-bottom:10px"><p class="color-white text-left">Smart Citizen\xAE embraces openness by design: all content on this page is licensed under a <a class="footer-link" rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>. The platform\u2019s software is released under <a class="footer-link" href="https://www.gnu.org/licenses/agpl-3.0.en.html#license-text">the GNU Affero General Public License v3.0</a>, its core hardware under the <a class="footer-link" href="https://ohwr.org/project/cernohl/-/wikis/uploads/819d71bea3458f71fba6cf4fb0f2de6b/cern_ohl_s_v2.txt">CERN Open Hardware License</a>, and its data under the <a class="footer-link" href="https://opendatacommons.org/licenses/odbl/1-0/">Open Database License</a> \u2014 empowering anyone to explore, replicate, and innovate with our tools. Feel free to also check the <a class="footer-link" target="_blank" rel="policy" href="policy">Terms of use and Privacy Policy</a> for more information.</p></div></div></footer>');
$templateCache.put('app/components/home/template.html','<div><section class="content"><div ui-view="map" class="map_state"></div><div ui-view="container" class="kit"></div></section></div>');
$templateCache.put('app/components/kitList/kitList.html','<div class="" ng-if="devices.length === 0"><small>No kits</small></div><md-list layout="row" layout-wrap=""><md-list-item class="kitList_parent" ng-repeat="device in devices track by device.id" flex="100" flex-gt-md="50" layout-xs="column" layout-align="start center"><md-card class="kit-list-item" flex="" layout-padding="" href="./kits/{{device.id}}"><md-card-header layout="row" layout-align="start center"><div class="ml-20 mt-20"><h4 class="m-0 mb-10">{{ device.name || \'No name\' }}</h4><span class="md-subhead"><md-icon class="icon_label" md-svg-src="./assets/images/sensor_icon.svg"></md-icon><span class="mr-10">{{ device.hardwareName || \'Unknown Kit\'}}</span></span><p class="m-0 mb-10" ng-if="device.belongProperty"><md-icon class="kitList_state_{{ device.state.className }}" md-font-icon="fa fa-wifi"></md-icon><span class="kitList_state_{{ device.state.className }} state">{{ device.state.name }}</span></p></div></md-card-header><md-card-content class="ml-20 mb-20"><div layout="row" layout-align="start center" layout-wrap=""><span class="label" ng-repeat="system_tag in device.systemTags">{{ system_tag }}</span><tag ng-repeat="tag in device.userTags" ng-attr-tag-name="tag" clickable=""></tag></div></md-card-content><div class="ml-10 mb-20"><md-button class="md-raised md-primary md-hue-1" ng-href="./kits/{{device.id}}"><md-icon style="margin:5px" md-font-icon="fa fa-globe"></md-icon>View on map</md-button><md-button class="md-raised md-primary md-hue-1" ng-if="device.belongProperty" ng-repeat="item in device.dropdownOptions" ng-href="{{item.href}}"><md-icon style="margin:5px" md-font-icon="{{item.icon}}"></md-icon><span>{{item.text}}</span></md-button><md-button class="md-raised md-primary md-hue-1" ng-click="actions.downloadData(device)" ng-if="device.belongProperty" aria-label=""><md-icon style="margin:5px" class="kit_detailed_icon_content" md-font-icon="fa fa-download" ng-click="vm.downloadData(device)"></md-icon>Download CSV</md-button><md-button class="md-raised md-primary md-hue-1" ng-click="actions.remove(device.id)" ng-if="device.belongProperty" aria-label=""><md-icon style="margin:5px" md-font-icon="fa fa-trash"></md-icon>REMOVE</md-button></div></md-card></md-list-item></md-list>');
$templateCache.put('app/components/landing/landing.html','<div class="new-landing-page grey-waves"><div class="sc-off-cta-platform"><div class="navigation"><a href="#"><img class="sc-logo" src="/assets/images/smartcitizen_logo.svg" alt="logo"></a></div><div class="hamburger"><span class="bar"></span> <span class="bar"></span> <span class="bar"></span></div><div class="landing-menu"><div class="external-links"><a href="/kits/" class="landing-menu-btn md-button" target="_blank">PLATFORM</a> <a href="https://docs.smartcitizen.me/" class="landing-menu-btn md-button" target="_blank">DOCUMENTATION</a> <a href="https://forum.smartcitizen.me/" class="landing-menu-btn md-button" target="_blank">FORUM</a></div><a href="#get-your-kit" class="btn-white-blue btn-round-new md-button btn-kit">GET YOUR KIT</a></div></div><section class="video-section"><div class="header-section"><div class="heading-over-video card" layout="column" layout-align="center start"><div class="logo-box"><h1>SMART CITIZEN</h1></div><div class="card-text"><h2 class="font-kanit text-left">OPEN TOOLS FOR ENVIRONMENTAL MONITORING</h2><a href="#learn-more" class="btn-blue btn-round-new mt-30 md-button btn-justify-left">LEARN MORE</a></div></div></div></section><div id="learn-more" class="color-black"><section layout="row" layout-xs="column" class="pd-60"><div flex="50" flex-xs="100" layout="column"><div flex="noshrink" flex-order-xs="2" class="bg-white tile tile-left border-xs-bottom tile-top text-left"><h2>EMPOWERING COMMUNITIES FOR ACTION</h2><p style="margin-bottom:33px">We are a collective of passionate people who believe that data is critical to inform civic participation. We develop free and open-source tools for environmental monitoring and methodologies for community-driven action.</p></div><div flex-order-xs="1" class="img-sck_edu tile tile-left tile-image border-xs-top"></div></div><div flex="50" flex-xs="100" layout="column"><div class="img-new_sck tile tile-top tile-image border-xs-bottom"></div><div flex="noshrink" class="bg-white tile border-xs-left border-xs-bottom text-left"><h2>BUILDING ON OUR HISTORY</h2><p style="margin-bottom:33px">The Smart Citizen project provides tools for collecting, understanding, and sharing environmental data. Since 2012, we have developed various iterations of the Smart Citizen Kit, allowing anyone to contribute and take part in data-driven action.</p><a href="#get-your-kit" class="btn-black-outline btn-round-new md-button btn-justify-left">GET YOUR KIT</a></div></div></section><section class="pd-60"><div class="bg-white p-30 border-black" layout="row" layout-align="center center"><h2 class="text-left">TOOLS FOR EVERY COMMUNITY</h2></div><div layout="row" layout-xs="column"><div flex="40" flex-xs="100" flex-order-xs="1" class="bg-blue tile tile-left border-xs-bottom text-center color-white"><img style="height:85px" src="./assets/images/communities.svg" alt="Community icon"><h3 class="color-white">LOCAL COMMUNITIES</h3><p class="color-white">Launch a crowd-sensing campaign in your city. Create local maps of noise and air quality. Raise awareness and find solutions for issues that matter to your community.</p></div><div flex="60" flex-xs="100" flex-order-xs="0" class="img-sck_com tile-image tile border-xs-bottom"></div></div><div layout="row" layout-xs="column"><div flex="60" flex-xs="100" class="img-research tile-image tile tile-left border-xs-bottom"></div><div flex="40" flex-xs="100" class="bg-yellow tile tile-xs text-center border-xs-bottom"><img style="height:85px" src="./assets/images/research.svg" alt="Community icon"><h3>RESEARCH INSTITUTIONS</h3><p>Use Smart Citizen as a tool for environmental data collection and analysis. Trigger informed action that brings communities together, raising awareness of environmental issues.</p></div></div><div layout="row" layout-xs="column"><div flex="40" flex-xs="100" flex-order-xs="1" class="bg-red tile tile-left color-white border-xs-bottom text-center"><img style="height:110px" src="./assets/images/cities.svg" alt="Community icon"><h3 class="color-white">EDUCATORS</h3><p class="color-white">Find ways to bring Smart Citizen tools into the classroom. Explore our freely accessible tools and methodologies for educators, giving environmental awareness a hands-on toolkit.</p></div><div flex="60" flex-xs="100" flex-order-xs="0" class="img-governm tile tile-image border-xs-bottom"></div></div></section></div><section class="banner-section"><div class="header-section"><div class="tile tile-image mobileonly img-platform"></div><div class="heading-over-video right-card card" layout="column" layout-align="center start"><div class="card-text"><h2 class="font-kanit text-left">ACROSS THE GLOBE</h2><p class="p-header text-left" style="margin-bottom:33px">Generate real-time data and awareness about pressing environmental issues, empowering communities to seek solutions.</p><a href="/kits/" target="_blank" class="btn-blue btn-round-new md-button btn-justify-left">GO TO THE PLATFORM</a></div></div></div></section><div id="learn-more" style="margin: 0 auto; max-width:1200px" class="color-black"><section class="pd-60"><div layout="row" layout-xs="column" id="open-platform"><div flex="50" flex-xs="100" layout="column" layout-xs="column" layout-align="space-around" class="bg-white tile tile-left tile-top tile-xs"><div class="text-left"><h2 class="text-left">AN OPEN PROJECT</h2></div><div class="text-left"><p><strong>Learn, build and contribute.</strong> The project builds on open source technologies such as Arduino to enable citizens and communities to gather information on their environment and make it available to the public via the Smart Citizen platform.</p><p><strong>Check out our documentation and learn how to contribute to the project by joining the open source development community.</strong></p><a href="https://docs.smartcitizen.me/" class="btn-blue btn-round-new md-button btn-justify-left" target="_blank">GO TO THE DOCS</a></div></div><div flex="50" flex-xs="100" layout="column" layout-align="end center" class="img-docs tile tile-top border-xs-bottom tile-image"></div><div></div></div></section><section class="pd-60" id="get-your-kit"><div class="bg-white p-30 border-black" layout="row" layout-align="center center"><h2 class="text-center">GET YOUR KIT</h2></div><div layout="row" layout-xs="column"><div flex="50" flex-xs="100" layout="column" layout-xs="column" class=""><div flex="noshrink" flex-order-xs="2" class="bg-blue tile tile-left border-xs-bottom text-center"><img style="height:85px" src="./assets/images/new.svg" alt="New kit icon"><h3 class="color-white">SMART CITIZEN KIT</h3><p class="color-white" style="margin-bottom:33px">We\'re excited to release our newest version of the Smart Citizen Kit! The Smart Citizen Kit 2.3 is an upgrade of the kit that you already know and love, and is now available through SEEED Studio. The latest version includes UV readings, an improved PM sensor and lots of new features!</p><a href="https://www.seeedstudio.com/Smart-Citizen2-3-p-6327.html" target="_blank" class="btn-outline-white btn-round-new md-button">GET YOUR KIT AT SEEED STUDIO!</a></div><div flex-order-xs="1" class="img-kits-complete tile tile-left tile-image"></div></div><div flex="50" flex-xs="100" layout="column"><div class="img-kits-research tile tile-image border-xs-bottom"></div><div flex="noshrink" class="bg-yellow tile border-xs-left border-xs-bottom text-center"><img style="height:85px" src="./assets/images/contact.svg" alt="Contact icon"><h3>PROJECTS AND CUSTOMIZATIONS</h3><p style="margin-bottom:33px">Planning something big? Do you want to use the kit as part of a research project? While all of our hardware is open source, we work directly with research organizations and projects to make open hardware that anyone can use.</p><p style="margin-bottom:33px"><strong>Get in touch for customized projects at <a href="mailto:info@smartcitizen.me">info@smartcitizen.me</a></strong></p><a href="mailto:info@smartcitizen.me" class="btn-black-outline btn-round-new md-button">CONTACT US!</a></div></div></div></section><section class="pd-60" id="newsletter"><form action="https://smartcitizen.us2.list-manage.com/subscribe/post?u=d67ba8deb34a23a222ec4eb8a&amp;id=d0fd9c9327" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate=""><div layout="row" layout-xs="column" layout-sm="column" layout-align="space-between center" layout-align-xs="center center" class="border-black bg-blue" style="padding:30px 50px; min-height: 200px"><h3 class="color-white text-left my-20">SUBSCRIBE TO GET THE LATEST NEWS</h3><div layout="row" layout-xs="column" layout-align="space-between center"><input class="my-20 mr-30" style="background: #262626; color:#eee; padding: 9px; border:none; width:250px" type="email" name="EMAIL" placeholder="Your email address" required=""> <input class="btn-yellow btn-round-new md-button" type="submit" name="subscribe" id="mc-embedded-subscribe" value="GO!"><div id="mce-responses" class="clear"><div class="response" id="mce-error-response" style="display:none"></div><div class="response" id="mce-success-response" style="display:none"></div></div><div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_d67ba8deb34a23a222ec4eb8a_d5a8cea29f" tabindex="-1" value=""></div></div></div></form></section><section class="pd-60 text-center"><div layout="row" layout-xs="column" layout-sm="column" layout-align="space-between"><div flex="30" flex-sm="100" flex-xs="100" layout="column" layout-align="space-between center" class="bg-white border-black px-20 py-40 mb-10 card"><img style="height:80px" src="./assets/images/api.svg" alt="API icon"><h3>DEVELOPER<br>READY</h3><p>Use our powerful API to build amazing things using data.</p><a href="https://developer.smartcitizen.me/" class="btn-black-outline btn-round-new md-button" target="_blank">USE THE API</a></div><div flex="30" flex-sm="100" flex-xs="100" layout="column" layout-align="space-between center" class="bg-white border-black px-20 py-40 mb-10 card"><img style="height:80px" src="./assets/images/github.svg" alt="Github icon"><h3>WE\u2019RE<br>OPEN SOURCE</h3><p>Fork and contribute to the project or download designs.</p><a href="https://github.com/orgs/fablabbcn/repositories?q=smartcitizen" class="btn-black-outline btn-round-new md-button" target="_blank">VISIT OUR REPOS</a></div><div flex="30" flex-sm="100" flex-xs="100" layout="column" layout-align="space-between center" class="bg-white border-black px-20 py-40 mb-10 card"><img style="height:80px" src="./assets/images/forum.svg" alt="Forum icon"><h3>JOIN THE<br>FORUM</h3><p>A place to share ideas with the community or find support.</p><a href="https://forum.smartcitizen.me" class="btn-black-outline btn-round-new md-button" target="_blank">GET INVOLVED</a></div></div></section></div></div><footer ng-include="\'app/components/footer/footer.html\'" layout="row" layout-align="center center" class="mt"></footer><script>\n  const hamburger = document.querySelector(".hamburger");\n  const navMenu = document.querySelector(".landing-menu");\n  const navGeneral = document.querySelector(".sc-off-cta-platform");\n  const pageScroll = document.querySelector("body");\n  const navFull = document.querySelector(".navigation");\n\n  hamburger.addEventListener("click", mobileMenu);\n\n  function mobileMenu() {\n    hamburger.classList.toggle("active");\n    navMenu.classList.toggle("active");\n    navGeneral.classList.toggle("active");\n    pageScroll.classList.toggle("active");\n    navFull.classList.toggle("active");\n    document.body.style.top = `-${window.scrollY}px`;\n  }\n\n  const navLink = document.querySelectorAll(".landing-menu");\n\n  navLink.forEach(n => n.addEventListener("click", closeMenu));\n\n  function closeMenu() {\n    hamburger.classList.remove("active");\n    navMenu.classList.remove("active");\n    navGeneral.classList.remove("active");\n    pageScroll.classList.remove("active");\n    navFull.classList.remove("active");\n    const scrollY = document.body.style.top;\n    document.body.style.position = \'\';\n    document.body.style.top = \'\';\n    // window.scrollTo(0, parseInt(scrollY || \'0\') * -1);\n  }\n</script>');
$templateCache.put('app/components/landing/static.html','<section class="static_page" flex=""><div class="timeline" layout="row"><div class="content" layout="row" layout-align="start center" flex=""><h1>Title</h1></div></div><div class=""><div class="content"><h2>Heading 2</h2><h3>Heading 3</h3><h4>Heading 4</h4><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam a porta quam. Phasellus tincidunt facilisis blandit. Aenean tempor diam quis turpis vestibulum, ac semper turpis mollis. Sed ac ultricies est. Vivamus efficitur orci efficitur turpis commodo dignissim. Aliquam sagittis risus in semper ullamcorper. Sed enim diam, tempus eget lorem sit amet, luctus porta enim. Nam aliquam mollis massa quis euismod. In commodo laoreet mattis. Nunc auctor, massa ut sollicitudin imperdiet, mauris magna tristique metus, quis lobortis ex ex id augue. In hac habitasse platea dictumst. Sed sagittis iaculis eros non sollicitudin. Sed congue, urna ut aliquet ornare, nisi tellus euismod nisi, a ullamcorper augue arcu sit amet ante. Mauris condimentum ex ante, vitae accumsan sapien vulputate in. In tempor ligula ut scelerisque feugiat. Morbi quam nisi, blandit quis malesuada sit amet, gravida ut urna.</p><md-button class="md-primary md-raised">button</md-button><md-button class="md-primary">button</md-button></div></div><div class=""><div class="content"><h2>Heading 2</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam a porta quam. Phasellus tincidunt facilisis blandit. Aenean tempor diam quis turpis vestibulum, ac semper turpis mollis. Sed ac ultricies est. Vivamus efficitur orci efficitur turpis commodo dignissim. Aliquam sagittis risus in semper ullamcorper. Sed enim diam, tempus eget lorem sit amet, luctus porta enim. Nam aliquam mollis massa quis euismod. In commodo laoreet mattis. Nunc auctor, massa ut sollicitudin imperdiet, mauris magna tristique metus, quis lobortis ex ex id augue. In hac habitasse platea dictumst. Sed sagittis iaculis eros non sollicitudin. Sed congue, urna ut aliquet ornare, nisi tellus euismod nisi, a ullamcorper augue arcu sit amet ante. Mauris condimentum ex ante, vitae accumsan sapien vulputate in. In tempor ligula ut scelerisque feugiat. Morbi quam nisi, blandit quis malesuada sit amet, gravida ut urna.</p></div></div><div class=""><div class="content"><h2>Small section</h2><p>Single line comment.</p></div></div></section>');
$templateCache.put('app/components/layout/layout.html','<div class="navbar_container"><md-toolbar layout="row" layout-align="space-between center" class="stickNav"><a ui-sref="landing" class="logo_link"><md-tooltip md-direction="bottom">Visit the frontpage</md-tooltip><md-icon class="m-10 ml-15 logo_icon" md-svg-src="./assets/images/LogotipoSmartCitizen.svg" alt="Insert Drive Icon"></md-icon></a><section layout="row" layout-align="start center"><md-button hide-xs="" ng-show="vm.isShown" ui-sref="layout.home.kit({ id: \'\'})" class="md-flat map"><md-tooltip md-direction="bottom">Visit the map</md-tooltip><md-icon md-svg-src="./assets/images/map_icon.svg" class="nav_icon"></md-icon><span>Map</span></md-button><md-menu hide="" show-gt-sm="" ng-show="vm.isShown"><md-button ng-click="$mdMenu.open($event)"><md-icon md-svg-src="./assets/images/community_icon.svg" class="nav_icon"></md-icon><span>Community</span></md-button><md-menu-content ng-mouseleave="$mdMenu.close()"><md-menu-item ng-repeat="item in vm.dropdownOptionsCommunity"><md-button href="{{item.href}}">{{item.text}}</md-button></md-menu-item></md-menu-content></md-menu></section><search flex=""></search><section hide-xs="" layout="row" layout-align="{{vm.navRightLayout}}"><div ng-show="vm.isShown" hide-xs="" hide-sm="" store="" logged="vm.isLoggedin" class="md-flat get"></div><div ng-show="vm.isShown && !vm.isLoggedin" hide-xs="" login="" class="navbar_login_button"></div><div ng-show="vm.isShown && !vm.isLoggedin" hide-xs="" signup="" class="navbar_signup_button"></div><md-menu ng-show="vm.isShown && vm.isLoggedin"><md-button class="btn-small" ng-click="$mdMenu.open($event)" layout="column" layout-align="center center"><md-tooltip md-direction="bottom">Your profile</md-tooltip><img class="navbar_avatar_icon" ng-src="{{ vm.currentUser.profile_picture || \'./assets/images/avatar.svg\' }}"></md-button><md-menu-content ng-mouseleave="$mdMenu.close()"><md-menu-item ng-repeat="item in vm.dropdownOptions"><md-button href="{{item.href}}">{{item.text}}</md-button></md-menu-item></md-menu-content></md-menu></section><md-button hide-gt-sm="" ng-click="toggleRight()" layout="column" layout-align="center center"><img class="" ng-src="{{\'./assets/images/menu2.svg\' }}"></md-button></md-toolbar></div><section layout="row" flex=""><md-sidenav class="md-sidenav-right" md-component-id="right" md-whiteframe="3"><md-toolbar layout="row" layout-align="end center"><md-button ng-click="toggleRight()" layout="column" layout-align="center center"><img class="" ng-src="{{\'./assets/images/menu2.svg\' }}"></md-button></md-toolbar><md-content><md-menu-item ng-show="vm.isShown && !vm.isLoggedin" login="" class=""></md-menu-item><md-menu-item ng-show="vm.isShown && !vm.isLoggedin" signup="" class=""></md-menu-item><md-menu-item ng-show="vm.isLoggedin"><md-button href="./profile">Profile</md-button></md-menu-item><md-menu-item ng-show="vm.isLoggedin"><md-button href="./logout">Log out</md-button></md-menu-item><md-divider></md-divider><md-menu-item><md-button href="./kits">Map</md-button></md-menu-item><md-menu-item><md-button target="_blank" href="https://www.seeedstudio.com/Smart-Citizen-Starter-Kit-p-2865.html">Get your kit</md-button></md-menu-item><md-divider></md-divider><md-menu-item ng-repeat="item in vm.dropdownOptionsCommunity"><md-button href="{{item.href}}">{{item.text}}</md-button></md-menu-item></md-content></md-sidenav></section><div ui-view=""></div><footer class="footer" ng-if="!vm.overlayLayout" ng-include="\'app/components/footer/footer.html\'" layout="row" layout-align="center center"></footer>');
$templateCache.put('app/components/login/login.html','<md-button class="md-flat" ng-click="showLogin($event)" angular-on="click" angular-event="Login" angular-action="click">Log In</md-button>');
$templateCache.put('app/components/login/loginModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Log in</h2><span flex=""></span><md-button class="md-icon-button" ng-click="cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><md-progress-linear class="md-hue-3" ng-show="waitingFromServer" md-mode="indeterminate"></md-progress-linear><form novalidate="" ng-submit="answer(vm.user)" name="loginForm"><div class="md-dialog-content"><div><p>Log in to Smart Citizen</p></div><div layout="column"><md-input-container class="md-block"><label>Username or email</label> <input id="autofocus" type="text" name="username" ng-model="vm.user.username" focus-input="" ng-required="loginForm.$submitted"><div ng-messages="(loginForm.username.$touched && loginForm.username.$error)" role="alert"><div ng-message="required">Username is required</div><div ng-if="vm.errors.id">Username or password incorrect</div></div></md-input-container><md-input-container class="md-block"><label>Password</label> <input type="password" name="password" autocomplete="current-password" ng-model="vm.user.password" ng-required="loginForm.$submitted"><div ng-messages="(loginForm.$submitted || loginForm.password.$touched) && loginForm.password.$error" role="alert"><div ng-message="required">Password is required</div></div></md-input-container></div><md-button class="md-primary" ng-click="openSignup()" angular-on="click" angular-event="Login" angular-action="signup">New here? Sign up</md-button><md-button class="md-warn" ng-click="openPasswordRecovery()" angular-on="click" angular-event="Login" angular-action="password recover">Forgot your password?</md-button></div><div><md-button class="btn-blue btn-full" type="submit">LOG IN</md-button></div></form></md-dialog-content></md-dialog>');
$templateCache.put('app/components/map/map.html','<section class="map" change-map-height=""><leaflet center="vm.center" layers="vm.layers" markers="vm.markers" defaults="vm.defaults" event-broadcast="vm.events" width="100%" height="100%"></leaflet><div class="map_legend" layout="row" layout-align="start center" move-filters=""><div class="map_legend__filtersContainer" layout="column"><div class="map_legend__filtersRow" ng-click="vm.openFilterPopup()" flex="50"><div class="map_filter_button"><md-icon md-svg-src="./assets/images/filter_icon.svg"></md-icon></div><p class="filter_description">Filters</p></div><div class="map_legend__filtersRow" ng-click="vm.openTagPopup()" flex="50"><div class="map_filter_button"><p>#</p></div><p class="filter_description">Tags</p></div></div><div class="chips" layout="column"><div layout="row" class="chips_row"><span ng-repeat="filter in vm.selectedFilters" ng-if="!vm.checkAllFiltersSelected()" class="chip label" style="padding: 0 10px;">{{ filter }}</span></div><div layout="row" class="chips_row" layout-wrap=""><span class="chip tag" ng-repeat="tag in vm.selectedTags">{{ tag }}<md-icon ng-click="vm.removeTag(tag)" md-svg-src="./assets/images/close_icon_black.svg"></md-icon></span></div></div></div><md-progress-linear ng-show="vm.deviceLoading || !vm.readyForDevice.map" class="md-hue-3 kit_spinner" md-mode="indeterminate"></md-progress-linear></section>');
$templateCache.put('app/components/map/mapEmbbed.html','<section class="map" style="height: 100%; top: 0px;"><leaflet center="vm.center" layers="vm.layers" markers="vm.markers" defaults="vm.defaults" event-broadcast="vm.events" width="100%" height="100%"></leaflet><md-progress-linear ng-show="vm.deviceLoading || !vm.readyForDevice.map" class="md-hue-3 kit_spinner" md-mode="indeterminate"></md-progress-linear></section>');
$templateCache.put('app/components/map/mapFilterModal.html','<md-dialog class="filters"><md-toolbar><div class="md-toolbar-tools"><h2>Filters</h2><span flex=""></span><md-button class="md-icon-button" ng-click="vm.cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><div class="md-dialog-content max-width-500px"><md-content layout-padding=""><h4 style="margin: 0">Are you looking for real time data?</h4><p style="margin: 0">Online Kits have published data online at least during the past 60 minutes</p><div ng-repeat="filter in vm.status"><md-checkbox ng-click="vm.toggle(vm.status)" ng-model="vm.checks[filter]"><span style="padding: 3px 8px" class="filter">{{filter.toUpperCase()}}</span></md-checkbox></div></md-content><md-content style="margin-top: 10px;" layout-padding=""><h4 style="margin: 0">Are you looking for outdoor data?</h4><p style="margin: 0">Kits can be used to monitor indoor and outdoor conditions</p><div ng-repeat="filter in vm.location"><md-checkbox ng-click="vm.toggle(vm.location)" ng-model="vm.checks[filter]"><span style="padding: 3px 8px" class="filter">{{filter.toUpperCase()}}</span></md-checkbox></div></md-content></div><md-button class="md-warn btn-full" ng-click="vm.clear()">Clear filters</md-button><md-button class="btn-blue btn-full" ng-click="vm.answer()">Apply</md-button></md-dialog-content></md-dialog>');
$templateCache.put('app/components/map/mapTagModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Tags</h2><span flex=""></span><md-button class="md-icon-button" ng-click="vm.cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><div class="md-dialog-content max-width-500px min-height-80"><p>Kits sharing a #tag show their average data.</p><p class="hide-xs">Browse and select from the list to show the kits containing ALL these tags.</p><md-input-container md-no-float="" class="md-block"><input type="text" ng-model="tagSearch" placeholder="Search for tags.."></md-input-container><md-content layout-padding="" style="height: calc(80vh - 450px);"><div ng-repeat="tag in vm.tags | filter:{name: tagSearch}"><md-checkbox ng-model="vm.checks[tag.name]"><span class="tag">{{tag.name}}</span></md-checkbox></div></md-content></div><md-button class="md-warn btn-full" ng-click="vm.clear()">Clear selection</md-button><md-button class="btn-blue btn-full" ng-click="vm.answer()">Apply</md-button></md-dialog-content></md-dialog>');
$templateCache.put('app/components/myProfile/Kits.html','<div class="profile_content" layout="column" layout-gt-sm="row"><div class="profile_sidebar pt-80" layout-align="start" layout-align-xs="start center" layout="column"><p class="profile_sidebar_title text-center">FILTER KITS BY</p><div class="" layout="row" layout-align="center center" layout-gt-sm="column"><md-button ng-click="vm.filterDevices(\'all\')" class="profile_sidebar_button">ALL</md-button><md-button ng-click="vm.filterDevices(\'online\')" class="profile_sidebar_button">ONLINE</md-button><md-button ng-click="vm.filterDevices(\'offline\')" class="profile_sidebar_button">OFFLINE</md-button></div></div><div class="pt-80 px-20 mb-30" flex=""><div class="profile_content_main_top"><md-button class="btn-round-new btn-cyan" ng-click="addDeviceSelector()">ADD A NEW KIT</md-button><span class="float-right">{{ vm.filteredDevices.length || 0 }} kits filtering by {{ vm.deviceStatus.toUpperCase() || \'ALL\' }}</span></div><kit-list actions="{remove: vm.removeDevice, downloadData: vm.downloadData}" devices="vm.filteredDevices"></kit-list><div class="kitList kitList_borderBottom" ng-show="!vm.devices.length"><div class="kitList_container"><div class="kitList_noKits"><span>There are not kits yet</span></div></div></div></div></div>');
$templateCache.put('app/components/myProfile/Users.html','<div class="profile_content" layout="column" layout-gt-xs="row" layout-align="center"><div layout-padding="" layout-margin="" class="mt-50 mb-30 bg-white"><div style="max-width:500px"><div class="myProfile_form_avatar" layout="row" layout-align="start center"><img ng-src="{{ vm.user.profile_picture || \'./assets/images/avatar.svg\' }}" class="myProfile_form_avatarImage"><md-button class="md-raised md-accent" ngf-select="" ngf-change="vm.uploadAvatar($files)">CHANGE AVATAR</md-button></div><form ng-submit="vm.updateUser(vm.formUser)"><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container flex=""><label>Username</label> <input type="text" ng-model="vm.formUser.username"></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.username.length"><span ng-repeat="error in vm.errors.username">Username {{ error }}<span ng-if="!$last">,</span></span></p></div><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container flex=""><label>Password</label> <input type="password" ng-model="vm.formUser.password"></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.password.length"><span ng-repeat="error in vm.errors.password">Password {{ error }}<span ng-if="!$last">,</span></span></p></div><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container flex=""><label>Email</label> <input type="email" ng-model="vm.formUser.email"></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.email.length"><span ng-repeat="error in vm.errors.email">Email {{ error }}<span ng-if="!$last">,</span></span></p></div><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container flex=""><label>City</label> <input type="text" ng-model="vm.formUser.city"></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.city.length"><span ng-repeat="error in vm.errors.city">City {{ error }}<span ng-if="!$last">,</span></span></p></div><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container class="countryInput_container" flex=""><label>Country</label><md-autocomplete md-search-text="vm.searchText" md-items="item in vm.getCountries(vm.searchText)" md-item-text="item" md-selected-item="vm.formUser.country"><span>{{ item }}</span></md-autocomplete></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.country.length"><span ng-repeat="error in vm.errors.country">Country {{ error }}<span ng-if="!$last">,</span></span></p></div><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container flex=""><label>Website</label> <input type="url" ng-model="vm.formUser.url"></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.url.length"><span ng-repeat="error in vm.errors.url">URL {{ error }}<span ng-if="!$last">,</span></span></p></div><md-button type="submit" class="md-accent md-raised">UPDATE PROFILE</md-button></form><div class="mb-20"><div class="mb-20" layout="column" layout-align="start"><h4><md-icon md-svg-src="./assets/images/key_icon.svg"></md-icon>oAuth API Key:</h4><div api-key="vm.user.token"></div></div><small>Keep it safe as a password, never show it or release it publicly. The new API uses oAuth but doesn\'t require any Keys for basic queries. Soon you will be able to manage and renew Keys per application. Check the <a target="_blank" href="http://developer.smartcitizen.me/">documentation and have fun!</a></small></div><md-button class="md-raised md-warn" ng-click="vm.removeUser()" type="button">DELETE ACCOUNT</md-button><br><small>Delete your profile will erase ALL your data. Please think twice before clicking this button.</small></div></div></div>');
$templateCache.put('app/components/myProfile/addDeviceSelectorModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Select Kit</h2><span flex=""></span><md-dialog-actions><md-button ng-click="cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></md-dialog-actions></div></md-toolbar><md-dialog-content layout-padding="" layout-margin="" layout="row" layout-xs="column" layout-align-xs="center center"><div class="bg-grey-lightest" layout-padding="" layout="column" layout-align="center center"><img style="max-height: 250px;" src="./assets/images/sckit_1.png" alt=""><p>Legacy SCK 1.0 and 1.1 from 2012 to 2016</p><md-button class="btn-round-new btn-cyan" ui-sref="layout.kitAdd" ng-click="cancel()">Add a kit</md-button></div><div class="bg-grey-lightest" layout-padding="" layout="column" layout-align="center center"><img style="" src="./assets/images/sckit_2.png" alt=""><p>SCK 2.0 and 2.1 from 2017+</p><md-button class="btn-round-new btn-cyan" target="_blank" ng-href="https://start.smartcitizen.me" ng-click="cancel()">Add a kit</md-button></div></md-dialog-content></md-dialog>');
$templateCache.put('app/components/myProfile/myProfile.html','<section class="myProfile_state" layout="column"><div class="profile_header myProfile_header dark"><div class="myProfile_header_container" layout="row"><img ng-src="{{ vm.user.profile_picture || \'./assets/images/avatar.svg\' }}" class="profile_header_avatar myProfile_header_avatar"><div class="profile_header_content"><h2 class="profile_header_name">{{ vm.user.username || \'No data\' }}</h2><div class="profile_header_location"><md-icon md-svg-src="./assets/images/location_icon_light.svg" class="profile_header_content_avatar"></md-icon><span class="md-title" ng-if="vm.user.city">{{ vm.user.city }}</span> <span class="md-title" ng-if="vm.user.city && vm.user.country">,</span> <span class="md-title" ng-if="vm.user.country">{{ vm.user.country }}</span> <span class="md-title" ng-if="!vm.user.city && !vm.user.country">No data</span></div><div class="profile_header_url"><md-icon md-svg-src="./assets/images/url_icon_light.svg" class="profile_header_content_avatar"></md-icon><a class="md-title" ng-href="{{ vm.user.url || \'http://example.com\' }}">{{ vm.user.url || \'No website\' }}</a></div></div></div></div><div class="myProfile_tabs_parent" flex=""><md-tabs md-dynamic-height="" class="myProfile_tabs" md-center-tabs="false" md-selected="vm.startingTab"><md-tab label="" md-on-select="vm.selectThisTab(0, \'kits\')"><md-tab-label><md-icon md-svg-src="./assets/images/kit_details_icon_light.svg" class="myProfile_tab_icon"></md-icon><span class="color-white">KITS</span></md-tab-label><md-tab-body><ui-view></ui-view></md-tab-body></md-tab><md-tab label="" md-on-select="vm.selectThisTab(1, \'user\')"><md-tab-label><md-icon md-svg-src="./assets/images/user_details_icon.svg" class="myProfile_tab_icon"></md-icon><span class="color-white">USER</span></md-tab-label><md-tab-body><ui-view></ui-view></md-tab-body></md-tab></md-tabs></div></section>');
$templateCache.put('app/components/passwordRecovery/passwordRecovery.html','<form name="recovery_form" ng-submit="vm.recoverPassword()" novalidate="" class="form_container recovery_container"><div class="form_contentContainer"><h2 class="form_title">FORGOT YOUR PASSWORD?</h2><div class="form_messageContainer"><p class="form_messageHeader">Citizen action in environmental monitoring</p><p class="form_messageSubheader">You\'re part of them? Feel free to join us!</p><p class="form_messageDescription">Please insert your email address and you will receive an email in your inbox. If you do not receive an email from our team in 10 minutes approx., please check your spam folder.</p></div><div layout="" layout-sm="column" class="formRecovery_field"><md-input-container flex=""><label>Username</label> <input type="text" name="username" ng-model="vm.username" autofocus="" ng-required="recovery_form.$submitted"></md-input-container><p class="form_errors formRecovery_errors" ng-show="vm.errors"><span ng-show="recovery_form.username.$error.required">Valid Username or Email is required</span></p></div></div><md-progress-circular ng-show="vm.waitingFromServer" class="md-hue-3 login_spinner" md-mode="indeterminate"></md-progress-circular><md-button type="submit" class="md-flat md-primary form_button">REQUEST NEW PASSWORD</md-button></form><header style="margin-top:120px" class="footer" ng-include="\'app/components/footer/footer.html\'" layout="row" layout-align="center center"></header>');
$templateCache.put('app/components/passwordRecovery/passwordRecoveryModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Forgot your password?</h2><span flex=""></span><md-button class="md-icon-button" ng-click="cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><md-progress-linear ng-show="waitingFromServer" class="md-hue-3" md-mode="indeterminate"></md-progress-linear><form name="recoveryForm" novalidate="" ng-submit="recoverPassword()"><div class="md-dialog-content max-width-500px"><p>Please insert your email address and you will receive an email in your inbox. If you do not receive an email from our team in 10 minutes approx., please check your spam folder.</p><div layout="" layout-sm="column"><md-input-container flex=""><label>Username or Email</label> <input type="text" name="input" ng-model="input" focus-input="" required=""><div ng-messages="recoveryForm.input.$error"><div ng-message="required">Valid Username or Email is required</div></div></md-input-container></div><md-button ng-click="openSignup()">New here? Sign up</md-button></div><md-button class="btn-blue btn-full" type="submit">REQUEST NEW PASSWORD</md-button></form></md-dialog-content></md-dialog>');
$templateCache.put('app/components/passwordReset/passwordReset.html','<form name="form" novalidate="" ng-submit="vm.answer(vm.form)" class="form_container recovery_container"><div class="form_contentContainer"><h2 class="form_title">ENTER YOUR NEW PASSWORD</h2><div class="form_messageContainer"><p class="form_messageHeader">Citizen action in environmental monitoring</p><p class="form_messageSubheader">You\'re part of them? Feel free to join us!</p></div><div layout="" layout-sm="column" class="formReset_field"><md-input-container flex=""><label>New Password</label> <input type="password" name="newPassword" ng-model="vm.form.newPassword" autofocus="" ng-required="form.$submitted"></md-input-container><p class="form_errors formReset_errors" ng-show="form.$submitted || form.newPassword.$touched"><span ng-show="form.newPassword.$error.required">Password is required</span></p></div><div layout="" layout-sm="column" class="formReset_field"><md-input-container flex=""><label>Confirm Password</label> <input type="password" name="password" ng-model="vm.form.confirmPassword" ng-required="form.$submitted"></md-input-container><p class="form_errors formReset_errors" ng-show="form.$submitted || form.password.$touched"><span ng-show="form.password.$error.required">Password is required</span> <span ng-show="vm.isDifferent && !form.password.$error.required && !vm.errors.password.length">It must be the same password</span> <span ng-show="!!vm.errors.password.length"><span ng-repeat="error in vm.errors.password">Password {{ error }}<span ng-if="!$last">,</span></span></span></p></div></div><md-button class="md-flat md-primary form_button" type="submit">RESET PASSWORD</md-button></form><footer class="footer" ng-include="\'app/components/footer/footer.html\'" layout="row" layout-align="center center"></footer>');
$templateCache.put('app/components/search/search.html','<md-autocomplete id="search" md-selected-item="vm.selectedItem" md-selected-item-change="vm.selectedItemChange(item)" md-search-text="vm.searchText" md-search-text-change="vm.searchTextChange(vm.searchText)" md-items="item in vm.querySearch(vm.searchText)" md-item-text="item.name" placeholder="Search" md-delay="300" md-min-length="3"><md-item-template layout="row" layout-align="start center"><div class="search_results"><img ng-if="item.iconType === \'img\'" ng-src="{{ item.icon }}" class="result_icon"><div ng-if="item.iconType === \'div\'" class="markerSmartCitizenOnline result_icon"></div><span ng-class="{\'result_name\': item.name.length > 0}">{{ item.name }}</span> <span class="result_location">{{ item.location }}</span></div></md-item-template></md-autocomplete>');
$templateCache.put('app/components/signup/signup.html','<md-button class="" ng-click="vm.showSignup($event)">Sign Up</md-button>');
$templateCache.put('app/components/signup/signupModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Sign up</h2><span flex=""></span><md-button class="" ng-click="cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-progress-linear ng-show="waitingFromServer" class="md-hue-3" md-mode="indeterminate"></md-progress-linear><md-dialog-content class="modal signup"><form name="signupForm" novalidate="" ng-submit="vm.answer(signupForm)"><div class="md-dialog-content"><div><p>Join Smart Citizen</p></div><div layout="column"><md-input-container><label>Username</label> <input type="text" name="username" autocomplete="username" ng-model="vm.user.username" focus-input="" required=""><div ng-messages="signupForm.username.$error || !!errors.password.length" role="alert"><div ng-message="required">Username is required</div><div ng-repeat="error in errors.username"><div>Username {{ error }}<span ng-if="!$last">,</span></div></div></div></md-input-container><md-input-container flex=""><label>Password</label> <input name="password" type="password" autocomplete="new-password" ng-model="vm.user.password" required=""><div ng-messages="signupForm.password.$error || !!errors.password.length" role="alert"><div ng-message="required">Password is required</div><div ng-repeat="error in errors.password"><div>Password {{ error }}<span ng-if="!$last">,</span></div></div></div></md-input-container><md-input-container><label>Email</label> <input name="email" type="email" ng-model="vm.user.email" required=""><div ng-messages="signupForm.email.$error || !!errors.email.length" role="alert"><div ng-message="required">Email is required</div><div ng-repeat="error in errors.email" ng-if="!!errors.email.length"><div>Email {{ error }}<span ng-if="!$last">,</span></div></div></div></md-input-container><md-input-container><md-checkbox name="conditions" ng-model="vm.user.conditions" aria-label="Terms and Conditions" required="">I <a ui-sref="layout.policy" ng-click="hide()">have read</a> and accept Terms and Conditions</md-checkbox><div ng-messages="signupForm.conditions.$error || !!errors.conditions.length" role="alert"><div ng-message="required">You have to accept Terms and Conditions first</div><div ng-repeat="error in errors.conditions"><div>{{ error }}<span ng-if="!$last">,</span></div></div></div></md-input-container></div><md-button class="md-primary" ng-click="openLogin()">Already have an account? Log in</md-button></div><md-button class="btn-blue btn-full" type="submit">Sign up</md-button></form></md-dialog-content></md-dialog>');
$templateCache.put('app/components/static/404.html','<section class="not-found-404" flex=""><div id="content-land"><div class="block photo kit-0" data-stellar-background-ratio="0.01"><div class="container" style="height:inherit"><div style="text-align: center; vertical-align: middle;"><div style="margin-top: 200px;"><h2>That\'s a 404</h2><span>We couldn\'t find what you are looking for...</span></div><div style="margin-top: 40px;"><a href="/kits/" style="text-decoration: none" class="btn-black-outline btn-round-new md-button">GO BACK TO THE PLATFORM</a></div></div></div><div class="bullet-landing plus grey"></div></div></div></section>');
$templateCache.put('app/components/static/about.html','<section class="static_page" flex=""><div class="timeline" layout="row"><div class="content" layout="row" layout-align="start center" flex=""><h1>About</h1></div></div><div class=""><div class="content" style="margin-top: 150px"><h2 id="who">Who</h2><p>The project is born within <a href="http://fablabbcn.org" class="about">Fab Lab Barcelona</a> at the <a href="http://www.iaac.net" class="about">Institute for Advanced Architecture of Catalonia</a>, both focused centers on the impact of new technologies at different scales of human habitat, from the bits to geography.</p><div layout="row" layout-align="space-between center"><a href="http://www.fablabbcn.org/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/fablab-bcn.jpg"></md-card></a> <a href="http://www.iaac.net/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/iaac.jpg"></md-card></a> <a href="http://mediainteractivedesign.com/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/mid.jpg"></md-card></a> <a href="#" flex="22"></a></div><div class="subtitle-separation"><h3>Collaborators</h3><div layout="row" layout-align="space-between center"><a href="http://www.hangar.org" flex="22"><md-card><img src="../../../assets/images/who-section-logos/hangar.jpg"></md-card></a> <a href="http://goteo.org/project/smart-citizen-sensores-ciudadanos" flex="22"><md-card><img src="../../../assets/images/who-section-logos/goteo.jpg"></md-card></a> <a href="http://lafosca.cat" flex="22"><md-card><img src="../../../assets/images/who-section-logos/lafosca.jpg"></md-card></a> <a href="http://www.facebook.com/manifiestodesign" flex="22"><md-card><img src="../../../assets/images/who-section-logos/manifesto.jpg"></md-card></a></div></div><div class="subtitle-separation"><h3>Partners</h3><div layout="row" layout-align="space-between center"><a href="http://amsterdamsmartcity.com/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/amsterdam-smart-city.jpg"></md-card></a> <a href="https://www.waag.org/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/waag-society.jpg"></md-card></a> <a href="http://futureeverything.org/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/future-everything.jpg"></md-card></a> <a href="http://cisco.com/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/cisco.jpg"></md-card></a></div><div layout="row" layout-align="space-between center"><a href="http://intel.com/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/intel.jpg"></md-card></a> <a href="http://www.bcn.cat/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/aj-barcelona.jpg"></md-card></a> <a href="http://barcelonacultura.bcn.cat/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/barcelona-cultura.jpg"></md-card></a> <a href="https://arrayofthings.github.io/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/array-things.jpg"></md-card></a></div><div layout="row" layout-align="space-between center"><a href="http://organicity.eu/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/organicity.jpg"></md-card></a> <a href="#" flex="22"></a> <a href="#" flex="22"></a> <a href="#" flex="22"></a></div></div><div class="subtitle-separation"><h3>Crowdfunding</h3><p>This project gets funding thanks to lovely backers on:</p><div flex="100"><h3>Kickstarter 2013</h3></div><div layout="row" layout-xs="column" layout-align="center center"><div flex-xs="100" flex="60" style="padding:20px;"><iframe width="100%" height="240px" src="https://www.kickstarter.com/projects/acrobotic/the-smart-citizen-kit-crowdsourced-environmental-m/widget/video.html" frameborder="0"></iframe></div><div flex-xs="100" flex="30"><iframe frameborder="0" height="430" src="https://www.kickstarter.com/projects/acrobotic/the-smart-citizen-kit-crowdsourced-environmental-m/widget/card.html" width="220"></iframe></div></div><div class="expandable sensor-image-margin"><div class="expandBT"><h3>Goteo 2012</h3></div><div class="expand-panel goteo"><p>You can find more information at <a href="http://goteo.org/project/smart-citizen-sensores-ciudadanos/" class="about">Goteo</a></p><table cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;"><tbody><tr><td width="30%">Garcia</td><td width="30%">Abraham Cembrero Z\xFA\xF1iga</td><td width="30%">Adria (rzcll)</td></tr><tr><td>Aitor Aloa del Teso</td><td>Albert homs</td><td>Alberto P\xE9rez Olaya</td></tr><tr><td>Alexandre Dubor</td><td>Alex Posada</td><td>Alfonso mendoza</td></tr><tr><td>Alvaros_g</td><td>Andr\xE9s Cerezo Guill\xE9n</td><td>\xC1ngel D. Berruezo</td></tr><tr><td>\xC1ngel Mu\xF1oz</td><td>Anna Kaziunas France</td><td>Antic Teatre</td></tr><tr><td>Anto Recio</td><td>Antonio Garc\xEDa Calder\xF3n</td><td>Araceli Corbo</td></tr><tr><td>Areti (IAAC)</td><td>Arnau Ayza</td><td>Arnau Cangr\xF2s i Alonso</td></tr><tr><td>Arturo Saez</td><td>Avenida Sofia Hotel & Spa Sitges</td><td>babisansone</td></tr><tr><td>BaM</td><td>Beatrice Th\xE8ves-Engelbach</td><td>Blance Duarte (blancaivette)</td></tr><tr><td>bzzzbip</td><td>Carlos Bock</td><td>Carlos Iglesias</td></tr><tr><td>castarco</td><td>champloo</td><td>Chema Casanova</td></tr><tr><td>Cliensol energy</td><td>ColaBoraBora</td><td>crisis2smart</td></tr><tr><td>Dani D\xEDaz</td><td>Daniel</td><td>Daniel N\xFCst</td></tr><tr><td>Daniel Saavedra</td><td>Daviba</td><td>David LH</td></tr><tr><td>David Pe\xF1uela</td><td>David Scarlatti</td><td>Davide Gallino</td></tr><tr><td>diegobus</td><td>dpr-barcelona</td><td>dsanchezbote</td></tr><tr><td>dvd (dpa1973)</td><td>Ed Borden</td><td>Ed Mago</td></tr><tr><td>edward hollands</td><td>El Franc</td><td>Eloi Garrido</td></tr><tr><td>Eloi Maduell</td><td>Emil Lima</td><td>Emily Sato</td></tr><tr><td>enricostn</td><td>ernesto guillen fontalba</td><td>esenabre</td></tr><tr><td>Eusebio Reyero</td><td>Eva Saura</td><td>Fabien Girardin</td></tr><tr><td>Felix Dubor</td><td>F\xE9lix Pedrera Garc\xEDa</td><td>Franz Jimeno</td></tr><tr><td>Fred Adam</td><td>Felix Sainz</td><td>G!N</td></tr><tr><td>Gabo</td><td>Gerald Kogler y Marti Sanchez</td><td>Gil Obradors</td></tr><tr><td>hHenri Aboulker</td><td>hexxan labs</td><td>pfaffsandy</td></tr><tr><td>Iker Jimenez</td><td>ilitch</td><td>Inigo Barrera</td></tr><tr><td>Javier A. Rodr\xEDguez</td><td>Javier Montaner</td><td>Javier S\xE1nchez</td></tr><tr><td>Jean-Baptiste HEREN</td><td>jnogueras</td><td>Joan Vall\xE9s</td></tr><tr><td>Jordi Ferran</td><td>Jorge Daniel Czajkowski</td><td>Jorge Sanz</td></tr><tr><td>Jos\xE9 Costoya</td><td>Jos\xE9 (politema)</td><td>Jose M Arbones Mainar</td></tr><tr><td>Jose Manuel</td><td>Josep Perell\xF3</td><td>josianito</td></tr><tr><td>Juan Saura Ram\xEDrez</td><td>Juanjo Frechilla</td><td>J\xFAlia L\xF3pez i Ventura</td></tr><tr><td>Juli\xE1n C\xE1naves</td><td>Kincubator</td><td>laia s\xE1nchez</td></tr><tr><td>LauraFdez</td><td>Lucas Cappelli</td><td>Luis (Fraguada)</td></tr><tr><td>Mara Balestrini</td><td>Marc (Pous)</td><td>Marc Garriga</td></tr><tr><td>marcabra (Bravalero(</td><td>Maria Mu\xF1oz</td><td>Marianella (Coronell)</td></tr><tr><td>marioarienza</td><td>Marita Bom</td><td>Marte Roel</td></tr><tr><td>mborobio</td><td>memojoelojo</td><td>Miguel Senabre</td></tr><tr><td>Miquel Colomer</td><td>miska (Goteo)</td><td>Mois\xE9s Fern\xE1ndez</td></tr><tr><td>monica donati</td><td>nadya</td><td>Natassa Pistofidou</td></tr><tr><td>Norella Coronell</td><td>Nuriona</td><td>Olivier (schulbaum)</td></tr><tr><td>Oriol Ferrer Mesi\xE0</td><td>Pablo Rey Trist\xE1n</td><td>Parque Cient\xEDfico y Tecnol\xF3gico de Bizkaia</td></tr><tr><td>Pilar Conesa</td><td>pang</td><td>Raf</td></tr><tr><td>Paula Baptista</td><td>Pere Casas Puig</td><td>Rocio Holzer</td></tr><tr><td>Ra\xFAl Micharet</td><td>Solo01</td><td>Rob Aalders</td></tr><tr><td>viriatov</td><td>Roberto (Madman)</td><td>Santiago Vilanova</td></tr><tr><td>Salvador Ejarque</td><td>pmisson</td><td>Sergi Mart\xEDnez</td></tr><tr><td>Sim\xF3n Lee</td><td>SirViente</td><td>SMD Arq (Oriol)</td></tr><tr><td>Vicen\xE7 Sampera</td><td>VideoDossier</td><td>Henri Boulker</td></tr><tr><td>tiefpunkt (Severin)</td><td>xa2 (Diaz)</td><td>Xavi Polo</td></tr><tr><td>Xixo</td><td>Zeca (Fernandez)</td><td></td></tr></tbody></table></div></div></div><div layout="column" class="subtitle-separation"><h2>Team</h2><div class="team-cells-margin"><h4 class="no-margin">Tomas Diez</h4><p class="no-margin">Co-founder</p></div><div class="team-cells-margin"><h4 class="no-margin">Alex Posada</h4><p class="no-margin">Co-founder</p></div><div class="team-cells-margin"><h4 class="no-margin">Guillem Camprodon</h4><p class="no-margin">Project director</p></div><div class="team-cells-margin"><h4 class="no-margin">M.A. Heras</h4><p class="no-margin">Hardware design and development</p></div><div class="team-cells-margin"><h4 class="no-margin">V\xEDctor Barber\xE1n</h4><p class="no-margin">Hardware and software design and development</p></div><div class="team-cells-margin"><h4 class="no-margin">\xD3scar Gonz\xE1lez</h4><p class="no-margin">Data analysis, sensor calibration and software development</p></div><div class="team-cells-margin"><h4 class="no-margin">Viktor Sm\xE1ri</h4><p class="no-margin">Full stack developer and system administrator</p></div><div class="team-cells-margin"><h4 class="no-margin">Marcel Rogriguez</h4><p class="no-margin">Media and graphic design</p></div><div class="team-cells-margin"><h4 class="no-margin">Tue M. Ngo</h4><p class="no-margin">Front-end developer</p></div><div class="team-cells-margin"><h4 class="no-margin">Aitor Aloa</h4><p class="no-margin">Customer support and logistics</p></div><div class="team-cells-margin"><h4 class="no-margin">Mara Balestrini</h4><p class="no-margin">Communities development consultant</p></div><div class="team-cells-margin"><h4 class="no-margin">Enrique Perotti</h4><p class="no-margin">Industrial design consultant</p></div><div class="team-cells-margin"><h4 class="no-margin">Alejandro Bizzotto</h4><p class="no-margin">Hardware design consultant</p></div></div><div class="subtitle-separation"><h2>Former team and collaborators</h2><p>We would like to thank the effort and contributions to the project of all the former team members and collaborators who helped the project since 2012.</p><div class="team-cells-margin"><h4 class="no-margin">Alexandre Dubor</h4><p class="no-margin">First platform design, programming and development</p></div><div class="team-cells-margin"><h4 class="no-margin">Leonardo Arrata</h4><p class="no-margin">Platform and mobile app design and development</p></div><div class="team-cells-margin"><h4 class="no-margin">Xavier Vinaixa</h4><p class="no-margin">Original platform API and mobile app development</p></div><div class="team-cells-margin"><h4 class="no-margin">Gabriel Bello-Diaz</h4><p class="no-margin">First platform design</p></div><div class="team-cells-margin"><h4 class="no-margin">Jorren Schauwaert</h4><p class="no-margin">Project management and communication</p></div><div class="team-cells-margin"><h4 class="no-margin">Alejandro Andreu</h4><p class="no-margin">Original project documentation and project revision</p></div><div class="team-cells-margin"><h4 class="no-margin">Rub\xE9n Vicario</h4><p class="no-margin">New web platform development</p></div><div class="team-cells-margin"><h4 class="no-margin">M\xE1ximo Gavete</h4><p class="no-margin">New web platform platform design</p></div><div class="team-cells-margin"><h4 class="no-margin">\xC1ngel Mu\xF1oz</h4><p class="no-margin">Hardware research and development</p></div><div class="team-cells-margin"><h4 class="no-margin">M\xE1ximo Perez</h4><p class="no-margin">Hardware research and development</p></div></div><div id="contact" class="subtitle-separation"><h2>Contact Us</h2><p>Please feel free to <a class="about" href="mailto:info@smartcitizen.me">contact us.</a> We will answer you as soon as possible!</p></div></div><img src="./assets/images/sck_front.jpg" class="full-width-img"></div></section>');
$templateCache.put('app/components/static/policy.html','<section class="static_page" flex=""><div class="timeline" layout="row"><div class="content" layout="row" layout-align="start center" flex=""><h1>Policy</h1></div></div><div class=""><div class="content" style="margin-top: 150px"><h2>Content</h2><ul id="policy-toc"><li class="policy-toc" id="header"><a href="#terms-of-use">Terms of use</a></li><ul><li class="policy-toc"><a href="#general-terms">General terms</a></li><li class="policy-toc"><a href="#uploading-content">Using the Platform and uploading Content</a></li><li class="policy-toc"><a href="#downloading-content">Using the Platform to access Content</a></li></ul><li class="policy-toc" id="header"><a href="#policy">Privacy Policy</a></li><ul><li class="policy-toc"><a href="#policy-purpose">The purpose of this Privacy Policy</a></li><li class="policy-toc"><a href="#changes">Changes to the Privacy Policy</a></li><li class="policy-toc"><a href="#personal-data">Personal Data processed</a></li><li class="policy-toc"><a href="#processing-purposes">Processing purposes</a></li><li class="policy-toc"><a href="#personal-data-comm">Personal Data communication by Smart Citizen</a></li><li class="policy-toc"><a href="#user-rights">Your rights</a></li><li class="policy-toc"><a href="#personal-data-storage">Personal Data storage and transmission within the European Union</a></li><li class="policy-toc"><a href="#data-security">Security of you Data and data breach</a></li><li class="policy-toc"><a href="#other-sites">Other websites and applications</a></li><li class="policy-toc"><a href="#data-controller">Data Controller and contacts</a></li></ul></ul><h2 id="terms-of-use" name="terms-of-use">Terms of use</h2><h3 id="general-terms">1. General terms</h3><h4>1. Your relationship with Smart Citizen</h4><p>1. Please note that your use of Smart Citizen website (www.smartcitizen.me) and any possible software or tool provided to you for the access/registration to and/or the use of the website <b>(hereinafter the "Platform")</b> is subject to the terms of a legal agreement between you and Institut d\'Arquitectura Avan\xE7ada de Catalunya Fundaci\xF3 Privada - Barcelona, Pujades 102, Barcelona - 08005 <b>(hereinafter "Smart Citizen")</b>. By using the Platform you acknowledge, accept and agree with these Terms of Use and the Privacy Policy.</p><p>2. The legal agreement between you and Smart Citizen governing the use of the Platform is made up of the terms and conditions set out in this document <b>(hereinafter the "Terms of Use")</b> and the Smart Citizen\'s privacy policy available at <a href="#policy" class="about">Privacy policy</a> <b>(hereinafter the "Privacy Policy")</b> (collectively called the "Terms").</p><p>3. The Terms form a legally binding agreement between you and Smart Citizen in relation to your use of the Platform. It is important that you take the time to read them carefully.</p><p>4. The Terms apply to all users of the Platform, including those who are also contributing to it by uploading on the Platform data captured thought the Smart Citizen Kit <b>(hereinafter the "SCK")</b>.</p><h4>2. Accepting the Terms</h4><p>1. The Terms constitute an agreement between you, the User of the Platform, and Smart Citizen. If you do not agree to these Terms, you should stop using the Platform immediately.</p><p>2. If you do use the Platform, your use shall be deemed to confirm your acceptance of the Terms and your agreement to be a party to this agreement.</p><h4>3. Changes to the Terms</h4><p>1. Smart Citizen reserves the right to make changes to the Terms from time to time, for example to address changes to the law or regulatory changes or changes to functionality offered through the Platform.</p><p>2. If such changes occur, Smart Citizen will do its best to provide you with advance notice, although in some situations, such as where a change is required to satisfy applicable legal requirements, an update to these Terms may need to be effective immediately. Smart Citizen will announce changes directly on the Platform and it also may elect to notify you of changes by sending an email to the address you have provided to it. In any case, the revised version of Terms of Use will be always accessible at <a href="#terms-of-use" class="about">Terms of use</a> and the revised version of the Privacy Policy will be accessible at <a href="#policy" class="about">Privacy policy</a>.</p><p>3. If Smart Citizen does update the Terms, you are free to decide whether to accept the revised terms or to stop using the Platform. Your continued use of the Platform after the date the revised Terms are posted will constitute your acceptance of these new Terms.</p><p>4. You understand and agree that You are solely responsible for periodically reviewing the Terms.</p><p>5. Except for changes made by Smart Citizen as described above, no other amendment or modification of these Terms shall be effective unless set forth in a written agreement bearing a written signature by you and Smart Citizen. For clarity, email or other communications will not constitute an effective written agreement for this purpose.</p><h4>4. The Smart Citizen Platform</h4><p>1. The Smart Citizen Platform is born as part of a project within Fab Lab Barcelona (<a href="https://fablabbcn.org" target="_blank" class="about">fablabbcn.org</a>) at the Institute for Advanced Architecture of Catalonia (<a href="http://iaac.net" target="_blank" class="about">iaac.net</a>). It is actively maintained by Fab Lab Barcelona, and receives contributions from freelancers, collaborators and the open source community.</p><p>2. Smart Citizen project is based on the use of free hardware and software for data collection and sharing. It aims at generating participatory processes for people in cities. Connecting data, people and knowledge, the objective of the project is to serve as a platform for building productive and open indicators and thereafter the collective construction of the city for its own inhabitants.</p><p>3. Anyone can purchase a Smart Citizen Kit. The SCK is an open source electronic sensor board equipped with environmental metrics such as air quality, temperature, sound, humidity and light quantity sensors, containing a battery charger and equipped with a WiFi antenna that allows to upload data from the sensors in real time to the Platform and make it available to the community.</p><p>4. In order to share data captured with the SCK and/or access to other user\'s data on the Platform, it is necessary to register and create a Smart Citizen account.</p><h4>5. Creating a Smart Citizen account</h4><p>1. In order to use the Platform, you need to create a Smart Citizen account. You create an account by providing Smart Citizen with username and email address and creating a password <b>(hereinafter "Account Information\u201D)</b>.</p><p>2. You are the only responsible for maintaining the accuracy, completeness and confidentiality of your Account Information, and you will be responsible for all activities that occur under your account, including activities of others to whom you have provided your Account Information. Smart Citizen is not be liable for any loss or damage arising from your failure to provide accurate information or to keep your Account Information secure. If you discover any unauthorized use of your Account Information or suspect that anyone may be able to access your private Content, you should immediately change your password and notify the Support team at the following address <a href="mailto:support@smartcitizen.me" class="about">link</a>.</p><h4>6. Changes to the Platform</h4><p>1. We retain the right, in our sole discretion, to implement new elements as part of and/or ancillary to the Platform, including changes that may affect its previous mode of operation.</p><p>2. We also reserve the right to establish limits to the nature or size of storage available to you, the number of transmissions and email messages, execution of you program code, your Content and other data, and impose other limitations at any time, with or without notice.</p><p>3. You agree that Smart Citizen has no responsibility or liability as a result of, without limitation, the deletion of, or failure to make available to you, any Content. You agree that we shall not be liable to you or to any third party for any modification, suspension or discontinuance of any part of the Platform.</p><h4>7. Termination</h4><p>1. You may close your Platform account at any time, for any reason (or no reason), and you do not even have to give us notice.</p><p>2. Smart Citizen may suspend access to your account, or close your account according to these Terms. Reasons for Smart Citizen suspending or closing your account may include, without limitation: (i) breach or violation of these Terms or any other agreement between you and Smart Citizen and related to the use of the Platform, (ii) the discontinuance or material modification of the Platform (or any part thereof) or (iii) unexpected technical or security issues or problems. In most cases, in the event we elect to close your account, we will provide at least 30 days advance notice to you at the email address you have provided at the creation of the account. After the expiration of this notice period, you will no longer be able to retrieve Content contained in that account or otherwise use the Platform through that account.</p><p>3. Smart Citizen shall not be liable to you or any third party for termination of the Platform.</p><p>4. All disclaimers, limitations of warranties and damages, and confidential commitments set forth in these Terms of Use or otherwise existing at law survive any termination, expiration of these Terms of Use.</p><h4>8. Third-Party Links, applications or APIs</h4><p>1. We may include or recommend third party resources, materials and developers and/or links to third party websites and applications as part of, or in connection with, the Platform. We have no control over such sites or developers and, accordingly, you acknowledge and agree that (i) we are not responsible for the availability of such external sites or applications; (ii) we are not responsible or liable for any content or other materials or performance available from such sites or applications and (iii) we shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, materials or applications.</p><h4>9. Indemnity</h4><p>1. You agree to indemnify and hold Smart Citizen, its subsidiaries, affiliates, officers, agents, employees, advertisers and partners harmless from and against any and all claims, liabilities, damages (actual and consequential), losses and expenses (including legal and other professional fees) arising from or in any way related to any third party claims relating to your use of any of the Platform, any violation of these Terms of Use or any other actions connected with your use of the Platform (including all actions taken under your account). In the event of such claim, we will provide notice of the claim, suit or action to the contact information we have for the account, provided that any failure to deliver such notice to you shall not eliminate or reduce your indemnification obligation hereunder.</p><h4>10. High Risk Activities</h4><p>1. The Smart Citizen Platform and the Smart Citizen Kit are not fault-tolerant and are not designed, manufactured or intended for use as or with on-line control equipment in hazardous environments requiring fail-safe performance, such as in the operation of nuclear facilities, aircraft navigation or communication systems, air traffic control, direct life support machines or weapon systems in which the failure of the Platforms could lead directly to death, personal injury or severe physical or environmental damage ("High Risk Activities"). Accordingly, Smart Citizen and its suppliers specifically disclaim any express or implied warranty of fitness for High Risk Activities.</p><h4>11. Miscellaneous</h4><p>1. These Terms of Use shall be governed by and construed in accordance with Spanish laws, without giving effect to any principles of conflict of law. You agree that any action at law or in equity arising out of or relating to these Terms of Use shall be filed only in Spanish Courts and you hereby consent and submit to the personal jurisdiction of such courts for the purposes of litigating any such action.</p><p>2. No party shall be liable for any performance failure, delay in performance, or lost data under these Terms of Use due to causes beyond that party\'s reasonable control and occurring without its fault or negligence.</p><p>3. The failure of Smart Citizen to partially or fully exercise any right shall not prevent the subsequent exercise of such right. The waiver by Smart Citizen of any breach shall not be deemed a waiver of any subsequent breach of the same or any other term of these Terms of Use. No remedy made available to Smart Citizen by any of the provisions of these Terms of Use is intended to be exclusive of any other remedy, and each and every remedy shall be cumulative and in addition to every other remedy available at law or in equity.</p><p>4. All products, company names, brand names, trademarks and logos are the property of their respective owners.</p><h4>12. Software Licenses</h4><p>1. The Platform software is composed of three main items: (i) the <a href="https://smartcitizen.me" target="_blank" class="about">Smart Citizen Website</a>, which aims to provide a visual website where the project environmental sensors can be accessed in near real time; (ii) the <a href="https://api.smartcitizen.me/v0/" target="_blank" class="about">Smart Citizen API</a>, which provides a REST interface for all the functionalities available on the Website; and (iii) the <a href="https://start.smartcitizen.me" target="_blank" class="about">Onboarding app</a>, which aims to facilitate the process of sensor setup. More information is available in the <a href="https://docs.smartcitizen.me/Data/Sensor%20Platform/#software-components" target="_blank" class="about">official documentation</a>.</p><p>2. All the software of the Platform is Licensed through GNU Affero General Public License v3.0. A full text of this license can be accessed in <a href="https://github.com/fablabbcn/smartcitizen-api/blob/master/LICENSE" target="_blank" class="about">this link</a>. All it\'s source code is available in the official repositories for anyone to explore, copy or remake: <a href="https://github.com/fablabbcn/smartcitizen-api" target="_blank" class="about">smartcitizen-api</a>, <a href="https://github.com/fablabbcn/smartcitizen-onboarding-app-start" target="_blank" class="about">smartcitizen-onboarding-app</a> and <a href="https://github.com/fablabbcn/smartcitizen-web" target="_blank" class="about">smartcitizen-web</a>.</p><h3 id="uploading-content">2. Using the Platform and uploading Content</h3><p>The terms below apply to those users of the Platform that will interact with it uploading content, such as creating devices in it, uploading sensor readings, or personal information.</p><h4>1. General terms</h4><p>1. Your use of the Platform shall be in accordance with these Terms. You agree that you are the only responsible for your own conduct and all conduct under your account.</p><p>2. Once your account is created and you accept these Terms, we grant you a limited, non-exclusive license to use the Platform subject to these Terms, for so long as you are not barred from using the Platform under the laws applicable to you, until you voluntarily close your account or until we close your account pursuant to these Terms. You do not obtain any other right or interest in the Platform.</p><p>3. In order to share sensor readings captured with the SCK <b>(hereinafter the "sensor readings")</b> it is necessary to register and create a Smart Citizen account.</p><p>4. You agree that you are the sole responsible as the person who created the Content or introduced it into the Platform. This applies whether the Content is kept private, shared or transmitted using the Platform or any third party application or services integrated with the Platform.</p><p>5. Smart Citizen does not select or screen Content, and does not review, test, confirm, approve or verify any user data or Content or the accuracy of it. Smart Citizen access to/storing of/use of Content does not imply or create any liability on the part of it.</p><h4>2. Restricted use of the Platform</h4><p>1. You agree not to use the Platform for any illegal purpose nor to post, distribute, or otherwise make available or transmit any data, software or other computer files that (i) contain a virus, trojan horse, worm or other harmful or destructive component, (ii) infringe third parties\' rights (intellectual property rights and personality rights).</p><p>2. You agree not to alter or modify any part of the Platform and its related technologies nor to (or attempt to) circumvent, disable or otherwise interfere with any security related features of the Platform.</p><p>3. You agree that you are solely responsible for (and that Smart Citizen has no responsibility to you or to any third party for) any breach of your obligations under the Terms and for the consequences of any such breach.</p><h4>3. Content rights and licenses</h4><p>1. You retain copyright and any other rights you already held in your Content before you submitted, posted or displayed it on or through the Platform. Other than the limited license and other rights you grant in these Terms, Smart Citizen acknowledges and agrees that it do not obtain any right, title or interest from you under these Terms in any of your Content.</p><p>2. By using the Platform and uploading you grant Smart Citizen a limited license in order to make your data accessible and usable on the Platform. Thus, you grant Smart Citizen a license to display, execute, and distribute any of your Content and to modify for technical purposes and reproduce such Content to enable Smart Citizen to operate the Platform. You also agree that Smart Citizen has the right to elect not to accept, post, execute, store, display, publish or transmit any Content. You agree that these rights and licenses are royalty free, irrevocable and worldwide (for so long as your Content is accessible on the Platform), and include a right for Smart Citizen to make such Content available to, and pass these rights along to, others with whom this latter has contractual relationships related to the provision of the Platform, solely for the purpose of providing Platform\'s services, and to otherwise permit access to or disclose your Content to third parties if it determines such access is necessary to comply with its legal obligations.</p><p>3. Except as described in these Terms of Use, unless you elect to enable others to view or have access to the Content you submit to the Platform, no one else should see your Content without your consent. Of course, if you do elect to publish or share any portion of your Content by creating a feed of information, or creating a webservice to publish Content, then you would be enabling each of those permitted users to access, use, display, perform, distribute and modify your Content. In addition, Smart Citizen enables you to use a variety of third party services and applications that interact with the Platform and your Content, and you should review the access rights you provide to those services or applications, as you may enable them to access your Content through your agreements with those parties.</p><p>4. You also represent and warranty that, by submitting Content to the Platform and granting Smart Citizen the rights described in these Terms, you are not infringing the rights of any person or third party.</p><h3 id="downloading-content">3. Using the Platform to access Content</h3><h4>1. General terms</h4><p>1. The Platform Data is made available under the Open Database License: <a href="http://opendatacommons.org/licenses/odbl/1.0/" class="about">http://opendatacommons.org/licenses/odbl/1.0/</a>. Any rights in individual contents of the database are licensed under the Database Contents License: <a href="http://opendatacommons.org/licenses/dbcl/1.0/" class="about">http://opendatacommons.org/licenses/dbcl/1.0/</a></p><p>2. All sensor readings in the platform are public and can be viewed in the Smart Citizen Website without user registration. Additionally, sensor readings can be downloaded from any device without user registration through the Smart Citizen API <b>(hereinafter the "API")</b>. The API is a publicly available interface allowing anyone to develop applications and experiments on top of the Smart Citizen Platform. There is an exception to this for devices marked as <b>private</b>, in which case, sensor readings and sensor information will not be available for anyone except the device\'s owner. Marking a device as private is only available for the device owner and no one else.</p><p>3. Smart Citizen is not liable for the Content or accuracy of any information, and shall not be responsible for any acts taken or decisions made based on such information.</p></div></div><div class=""><div class="content"><h2 id="policy" name="policy">Privacy Policy</h2><p>This Privacy Policy explains what information Smart Citizen collects about you and why. Please read it carefully.</p><h3 id="policy-purpose">1. The purpose of this Privacy Policy</h3><p>1. This Privacy Policy shall be read together with and in accordance with Smart Citizen Platform Terms of Use available at <a href="#terms-of-use" class="about">Terms of use</a> <b>(hereinafter the "Terms of Use")</b>, and applies to the personal data obtained by Smart Citizen through your use of the Smart Citizen Platform. The terms and definition used in this Privacy Policy shall have the meanings provided for in the Terms of Use if not otherwise defined.</p><h3 id="changes">2. Changes to the Privacy Policy</h3><p>1. According to Smart Citizen evolution, we may need to update this Privacy Policy and change in the Terms of Use. We will always maintain our commitment to respect your privacy and comply with the laws applicable to us and to you.</p><p>2. We will always publish any revised Privacy Policy, along with its effective date, in the following page <a href="#policy" class="about">Privacy policy</a>.</p><p>3. If required by applicable law, we will obtain your consent to such changes. In the other cases, please note that your continuation of your Smart Citizen Platform account after any change means that you agree with, and consent to be bound by, the revised Privacy Policy. If you disagree with any changes and do not wish your personal data to be subject to the revised Policy, you will need to close your account before the new Policy becomes effective.</p><h3 id="personal-data">3. Personal Data processed</h3><p>1. In order to operate the Platform, Smart Citizen collects users\' personal data related to the creation and the maintenance of the Platform account. This information is limitted to your username, and email address. ("<b>Personal Account Information</b>").</p><p>2. Smart Citizen also passively stores Content you add/post/upload to your account but it does not autonomously collect or process this Content for its own purposes. You remain the only responsible, liable of the Content, and the only data controller in relation to personal data possibly published/uploaded in your account.</p><h3 id="processing-purposes">4. Processing purposes</h3><p>1. All Personal Data received from you will be treated fairly and lawfully.</p><p>1.1. The processing of Personal Account Information: (i) allows Smart Citizen to create and maintain your account, operate the Platform and provide the service; (ii) helps Smart Citizen communicate with you about your use of the Platform as well as answer to your assistance requests (iii) may be used by Smart Citizen for marketing purposes such as sending information material (i.e. commercial communications) and marketing emails. Providing your Personal Data for marketing purposes is a mere faculty and you are able to revoke your consent at any time (you can opt-out of such communications at any time by clicking the "unsubscribe" link found within Smart Citizen email). Any non-submission of Persona Data for such activities will have no consequence on the user\'s possibility to use the services and features offered by the Platform.</p><p>1.2. Anonymous Data and automatic data collection tools: as you navigate through Smart Citizen Platform, certain anonymous information will be gathered without your actively providing the information. This is done without collecting any personal data or personally identifiable information (PII), without using cookies and while respecting the privacy of the website visitors. This information is collected using <a href="https://plausible.io/data-policy#how-we-count-unique-users-without-cookies">Plausible Analytics</a> and used exclusively for statistical purposes and in anonymous form in relation to the access of the Platform. Momentary in case of an anomalous conditions during the execution of the platform, data is automatically collected using <a href="https://help.sentry.io/account/legal/are-you-compliant-with-general-data-protection-regulation-gdpr/">Sentry.io</a> for purposes of reporting the software issue and monitor the correct functioning of the Platform.</p><h3 id="personal-data-comm">5. Personal Data communication by Smart Citizen</h3><p>1. Smart Citizen is not in the business of selling or renting user information, and it only discloses Personal data when: (i) we have your explicit consent to share the information; (ii) we believe it is necessary to investigate potential violations of our Terms of Use, to enforce them, or when we believe it is necessary to investigate, prevent or take action regarding illegal activities, suspected fraud or potential threats against persons, property or the systems on which we operate the Platform or (iii) in any other case provided for by the applicable law, including compliance with warrants, court orders or other legal process.</p><h3 id="user-rights">6. Your rights</h3><p>1. Data subjects have the right to ask for confirmation, amendment, update and cancellation of her/his personal data as well as oppose unlawful processing.</p><p>2. If you wish to (i) access any personal data Smart Citizen hold about you; (ii) request that Smart Citizen corrects or deletes your personal data. We will comply with such requests to the extent permitted or required by applicable laws.</p><h3 id="personal-data-storage">7. Personal Data storage and transmission within the European Union</h3><p>1. When you use Smart Citizen Platform your Personal Data will be stored in servers which are currently located in the European Union. By using Smart Citizen Platform you are confirming your consent to such information, including Personal Information and Content, being hosted and accessed in these servers.</p><h3 id="data-security">8. Security of you Data and data breach</h3><p>1. Smart Citizen is committed to protecting the security of your information and takes reasonable precautions to protect it. However, Internet data transmissions, whether wired or wireless, cannot be guaranteed to be 100% secure, and as a result, Smart Citizen cannot ensure the security of information you transmit by using the Platform. Accordingly, you acknowledge that you do so at your own risk. Once Smart Citizen receive your data transmission, we make all commercially reasonable efforts to ensure its security on our systems.</p><p>2. If Smart Citizen learns of a security system breach, we will notify you and provide information on protective steps, if available, through the email address that you have provided to Smart Citizen or by posting a notice on our Platform.</p><h3 id="other-sites">9. Other websites and applications</h3><p>1. The Platform may contain links to other websites and applications. Smart Citizen is not responsible for the privacy policies or privacy practices of any third party.</p><h3 id="data-controller">10. Data Controller and contacts</h3><p>1. The data controller in relation to the Persona Data as defined and described above is: <a href="http://iaac.net/" target="_blank" class="about"><span class="">INSTITUT d\u2019ARQUITECTURA AVAN\xC7ADA DE CATALUNYA</span></a></p><p>2. If you have questions, comments or concerns about this Privacy Policy, please contact us by email at <a href="mailto:info@smartcitizen.me" class="about">info@smartcitizen.me</a>.</p></div></div></section>');
$templateCache.put('app/components/static/static.html','<section class="static_page" flex=""><div class="timeline" layout="row"><div class="content" layout="row" layout-align="start center" flex=""><h1>Title</h1></div></div><div class=""><div class="content"><h2>Heading 2</h2><h3>Heading 3</h3><h4>Heading 4</h4><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam a porta quam. Phasellus tincidunt facilisis blandit. Aenean tempor diam quis turpis vestibulum, ac semper turpis mollis. Sed ac ultricies est. Vivamus efficitur orci efficitur turpis commodo dignissim. Aliquam sagittis risus in semper ullamcorper. Sed enim diam, tempus eget lorem sit amet, luctus porta enim. Nam aliquam mollis massa quis euismod. In commodo laoreet mattis. Nunc auctor, massa ut sollicitudin imperdiet, mauris magna tristique metus, quis lobortis ex ex id augue. In hac habitasse platea dictumst. Sed sagittis iaculis eros non sollicitudin. Sed congue, urna ut aliquet ornare, nisi tellus euismod nisi, a ullamcorper augue arcu sit amet ante. Mauris condimentum ex ante, vitae accumsan sapien vulputate in. In tempor ligula ut scelerisque feugiat. Morbi quam nisi, blandit quis malesuada sit amet, gravida ut urna.</p><md-button class="md-primary md-raised">button</md-button><md-button class="md-primary">button</md-button></div></div><div class=""><div class="content"><h2>Heading 2</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam a porta quam. Phasellus tincidunt facilisis blandit. Aenean tempor diam quis turpis vestibulum, ac semper turpis mollis. Sed ac ultricies est. Vivamus efficitur orci efficitur turpis commodo dignissim. Aliquam sagittis risus in semper ullamcorper. Sed enim diam, tempus eget lorem sit amet, luctus porta enim. Nam aliquam mollis massa quis euismod. In commodo laoreet mattis. Nunc auctor, massa ut sollicitudin imperdiet, mauris magna tristique metus, quis lobortis ex ex id augue. In hac habitasse platea dictumst. Sed sagittis iaculis eros non sollicitudin. Sed congue, urna ut aliquet ornare, nisi tellus euismod nisi, a ullamcorper augue arcu sit amet ante. Mauris condimentum ex ante, vitae accumsan sapien vulputate in. In tempor ligula ut scelerisque feugiat. Morbi quam nisi, blandit quis malesuada sit amet, gravida ut urna.</p></div></div><div class=""><div class="content"><h2>Small section</h2><p>Single line comment.</p></div></div></section>');
$templateCache.put('app/components/static/styleguide.html','<div class="styleguide"><section class="profile_header"><h1>Smart Citizen Style Guide</h1></section><section layout="column" layout-gt-sm="row"><div class="profile_sidebar pt-80"><p class="profile_sidebar_title text-center">MENU</p><div layout="column"><button class="profile_sidebar_button md-button md-default-theme">Fonts</button> <button class="profile_sidebar_button md-button md-default-theme">Buttons</button> <button class="profile_sidebar_button md-button md-default-theme">Colors</button></div></div><div flex="" class="pt-80 px-40"><h2 class="">CSS help classes</h2><div class="ml-10 bg-green">ml-10</div><div class="ml-20 bg-green">ml-20</div><div class="ml-30 bg-green">ml-30</div><div class="ml-50 bg-green">ml-50</div><div class="mb-10 bg-blue">mb-10</div><div class="mb-20 bg-blue">mb-20</div><div class="mb-30 bg-blue">mb-30</div><div class="mb-50 bg-blue">mb-50</div><div class="mr-10 bg-red-light">mr-10</div><div class="mr-20 bg-red-light">mr-20</div><div class="mr-30 bg-red-light">mr-30</div><div class="mr-50 bg-red-light">mr-50</div><div class="mt-10 bg-green">mt-10</div><div class="mt-20 bg-green">mt-20</div><div class="mt-30 bg-green">mt-30</div><div class="mt-50 bg-green">mt-50</div><h2 class="">Font style - Light theme</h2><a href="https://material.angularjs.org/latest/CSS/typography" target="_blank">Read more about AngularJS Material Typography here</a><div layout="column" class="section-padding" style="border:1px solid rgba(0,0,0,0.12)"><div layout="row"><h1 flex="50">h1 Heading</h1><h1 class="info-text" flex="30">2.2 em</h1><h1 class="info-text" flex="20">normal</h1></div><md-divider></md-divider><div layout="row"><h2 flex="50">h2 Heading</h2><h2 class="info-text" flex="30">1.7 em</h2><h2 class="info-text" flex="20">normal</h2></div><md-divider></md-divider><div layout="row"><h3 flex="50">h3 Heading</h3><h3 class="info-text" flex="30">1.3 em</h3><h3 class="info-text" flex="20">bold</h3></div><md-divider></md-divider><div layout="row"><h4 flex="50">h4 Heading</h4><h4 class="info-text" flex="30">1.1 em</h4><h4 class="info-text" flex="20">normal</h4></div><md-divider></md-divider><div layout="row"><p flex="50">Paragraph</p><p class="info-text" flex="30">1 em</p><p class="info-text" flex="20">normal</p></div><md-divider></md-divider><div layout="row"><p flex="50">Paragraph info</p><p class="info-text" flex="30">1 em</p><p class="info-text" flex="20">lighter</p></div><small>Small text</small></div><h2>Font style - Dark theme</h2><div class="dark-text-section section-padding"><div layout="row"><h1 flex="50">h1 Heading</h1><h1 flex="30" class="info-text-dark">1.8 em</h1><h1 flex="20" class="info-text-dark">normal</h1></div><md-divider class="dark-theme-divider"></md-divider><div layout="row"><h2 flex="50">h2 Heading</h2><h2 flex="30" class="info-text-dark">1.7 em</h2><h2 flex="20" class="info-text-dark">normal</h2></div><md-divider class="dark-theme-divider"></md-divider><div layout="row"><h4 flex="50">h4 Heading</h4><h4 flex="30" class="info-text-dark">1.1 em</h4><h4 flex="20" class="info-text-dark">normal</h4></div><md-divider class="dark-theme-divider"></md-divider><div layout="row"><h6 flex="50">h6 Heading</h6><h6 flex="30" class="info-text-dark">0.75 em</h6><h6 flex="20" class="info-text-dark">bold</h6></div><md-divider class="dark-theme-divider"></md-divider><div layout="row"><p flex="50">Paragraph</p><p flex="30" class="info-text-dark">1 em</p><p flex="20" class="info-text-dark">lighter</p></div><md-divider class="dark-theme-divider"></md-divider><br><small>Small text</small></div><h2>Buttons</h2><div layout="column" layout-wrap="" class="section-padding" style="border:1px solid rgba(0,0,0,0.12)"><div><a href="https://material.angularjs.org/latest/Theming/03_configuring_a_theme" target="_blank">Read about Material Design theming here</a><br><a href="https://material.angularjs.org/1.1.4/demo/colors" target="_blank">Material Design color picker</a><h4>Primary Buttons</h4><md-button class="md-raised md-primary">md-primary</md-button><md-button class="md-raised md-primary md-hue-1">md-primary md-hue-1</md-button><md-button class="md-raised md-primary md-hue-2">md-primary md-hue-2</md-button><md-button class="md-raised md-primary md-hue-3">md-primary md-hue-3</md-button><br><md-button class="md-primary">md-primary</md-button><md-button class="md-primary md-hue-1">md-hue-1</md-button><md-button class="md-primary md-hue-2">md-hue-2</md-button><md-button class="md-primary md-hue-3">md-hue-3</md-button><h4>Accent (secondary) Buttons</h4><md-button class="md-raised md-accent">md-accent</md-button><md-button class="md-raised md-accent md-hue-1">md-accent md-hue-1</md-button><md-button class="md-raised md-accent md-hue-2">md-accent md-hue-2</md-button><md-button class="md-raised md-accent md-hue-3">md-accent md-hue-3</md-button><br><md-button class="md-accent">md-accent</md-button><md-button class="md-accent md-hue-1">md-accent md-hue-1</md-button><md-button class="md-accent md-hue-2">md-accent md-hue-2</md-button><md-button class="md-accent md-hue-3">md-accent md-hue-3</md-button><h4>Warning buttons</h4><md-button class="md-raised md-warn">md-warn</md-button><md-button class="md-raised md-warn md-hue-1">md-warn md-hue-1</md-button><md-button class="md-raised md-warn md-hue-2">md-warn md-hue-2</md-button><md-button class="md-raised md-warn md-hue-3">md-warn md-hue-3</md-button><br><md-button class="md-warn">md-warn</md-button><md-button class="md-warn md-hue-1">md-warn md-hue-1</md-button><md-button class="md-warn md-hue-2">md-warn md-hue-2</md-button><md-button class="md-warn md-hue-3">md-warn md-hue-3</md-button><br><md-button class="md-raised">md-raised</md-button><md-button>empty button (no class)</md-button><h4>Custom</h4><md-button class="btn-round btn-cyan">btn-round btn-cyan</md-button></div></div><h2>Labels and Tags</h2><div layout="column" layout-wrap="" class="section-padding" style="border:1px solid rgba(0,0,0,0.12)"><div><h3>Label</h3><span class="label">offline</span><md-divider class="my-20"></md-divider><h3>Tag</h3><span class="tag">Barcelona</span></div></div><div><h2>Colors</h2><div class="colors-section section-padding" style="border:1px solid rgba(0,0,0,0.12)"><div layout="row"><div flex="20" class="secondary-color"><p>#065063</p><p>$secondary_color</p></div><div flex="20" class="terciary_color"><p>#38CEF3</p><p>$terciary_color</p></div><div flex="20" class="secondary_color_light"><p>#8DB2BA</p><p>$secondary_color_light</p></div><div flex="20" class="secondary-color-pastel"><p>#C8E6ED</p></div><div flex="20" class="white"><p>#FFFFFF</p></div></div></div><h2>Sensor Charts Colors</h2><div class="colors-section section-padding mb-30" style="border:1px solid rgba(0,0,0,0.12)"><div layout="row" class="sensors"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div></div></div></section></div>');
$templateCache.put('app/components/store/store.html','<md-button class="md-flat" ng-class="(isLoggedin) ? \'navbar_highlight_button\' : \'no-class\'" ng-href="https://www.seeedstudio.com/Smart-Citizen-Starter-Kit-p-2865.html"><md-tooltip md-direction="bottom">Get your kit on Seeed studio</md-tooltip>Get your Kit</md-button>');
$templateCache.put('app/components/store/storeModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Store</h2><span flex=""></span><md-button class="md-icon-button" ng-click="cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><md-progress-linear ng-show="waitingFromServer" class="md-hue-3" md-mode="indeterminate"></md-progress-linear></md-dialog-content></md-dialog>');
$templateCache.put('app/components/tags/tags.html','<section class="kitTags__section" ng-if="tagsCtl.selectedTags.length > 0" change-content-margin=""><div class="shadow"></div><div class="over_map"><div class="kit_fixed kitTags__container bg-white"><div class="kitTags__textContainer" layout-xs="column"><div class="kitTags__textElement"><h1><span ng-repeat="tag in tagsCtl.selectedTags">#{{tag}}</span></h1><h2>{{tagsCtl.markers.length}} kit{{tagsCtl.markers.length > 1 ? \'s are\' : \' is\'}} on <span ng-repeat="tag in tagsCtl.selectedTags">#{{tag}}</span> and {{tagsCtl.percActive}}% are active today.</h2><p ng-repeat="tag in tagsCtl.selectedTags"></p></div><div class="kitTags__textElement"><h4 class="md-title">About #Tags</h4><p class="sg-paragraph2">These tags are contributed by the community and show the variety applications of the Smart Citizen Project. You can use tags to organize and filter devices. If you need a tag, and you can\'t find one that works for you, you can request the creation of new tags in the forum.</p><br><a style="text-decoration: none" href="https://forum.smartcitizen.me/c/general/" class="md-button btn-black-outline btn-round-new">SUGGEST NEW TAGS</a></div></div></div></div><div class="kitTags__listContainer kit_fixed"><md-progress-circular ng-show="!tagsCtl.devices || tagsCtl.devices.length <= 0" class="md-hue-3 chart_spinner" md-mode="indeterminate"></md-progress-circular><section class="kit_owner_kits" ng-if="tagsCtl.devices.length > 0"><kit-list devices="tagsCtl.devices"></kit-list></section></div></section>');
$templateCache.put('app/components/upload/csvUpload.html','<div class=""><h3>Upload your files<p>Select the files you want and upload them into your kit!</p></h3></div><div ng-if="vm.invalidFiles && vm.invalidFiles.length > 0" class="mb-30"><p md-colors="{color:\'warn\'}">We are unable to upload the following files due to the problems mentioned below.</p><md-list class="list-shadow bg-red-light"><md-list-item ng-repeat="invalidFile in vm.invalidFiles"><span>{{invalidFile.name}}</span> <span flex=""></span><div ng-messages="invalidFile.$errorMessages"><div class="label color-white bg-red" ng-message="pattern">Invalid format</div><div class="label color-white bg-red" ng-message="maxSize">Too large (Max 10MB)</div><div class="label color-white bg-red" ng-message="maxFiles">Too many files (Max 30)</div><div class="label color-white bg-red" ng-message="duplicate">Already on the list</div></div><md-icon ng-click="vm.invalidFiles.splice($index, 1);" md-svg-icon="./assets/images/close_icon_black.svg"></md-icon></md-list-item></md-list></div><div class=""><button name="csvFiles" type="file" class="md-button btn-blue btn-round-new ml-0 mb-30" ngf-select="vm.change($files, $invalidFiles)" ngf-before-model-change="vm.onSelect()" ngf-multiple="true" ngf-accept="\'application/csv,.csv\'" ngf-max-files="30" ngf-max-size="\'10MB\'" ngf-pattern="\'.csv\'">Load CSV Files</button></div><md-input-container><label>Actions</label><md-select ng-model="vm.action"><md-option ng-value="null"><em>None</em></md-option><md-option value="selectAll" ng-disabled="vm.haveSelectedAllFiles()">Select all</md-option><md-option value="deselectAll" ng-disabled="vm.haveSelectedNoFiles()">Deselect all</md-option><md-option value="upload" ng-disabled="!vm.haveSelectedFiles()">Upload</md-option><md-option value="remove" ng-disabled="!vm.haveSelectedFiles()">Remove</md-option></md-select></md-input-container><md-button class="md-raised md-primary" ng-class="vm.action ? \'color-blue\' : \'\'" ng-click="vm.doAction()" ng-disabled="(!vm.csvFiles || vm.csvFiles.length === 0) && !vm.action">Apply</md-button><div class="relative"><md-progress-linear class="green absolute" md-mode="{{ vm.loadingType }}" ng-value="vm.loadingProgress" ng-if="vm.loadingStatus"></md-progress-linear></div><md-list ng-if="vm.csvFiles && vm.csvFiles.length > 0" class="list-shadow"><md-list-item ng-class="{\'bg-green\':csvFile.success}" ng-repeat="csvFile in vm.csvFiles"><md-checkbox ng-model="csvFile.checked" ng-disabled="csvFile.success"></md-checkbox><span>{{csvFile.name}}</span><md-button ng-click="vm.showErrorModal(csvFile)" ng-if="(csvFile.parseErrors || csvFile.backEndErrors) && !csvFile.success" class="md-icon-button md-warn"><md-tooltip md-direction="top">Show details</md-tooltip><md-icon md-svg-icon="./assets/images/alert_icon.svg"></md-icon></md-button><md-icon class="color-green" style="margin-left: 14px" md-svg-icon="./assets/images/check_circle.svg" ng-if="csvFile.success"></md-icon><md-progress-circular style="margin-left: 14px;" ng-if="csvFile.progress" md-mode="indeterminate" md-diameter="20"></md-progress-circular><span flex=""></span> <span ng-if="csvFile.isNew && !csvFile.success" class="label bg-grey">new data</span><md-button ng-click="vm.removeFile($index)" class="md-icon-button md-default"><md-icon md-svg-icon="./assets/images/delete_icon.svg"></md-icon></md-button></md-list-item></md-list><md-list ng-if="!vm.csvFiles || vm.csvFiles.length === 0" class="list-shadow"><md-list-item><div class="md-list-item-text" layout="column">There are no files here. Let\u2019s upload something!</div></md-list-item></md-list>');
$templateCache.put('app/components/upload/errorModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Errors</h2><span flex=""></span><md-button class="md-icon-button" ng-click="csvFile.cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><div style="min-height: 200px" layout="column" layout-align="space-around center"><md-icon class="s-48 md-warn" md-svg-icon="./assets/images/alert_icon.svg"></md-icon><md-list><md-list-item ng-repeat="error in csvFile.parseErrors">{{error.message}} <span ng-if="error.row">(at row: {{error.row}})</span></md-list-item><md-list-item ng-if="csvFile.backEndErrors">{{csvFile.backEndErrors.statusText || csvFile.backEndErrors}} {{csvFile.backEndErrors.status}} <span ng-if="csvFile.backEndErrors.data"></span>: {{ csvFile.backEndErrors.data.message || csvFile.backEndErrors.data.errors }}</md-list-item></md-list></div></md-dialog-content></md-dialog>');
$templateCache.put('app/components/upload/upload.html','<section class="upload-csv timeline" flex="1" layout="row" layout-align="center center"><div class="container" layout="row" layout-align="space-between center"><span class="timeline-title">CSV File Upload</span><md-button style="margin-left: auto" class="timeline_buttonBack btn-round-new btn-outline-white" ui-sref="layout.home.kit({id: vm.kit.id})">Back to Kit</md-button></div></section><section class="upload-csv" style="margin-top: 64px; margin-bottom: 64px;"><div class="container csv_content"><sc-csv-upload kit="vm.kit"><sc-csv-upload></sc-csv-upload></sc-csv-upload></div></section>');
$templateCache.put('app/components/userProfile/userProfile.html','<section class="myProfile_state" layout="column"><div class="profile_header myProfile_header dark"><div class="myProfile_header_container" layout="row"><img ng-src="{{ vm.user.profile_picture || \'./assets/images/avatar.svg\' }}" class="profile_header_avatar myProfile_header_avatar"><div class="profile_header_content"><h2 class="profile_header_name">{{ vm.user.username || \'No data\' }}</h2><div class="profile_header_location"><md-icon md-svg-src="./assets/images/location_icon_light.svg" class="profile_header_content_avatar"></md-icon><span class="md-title" ng-if="vm.user.city">{{ vm.user.city }}</span> <span class="md-title" ng-if="vm.user.city && vm.user.country">,</span> <span class="md-title" ng-if="vm.user.country">{{ vm.user.country }}</span> <span class="md-title" ng-if="!vm.user.city && !vm.user.country">No data</span></div><div class="profile_header_url"><md-icon md-svg-src="./assets/images/url_icon_light.svg" class="profile_header_content_avatar"></md-icon><a class="md-title" ng-href="{{ vm.user.url || \'http://example.com\' }}">{{ vm.user.url || \'No website\' }}</a></div></div></div></div><div class="profile_content mb-30" layout="column" layout-gt-sm="row"><div class="profile_sidebar pt-80" layout-align="start center" layout="column"><p class="profile_sidebar_title">FILTER KITS BY</p><div class="" layout="column"><md-button ng-click="vm.filterDevices(\'all\')" class="profile_sidebar_button">ALL</md-button><md-button ng-click="vm.filterDevices(\'online\')" class="profile_sidebar_button">ONLINE</md-button><md-button ng-click="vm.filterDevices(\'offline\')" class="profile_sidebar_button">OFFLINE</md-button></div></div><div class="pt-80 px-20" flex=""><div class="profile_content_main_top"><span class="">{{ vm.filteredDevices.length || 0 }} kits filtering by {{ vm.status.toUpperCase() || \'ALL\' }}</span></div><div class="profile_content_main_kits"><kit-list actions="{remove: vm.removeDevice}" devices="(vm.filteredDevices = (vm.devices | filterLabel:vm.deviceStatus ))"></kit-list><div class="kitList kitList_borderBottom" ng-show="!vm.devices.length"><div class="kitList_container"><div class="kitList_noKits"><span>There are not kits yet</span></div></div></div></div></div></div></section>');
$templateCache.put('app/core/animation/backdrop/loadingBackdrop.html','<md-content ng-if="vm.isViewLoading || vm.mapStateLoading" ng-class="{\'md-mainBackdrop\': vm.isViewLoading, \'md-stateChangeBackdrop\': vm.mapStateLoading}"><md-icon ng-if="vm.isViewLoading" md-svg-src="./assets/images/LogotipoSmartCitizen.svg" class="backdrop_icon"></md-icon></md-content>');
$templateCache.put('app/core/animation/backdrop/noDataBackdrop.html','<md-backdrop ng-if="vm.deviceWithoutData" class="md-noDataBackdrop"><div class="block info_overlay" layout="column" layout-align="center center"><div ng-if="vm.user === \'visitor\'"><h2 class="title">This kit hasn\u2019t still said a word \uD83D\uDC76</h2><p></p></div><div ng-if="vm.user === \'owner\'" class="static_page"><h2 class="title">Your kit has still not posted any data \uD83D\uDD27\uD83D\uDD29\uD83D\uDD28</h2></div></div></md-backdrop>');
$templateCache.put('app/components/kit/editKit/editKit.html','<section class="kit_dataChange"><section class="timeline" flex="1" layout="row" layout-align="center center"><div class="timeline_container" layout="row" layout-align="space-between center"><div layout="row" layout-align="start center" ng-show="vm.step === 1"><h2 class="timeline_stepName timeline-title">Edit your kit</h2></div><div layout="row" layout-align="start center" ng-show="vm.step === 2"><h2 class="timeline_stepName timeline-title">Finalise your setup</h2></div><div ng-if="vm.deviceData.isLegacy" class="timeline_line timeline_line_small" ng-show="vm.step === 2"></div><div ng-if="vm.deviceData.isLegacy" layout="row" layout-align="start center"><div class="timeline_stepCircle" ng-show="vm.step === 2" layout="row" layout-align="center center">2</div><md-button ng-if="vm.deviceData.isLegacy" ng-click="vm.goToStep(2)" class="timeline_stepName">Set up</md-button></div></div><md-button ng-show="vm.step===1" class="timeline_buttonBack btn-round-new btn-outline-white" ng-click="vm.backToProfile()">Back</md-button><md-button class="btn-round-new btn-outline-white-blue" ng-click="vm.submitFormAndKit()">Save</md-button></section><section class="timeline_content" flex="1"><section ng-show="vm.step === 1"><form><section class="bg-white relaxed-layout" layout-padding="" div="" layout="row" layout-xs="column" layout-align="space-around start"><div flex-gt-xs="50"><div layout="row"><div class=""><h2>Basic information</h2><small>Want to change your kit\'s name? Or perhaps say something nice about it in the description?<br>Don\'t forget about the exposure!</small></div></div></div><div flex-gt-xs="50"><div class="" layout="column"><md-input-container><label>Kit Name</label> <input type="text" class="font-roboto-condensed" ng-model="vm.deviceForm.name"><div class="form_errors"><div ng-repeat="error in vm.errors.name">Name {{ error }}</div></div></md-input-container><md-input-container flex="100" flex-gt-md="50"><label>Say something nice about your kit, what is it for?</label> <textarea class="font-roboto-condensed" type="text" ng-model="vm.deviceForm.description" placeholder="Describe your kit" md-maxlength="120"></textarea></md-input-container><md-input-container flex="100" flex-gt-md="50" ng-if="!vm.device.isSCK"><label>Seems like you have a custom kit, tell us what is it! (i.e. DIY Kit with CO2)</label> <textarea class="font-roboto-condensed" type="text" ng-model="vm.deviceForm.hardwareName" placeholder="Describe your kit" md-maxlength="120"></textarea></md-input-container><div layout="row" layout-align="space-between start"><div class="" layout="row" layout-align="start center"><label class="mr-10">Exposure:</label><md-select ng-model="vm.deviceForm.exposure" placeholder="Select exposure"><md-option class="color-dropdown" ng-repeat="exposure in vm.exposure" ng-value="{{ exposure.value }}">{{ exposure.name }}</md-option></md-select></div></div></div></div></section><section class="bg-white relaxed-layout" layout-padding="" div="" layout="row" layout-xs="column" layout-align="space-around start" ng-if="vm.device.isLegacy"><div flex-gt-xs="50"><div layout="row"><div class=""><h2>Legacy devices</h2><small>Seems like you have a {{vm.device.hardware.name}}. Use this field to input your MAC address. You can find the MAC address using the <a target="_blank" href="https://docs.smartcitizen.me/Guides/getting%20started/Using%20the%20Shell/">onboard kit\'s shell</a>. More information in the <a target="_blank" href="https://docs.smartcitizen.me/Components/legacy/?h=serial+way#manual-set-up-the-serial-way">docs</a></small></div></div></div><div flex-gt-xs="50"><div class="" layout="column"><md-input-container><label>Input here the MAC Address</label> <input type="text" ng-model="vm.deviceForm.macAddress"><div class="form_errors"><div ng-repeat="error in vm.errors.mac_address">MAC address {{ error }}</div></div></md-input-container></div></div></section><section class="form_blockMap relaxed-layout" layout="row" layout-xs="column" layout-align="space-around start" layout-padding=""><div flex-gt-xs="50"><div layout="row"><div><h2>Kit location</h2><small>You can adjust the location by dragging the marker on the map.</small></div></div></div><div flex="50"><div class="form_blockInput_button" ng-if="!vm.deviceForm.location.lat && !vm.deviceForm.location.lng"><div class="form_blockInput_container" layout="row" layout-align="center center"><md-button class="md-flat btn-cyan" ng-click="vm.getLocation()">Get your location</md-button></div></div><div class="form_blockInput_map" ng-if="vm.deviceForm.location.lat && vm.deviceForm.location.lng"><leaflet center="vm.deviceForm.location" defaults="vm.defaults" markers="vm.markers" tiles="vm.tiles" width="100%" height="100%"></leaflet></div></div></section><section class="bg-white relaxed-layout" layout="row" layout-xs="column" layout-align="space-around start" layout-padding="" ng-if="vm.userRole === \'researcher\' || vm.userRole === \'admin\'"><div flex-gt-xs="50"><div layout="row"><div class=""><h2>Open data</h2><small>Sometimes, your devices might be collecting sensitive personal data (i.e. your exact location or by GPS using in your bike).<br>Check the box in case you want to prevent others from accesssing your data. You can also choose to blurr the location, or enable MQTT forwarding.</small></div></div></div><div flex-gt-xs="50"><div class="" layout="column"><p>Manage how others can access your data:</p><md-checkbox ng-model="vm.deviceForm.is_private"><label>Make this device private</label></md-checkbox><md-checkbox ng-model="vm.deviceForm.precise_location"><label>Enable precise location</label></md-checkbox><md-checkbox ng-model="vm.deviceForm.enable_forwarding"><label>Enable MQTT forwarding</label></md-checkbox></div></div></section><section class="relaxed-layout" layout="row" layout-xs="column" layout-align="space-around start" layout-padding=""><div flex-gt-xs="50"><div layout="row"><div class=""><h2>Notifications</h2><small>Manage your notifications</small></div></div></div><div flex-gt-xs="50"><div class="" layout="column"><p>Get emails when the following events occur:</p><md-checkbox ng-model="vm.deviceForm.notify_low_battery"><label>Battery goes below 15%</label></md-checkbox><md-checkbox ng-model="vm.deviceForm.notify_stopped_publishing"><label>Device stopped publishing</label></md-checkbox></div></div></section><section class="bg-white relaxed-layout" layout="row" layout-xs="column" layout-align="space-around start" layout-padding=""><div flex-gt-xs="50"><h2>Kit tags</h2><small>Kits can be grouped by tags. Choose from the available tags or submit a tag request on the <a href="https://forum.smartcitizen.me/" target="_blank">Forum</a>.</small></div><div flex-gt-xs="50"><md-input-container><label>Select tags</label><md-select ng-model="selectedTags" md-on-close="clearSearchTerm()" data-md-container-class="selectdemoSelectHeader" multiple=""><md-select-header class="kit_tags-select-header"><input ng-model="searchTerm" type="search" placeholder="Search for a tag.." class="kit_tags-header-searchbox md-text"></md-select-header><md-optgroup label="tags"><md-option class="color-dropdown" ng-selected="vm.deviceForm.tags.includes(item.name)" ng-model="vm.deviceForm.tags" ng-value="item" ng-repeat="item in vm.tags | filter:searchTerm">{{item.name}}</md-option></md-optgroup></md-select></md-input-container></div></section><section class="relaxed-layout" layout-gt-sm="row" layout="column" layout-padding=""><div flex="100"><h2>Postprocessing info</h2><small>Follow the instructions <a href="https://docs.smartcitizen.me/Guides/data/Handling%20calibration%20data/" target="_blank">here</a> to generate a valid JSON containing the postprocessing information for your device. This is an advanced feature and it\'s not required for standard Smart Citizen Kits!<br><br>Last updated: {{vm.deviceForm.postprocessing.updated_at}}<br>Latest postprocessing: {{vm.deviceForm.postprocessing.latest_postprocessing}}</small></div><div layout="column" flex="100"><md-input-container><label>Hardware url</label> <input type="text" class="font-roboto-condensed" ng-model="vm.deviceForm.postprocessing.hardware_url"></md-input-container></div></section></form></section><section ng-if="vm.step === 2"><form><section class="relaxed-layout bg-white"><div layout="row" layout-xs="column" layout-align="start start" layout-padding=""><div><h2>Setup your kit</h2><small>In order to have your kit connected to the Smart Citizen platform, we need a few step involving the connection of your kit to your computer. If this is your first time, maybe you will like to follow the <a href="https://docs.smartcitizen.me/Components/legacy/?h=serial+way#manual-set-up-the-serial-way" target="_blank">Startup guide</a>.</small></div><img src="assets/images/sckit_avatar_2.jpg" alt="Smartcitizen Kit"></div></section></form><form><section class="form_blockNormal relaxed-layout"><div layout="row" layout-xs="column" layout-align="start start" layout-padding=""><div flex-gt-xs="50"><h2>MAC address</h2>Use this field to input your MAC address. You can find the MAC address using the <a target="_blank" href="https://docs.smartcitizen.me/Guides/getting%20started/Using%20the%20Shell/">onboard kit\'s shell</a>.</div><div><md-input-container><label>MAC Address</label><input type="text" ng-model="vm.deviceForm.macAddress"><div class="form_errors"><div ng-repeat="error in vm.errors.mac_address">MAC address {{ error }}</div></div></md-input-container></div></div></section></form><md-progress-linear class="md-hue-3" ng-show="vm.nextAction == \'waiting\'" md-mode="indeterminate"></md-progress-linear><md-button ng-disabled="true" ng-show="vm.nextAction == \'waiting\'" class="md-primary timeline_button timeline_buttonOpen">Waiting for your kit\'s data<small>We are waiting for your kit to connect on-line, this can take a few minutes</small><small>Check the process on the report window and contact <a ng-href="mailto:support@smartcitizen.me">support@smartcitizen.me</a> if you have any problem.</small></md-button><md-button ng-click="vm.submitFormAndKit()" ng-show="vm.nextAction == \'ready\'" class="md-primary timeline_button timeline_buttonOpen inverted">Ready! <small>Go and visit your kit on-line</small></md-button></section></section></section>');
$templateCache.put('app/components/kit/newKit/newKit.html','<section class="kit_dataChange"><section class="timeline" flex="1" layout="row" layout-align="center center"><div class="timeline_container" layout="row" layout-align="space-between center"><div layout="column" layout-align="start center"><div class="timeline_stepName vertical timeline-title">Add your kit</div></div><md-button ng-show="vm.step===1" class="timeline_buttonBack btn-round-new btn-outline-white" ng-click="vm.backToProfile()">Back<span class="timeline-btn-extra">to Profile</span></md-button><md-button class="btn-round-new btn-outline-white-blue" ng-click="vm.submitStepOne()">Next</md-button></div></section><section class="timeline_content" flex="1"><section ng-show="vm.step === 1"><form><section class="bg-white relaxed-layout" layout-padding="" div="" layout="row" layout-xs="column" layout-align="space-around start"><div flex-gt-xs="50"><div layout="row"><div class=""><h2>Basic information</h2><small>Want to change your kit\'s name? Or perhaps say something nice about it in the description?<br>Don\'t forget about the exposure!</small></div></div></div><div flex-gt-xs="50"><div class="" layout="column"><md-input-container><label>Kit Name</label> <input type="text" class="font-roboto-condensed" ng-model="vm.deviceForm.name"><div class="form_errors"><div ng-repeat="error in vm.errors.name">Name {{ error }}</div></div></md-input-container><md-input-container><label>Say something nice about your kit, what is it for?</label> <textarea type="text" class="font-roboto-condensed" ng-model="vm.deviceForm.description" placeholder="Describe your kit" md-maxlength="120"></textarea></md-input-container><div layout="row" layout-align="space-between start"><div class="form_blockInput_select" layout="row" layout-align="start center"><label class="mr-10">Exposure:</label><md-select ng-model="vm.deviceForm.exposure" placeholder="Select exposure"><md-option class="color-dropdown" ng-repeat="exposure in vm.exposure" ng-value="{{ exposure.value }}">{{ exposure.name }}</md-option></md-select></div></div><div class="form_blockInput_select" layout="row" layout-align="start center" style="margin-top: 20px"><label class="mr-10">Hardware version:</label><md-select ng-model="vm.deviceForm.legacyVersion" placeholder="Select hardware version"><md-option class="color-dropdown" ng-repeat="version in vm.version" ng-value="{{ version.value }}">{{ version.name }}</md-option></md-select></div></div></div></section><section class="relaxed-layout" layout="row" layout-xs="column" layout-align="space-around start" layout-padding="" ng-if="vm.userRole === \'researcher\' || vm.userRole === \'admin\'"><div flex-gt-xs="50"><div layout="row"><div class=""><h2>Open data</h2><small>Sometimes, your devices might be collecting sensitive personal data (i.e. your exact location or by GPS using in your bike).<br>Check the box in case you want to prevent others from accesssing your data.</small></div></div></div><div flex-gt-xs="50"><div class="" layout="column"><p>Manage how others can access your data:</p><md-checkbox ng-model="vm.deviceForm.is_private"><label>Make this device private</label></md-checkbox></div></div></section><section class="bg-white relaxed-layout" layout="row" layout-xs="column" layout-align="space-around start" layout-padding=""><div flex-gt-xs="50"><h2>Kit location</h2><small>Please, let us locate you, later you can adjust the location by dragging the marker on the map.</small></div><div class="mt-50" flex-gt-xs="50"><div layout="row" layout-align="center center" class="" ng-if="!vm.deviceForm.location.lat && !vm.deviceForm.location.lng"><md-button class="md-flat btn-cyan" ng-click="vm.getLocation()">Get your location</md-button></div><div class="form_blockInput_map" ng-if="vm.deviceForm.location.lat && vm.deviceForm.location.lng"><leaflet center="vm.deviceForm.location" defaults="vm.defaults" markers="vm.markers" tiles="vm.tiles" width="100%" height="100%"></leaflet></div></div></section><section class="isEven relaxed-layout" layout="row" layout-xs="column" layout-align="space-around start" layout-padding=""><div flex-gt-xs="50"><h2>Kit tags</h2><small>Kits can be grouped by tags. Choose from the available tags or submit a tag request on the <a href="https://forum.smartcitizen.me/" target="_blank">Forum</a>.</small></div><div class="mt-50" flex-gt-xs="50" layout-padding=""><md-input-container md-no-float="" class="md-block"><input type="text" ng-model="tagSearch" placeholder="Search for tags"></md-input-container><md-content layout-padding="" style="height: calc(20vh);"><div ng-repeat="tag in vm.tags | filter:{name: tagSearch}"><md-checkbox ng-model="vm.checks[tag.name]"><span class="tag">{{tag.name}}</span></md-checkbox></div></md-content></div></section></form></section></section></section>');
$templateCache.put('app/components/kit/showKit/showKit.html','<section class="kit_data" change-content-margin=""><div class="shadow"></div><div ng-if="vm.device.isPrivate" class="kit_fixed bg-grey-lightest" move-down="" layout="row"><p>Device not found, or it has been set to private. <a href="https://forum.smartcitizen.me/" target="_blank">You can ask in the forum</a> for more information.</p></div><div ng-if="!vm.device.isPrivate || vm.deviceBelongsToUser" class="over_map"><section class="kit_menu" stick=""><section ng-if="!vm.device" class="overlay-kitinfo"></section><div class="container" layout="row" layout-align="space-between center"><div flex="nogrow" layout="row" layout-align="start center"><div hide="" show-gt-xs="" class="kit_user"><md-tooltip md-direction="top">Visit user profile</md-tooltip><img ng-src="{{ vm.device.owner.profile_picture || \'./assets/images/avatar.svg\'}}"> <a href="./users/{{vm.device.owner.id}}"><span>{{ vm.device.owner.username}}</span></a></div><div hide="" show-gt-xs="" class="kit_name"><md-icon md-svg-src="./assets/images/sensor_icon.svg" class="sensor_icon"></md-icon><span>{{ vm.device.name }}</span></div><div ng-if="vm.battery.value != -1" ng-animate-swap="vm.battery.value" ng-class="{bat_animation: vm.prevKit}" class="kit_battery"><md-icon md-svg-src="{{ vm.battery.icon }}"></md-icon><span>{{ vm.battery.value }} {{ vm.battery.unit }}</span></div><div ng-if="vm.battery.value == -1" ng-animate-swap="vm.battery.value" ng-class="{bat_animation: vm.prevKit}" class="kit_battery"><md-icon md-font-icon="fa fa-battery-empty" class="color-red"></md-icon><span class="color-red hide-sm" hide="" show-gt-sm="">NOT CONNECTED</span></div></div><div ng-animate-swap="vm.device.lastReadingAt.raw" ng-class="{time_animation: vm.prevKit}" flex="" class="kit_time"><span ng-if="vm.device.lastReadingAt.raw" hide="" show-gt-sm="">Last data received:</span><span>{{ vm.device.lastReadingAt.parsed }}</span></div><div class="kit-show-raw" ng-if="vm.hasRaw"><label class="switch"><input type="checkbox" class="custom-control-input kit-raw-toggle" id="show-raw-switch" ng-model="vm.showRaw"> <span class="slider round"></span></label> <label class="kit-show-raw-text hide-sm" for="show-raw-switch" hide="" show-gt-sm="">SHOW RAW</label></div><div hide="" show-gt-xs="" flex="nogrow" class="kit_navbar" active-button="" layout="row" layout-align="end center"><md-button href="#" class="md-flat chart_icon btn-small" aria-label=""><md-tooltip md-direction="top">Chart</md-tooltip><md-icon md-svg-src="./assets/images/chart_icon.svg"></md-icon></md-button><md-button href="#" class="md-flat kit_details_icon btn-small" aria-label=""><md-tooltip md-direction="top">Kit Detail</md-tooltip><md-icon md-svg-src="./assets/images/kit_details_icon_light.svg"></md-icon></md-button><md-button href="#" class="md-flat user_details btn-small" aria-label=""><md-tooltip md-direction="top">User info</md-tooltip><md-icon md-svg-src="./assets/images/user_details_icon.svg"></md-icon></md-button></div></div></section><section class="kit_fixed bg-grey-lightest" move-down=""><section class="overlay" ng-if="!vm.deviceID"><h2 class="title">No kit selected <span class="emoji">\uD83D\uDC46</span></h2><p>Browse the map and click on any kit to see its data.</p></section><div no-data-backdrop=""></div><section ng-if="!vm.device.isPrivate || vm.deviceBelongsToUser" class="kit_overview" layout="row"><md-button ng-click="vm.slide(\'right\')" class="md-flat button_scroll button_scroll_left btn-small" aria-label=""><md-tooltip md-direction="right">Click to see more sensors</md-tooltip><md-icon md-svg-src="./assets/images/arrow_left_icon.svg"></md-icon></md-button><div flex="90" class="sensors_container" layout="row" layout-align="start center" horizontal-scroll=""><div ng-if="(sensor.measurement.name != \'battery\' || (sensor.measurement.name == \'battery\' && sensor.value != -1)) && !(!vm.showRaw && sensor.tags.indexOf(\'raw\') !== -1) && !sensor.is_ancestor" ng-animate-swap="vm.sensors" ng-repeat="sensor in vm.sensors" class="sensor_container" ng-click="vm.showSensorOnChart(sensor.id)" ng-class="{selected: vm.selectedSensor === sensor.id, sensor_animation: vm.prevKit}"><md-icon md-svg-src="{{ sensor.icon }}" class="sensor_icon"></md-icon><div class="sensor_value" ng-class="{sensor_value_null: sensor.value === \'NA\'}">{{ sensor.value }}</div><div class="sensor_right"><div class="sensor_unit">{{ sensor.unit }}</div><md-icon md-svg-src="./assets/images/{{ sensor.arrow }}_icon.svg" class="sensor_arrow {{ sensor.arrow }}"></md-icon></div><p>{{ sensor.measurement.name }}</p></div></div><md-button ng-click="vm.slide(\'left\')" class="md-flat button_scroll button_scroll_right btn-small" aria-label=""><md-tooltip md-direction="left">Click to see more sensors</md-tooltip><md-icon md-svg-src="./assets/images/arrow_right_icon.svg"></md-icon></md-button></section></section></div><section class="kit_fixed"><div class="hint" ng-if="!vm.device"><p>We can also take you to your nearest online kit by letting us know your location.</p><md-button class="md-button btn-round-new btn-cyan" ng-click="vm.geolocate()">Locate me</md-button></div><section class="kit_detailed"><section ng-if="!vm.device.isPrivate || vm.deviceBelongsToUser" class="kit_chart"><div class="hint" ng-if="vm.deviceWithoutData"><p></p></div><div class="container" layout="column" layout-gt-sm="row"><div class="kit_chart_left" layout-padding="" flex="100" flex-gt-sm="20"><div class="sensor_data" show-popup-info=""><span class="sensor_value">{{ vm.selectedSensorData.value }}</span> <span class="sensor_unit">{{ vm.selectedSensorData.unit }}</span></div><div class="sensor_select"><md-select placeholder="CHOOSE SENSOR" ng-model="vm.selectedSensor"><md-option ng-if="(sensor.measurement.name != \'battery\' || (sensor.measurement.name == \'battery\' && sensor.value != -1)) && !(!vm.showRaw && sensor.tags.indexOf(\'raw\') !== -1)" ng-repeat="sensor in vm.chartSensors" ng-value="{{sensor.id}}" ng-selected="$first" class="color-dropdown"><md-icon md-svg-src="{{ sensor.icon }}"></md-icon><span class="md-primary">{{ sensor.measurement.name }}</span></md-option></md-select></div><div class="sensor_data_description" hide-popup-info="">This is the latest value received</div><div class="sensor_description"><h6>{{ vm.sensorNames[vm.selectedSensor] }}</h6><div class="sensor_description_content"><small class="sensor_description_preview">{{ vm.selectedSensorData.fullDescription }}<a href="https://docs.smartcitizen.me/" target="_blank">More info</a></small></div></div><div ng-if="vm.sensorsToCompare.length >= 1" class="sensor_compare"><div style="display: block; width: 100%;"><span style="vertical-align: middle;">Compare with</span><md-select placeholder="NONE" ng-model="vm.selectedSensorToCompare"><md-option ng-repeat="sensor in vm.sensorsToCompare" ng-value="{{sensor.id}}" ng-if="(sensor.measurement.name != \'battery\' || (sensor.measurement.name == \'battery\' && sensor.value != -1)) && !(!vm.showRaw && sensor.tags.indexOf(\'raw\') !== -1)" class="color-dropdown"><md-icon md-svg-src="{{ sensor.icon }}"></md-icon><span class="md-primary">{{ sensor.measurement.name }}</span></md-option></md-select></div></div></div><div class="kit_chart_right" layout-padding="" flex=""><div class="chart_navigation" layout-gt-sm="row" layout="column" layout-align-gt-sm="end center" layout-align="space-between end"><div class="picker_container word_picker"><md-select class="kit_timeOpts" ng-model="vm.dropDownSelection" placeholder="Last Data Received" ng-change="vm.timeOptSelected()"><md-option ng-value="opt" ng-repeat="opt in vm.timeOpt">{{ opt }}</md-option></md-select></div><div class="picker_container"><label for="picker_from">From:</label> <input type="text" id="picker_from" class="date_picker" placeholder="FROM"></div><div class="picker_container"><label for="picker_to">To:</label> <input type="text" id="picker_to" class="date_picker" placeholder="TO"></div><div class="chart_move"><md-button href="#" ng-click="vm.moveChart(\'left\')" class="chart_move_button chart_move_left" aria-label="" layout="row" layout-align="center center"><md-tooltip md-direction="top">Move chart to the left</md-tooltip><md-icon md-svg-src="./assets/images/arrow_left_icon.svg"></md-icon></md-button><md-button href="#" ng-click="vm.moveChart(\'right\')" class="chart_move_button chart_move_right" aria-label="" layout="row" layout-align="center center"><md-tooltip md-direction="top">Move chart to the right</md-tooltip><md-icon md-svg-src="./assets/images/arrow_right_icon.svg"></md-icon></md-button></div></div><md-progress-circular ng-show="vm.loadingChart && !vm.deviceWithoutData" class="md-hue-3 chart_spinner" md-mode="indeterminate"></md-progress-circular><div chart="" class="chart_container" chart-data="vm.chartDataMain"></div></div></div></section><div class="kit_details" ng-if="vm.device"><div class="kit_detailed_content_container" layout="row" layout-xs="column" layout-align="space-between start" layout-align-xs="space-between start"><div class="kit_details_content_main"><div class="kit_details_content"><h1 class="kit_details_name">{{ vm.device.name }}</h1><span class="mr-10" ng-if="vm.device.isPrivate"><md-icon class="color-red" md-font-icon="fa fa-lock"></md-icon><span class="kitList_state kitList_state_not_configured state">Private</span></span><p class="kit_details_location"><md-icon class="icon_label" md-svg-src="./assets/images/location_icon_normal.svg"></md-icon><span class="md-title">{{ vm.device.locationString || \'No location\' }}</span></p><p class="kit_details_type"><md-icon class="icon_label" md-svg-src="./assets/images/kit_details_icon_normal.svg"></md-icon><span class="md-title">{{ vm.device.hardwareName }}</span></p><span><md-icon class="kitList_state kitList_state_{{ vm.device.state.className }}" md-font-icon="fa fa-wifi"></md-icon><span class="kitList_state kitList_state_{{ vm.device.state.className }} state">{{ vm.device.state.name }}</span></span><p class="description" ng-bind-html="vm.device.description | linky:\'_blank\'"></p><p class="kit_details_labels"><span style="padding:4px 8px" class="label" ng-repeat="system_tag in vm.device.systemTags">{{ system_tag }}</span><tag style="padding:4px 8px" ng-repeat="tag in vm.device.userTags" ng-attr-tag-name="tag" clickable=""></tag></p></div></div><section flex-gt-xs="50" class="info kit_details_notAuth"><div class="kit_details_manage" ng-if="vm.deviceBelongsToUser"><h3>Manage your kit</h3><div class="kit_details_manage_buttons"><md-button class="md-primary md-raised md-hue-1" ui-sref="layout.kitEdit({id: vm.device.id})" aria-label=""><md-icon style="margin-right:5px" md-font-icon="fa fa-edit"></md-icon><span>EDIT</span></md-button><md-button class="md-primary md-raised md-hue-1" ng-click="vm.downloadData(vm.device)"><md-icon style="margin-right:5px" 15px="" class="md-primary md-raised kit_detailed_icon_content" md-font-icon="fa fa-download" ng-click="vm.downloadData(vm.device)"></md-icon>Download CSV</md-button><md-button class="md-primary md-raised md-hue-1" ng-if="vm.device.hardware" ui-sref="layout.kitUpload({id: vm.device.id})" aria-label=""><md-icon style="margin-right:5px" md-font-icon="fa fa-sd-card"></md-icon><span>SD CARD UPLOAD</span></md-button><md-button class="md-primary md-raised md-hue-1" ng-click="vm.removeDevice()" aria-label=""><md-icon style="margin-right:5px" md-font-icon="fa fa-trash"></md-icon><span>DELETE</span></md-button></div></div><div ng-if="!vm.deviceBelongsToUser"><h2>We empower communities to better understand their environment</h2><p>Smart Citizen is a project by <a target="_blank" href="http://fablabbcn.org/">Fab Lab Barcelona</a> to offer an alternative to the centralised data production and management systems used by the large corporations that constitute the driving force behind the smart city concept. The project empowers citizens and communities to gather information on their environment and make it available to the public, using open source hardware and software design.</p></div></section></div></div><div class="kit_owner" ng-if="vm.device"><div class="kit_detailed_content_container" layout="column"><div layout="row" layout-align="start center"><img class="ml-20 mr-30" style="height:100px; border-radius:50px;" ng-src="{{ vm.device.owner.profile_picture || \'./assets/images/avatar.svg\' }}"><div><a href="./users/{{vm.device.owner.id}}" class="kit_owner_usernameLink"><h2 class="kit_owner_usernameText">{{ vm.device.owner.username }}</h2></a><p><md-icon class="kit_detailed_icon_content" md-svg-src="./assets/images/location_icon_normal.svg"></md-icon><span class="md-title"><span ng-if="vm.device.owner.city">{{ vm.device.owner.city }}</span> <span ng-if="vm.device.owner.city && vm.device.owner.country">,</span> <span ng-if="vm.device.owner.country">{{ vm.device.owner.country }}</span> <span ng-if="!vm.device.owner.city && !vm.device.owner.country">No location</span></span></p><p ng-if="vm.device.owner.url"><md-icon class="kit_detailed_icon_content" md-svg-src="./assets/images/url_icon_normal.svg"></md-icon><span class="md-title" ng-bind-html="vm.device.owner.url | linky:\'_blank\'">{{ vm.device.owner.url || \'No URL\'}}</span></p></div></div><div flex="100"><section class="kit_owner_kits" ng-if="vm.sampleDevices.length > 0"><h4 class="ml-20">Other kits owned by {{ vm.device.owner.username }}</h4><kit-list devices="vm.sampleDevices"></kit-list><div layout="row" layout-align="end end"><md-button class="btn-round-new btn-cyan" ng-href="/users/{{ vm.device.owner.id }}" style="margin-right:23px; padding-top:4px" ng-if="vm.device.owner.devices.length > 6" aria-label="">VIEW ALL KITS BY {{ vm.device.owner.username }}</md-button></div></section></div></div></div></section></section></section>');}]);