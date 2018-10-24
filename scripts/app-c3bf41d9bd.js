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
       * @property {string} avatar - Avatar URL of user
       * @property {Array} kits - Kits that belongs to this user
       * @property {string} url - URL 
       * @property {string} city - User city
       * @property {string} country - User country
       */
      
      function User(userData) {
        this.id = userData.id;
        this.username = userData.username;
        this.avatar = userData.avatar;
        this.kits = userData.devices;
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
    .factory('Sensor', ['sensorUtils', 'measurement', function(sensorUtils,
      measurement) {

      /*jshint camelcase: false */
      var measurementTypes;
      measurement.getTypes()
        .then(function(res) {
          measurementTypes = res;
        });

      /**
       * Sensor constructor
       * @param {Object} sensorData - Contains the data of a sensor sent from the API
       * @param {Array} sensorTypes - Contains generic data about types of sensors, such as id, name, description,..
       * @property {string} name - Name of sensor
       * @property {number} id - ID of sensor
       * @property {string} unit - Unit of sensor. Ex: %
       * @property {string} value - Last value sent. Ex: 95
       * @property {string} prevValue - Previous value before last value
       * @property {string} icon - Icon URL for sensor
       * @property {string} arrow - Icon URL for sensor trend(up, down or equal)
       * @property {string} color - Color that belongs to sensor
       * @property {string} fullDescription - Full Description for popup
       * @property {string} previewDescription - Short Description for dashboard. Max 140 chars
       */
      function Sensor(sensorData, sensorTypes) {

        this.id = sensorData.id;

        this.name = _.result(_.find(measurementTypes, {
          'id': sensorData.measurement_id
        }), 'name');

        this.unit = sensorData.unit;
        this.value = sensorUtils.getSensorValue(sensorData);
        this.prevValue = sensorUtils.getSensorPrevValue(sensorData);
        this.icon = sensorUtils.getSensorIcon(this.name);
        this.arrow = sensorUtils.getSensorArrow(this.value, this.prevValue);
        this.color = sensorUtils.getSensorColor(this.name);

        var description = sensorUtils.getSensorDescription(this.id,
          sensorTypes);
        this.fullDescription = description;
        this.previewDescription = description.length > 140 ? description.slice(
          0, 140).concat(' ... ') : description;
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
    .factory('Marker', ['device', 'markerUtils', function(device, markerUtils) {

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
        this.lat = markerUtils.parseCoordinates(deviceData).lat;
        this.lng = markerUtils.parseCoordinates(deviceData).lng;
        this.message = '<div class="popup"><div class="popup_top ' +
          markerUtils.classify(markerUtils.parseTypeSlug(deviceData)) +
          '"><p class="popup_name">' + markerUtils.parseName(deviceData) +
          '</p><p class="popup_type">' + markerUtils.parseType(deviceData) +
          '</p><p class="popup_time"><md-icon class="popup_icon" ' +
          'md-svg-src="./assets/images/update_icon.svg"></md-icon>' +
          markerUtils.parseTime(deviceData) + '</p></div>' +
          '<div class="popup_bottom"><p class="popup_location">' +
          '<md-icon class="popup_icon" ' +
          'md-svg-src="./assets/images/location_icon_dark.svg"></md-icon>' +
          markerUtils.parseLocation(deviceData) +
          '</p><div class="popup_labels">' +
          createTagsTemplate(markerUtils.parseLabels(deviceData), 'label') +
          createTagsTemplate(markerUtils.parseUserTags(deviceData),
            'tag', true) +
          '</div></div></div>';

        this.icon = markerUtils.getIcon(deviceData);
        this.layer = 'devices';
        this.focus = false;
        this.myData = {
          id: markerUtils.parseId(deviceData),
          labels: markerUtils.parseLabels(deviceData),
          tags: markerUtils.parseUserTags(deviceData)
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

(function() {
  'use strict';

  angular.module('app.components')
    .factory('PreviewKit', ['Kit', function(Kit) {

      /**
       * Preview Kit constructor.
       * Used for kits stacked in a list, like in User Profile or Kit states
       * @extends Kit
       * @constructor
       * @param {Object} object - Object with all the data about the kit from the API
       */
      function PreviewKit(object) {
        Kit.call(this, object);

        this.dropdownOptions = [];

        if (!object.kit_id || object.kit_id === 2 || object.kit_id === 3) {
          this.dropdownOptions.push({text: 'SET UP', value: '1', href: 'kits/' + this.id + '/edit?step=2'});
        }
        this.dropdownOptions.push({text: 'EDIT', value: '2', href: 'kits/' + this.id + '/edit'});
        if (object.kit_id) {
          this.dropdownOptions.push({text: 'UPLOAD CSV', value: '3', href: 'kits/' + this.id + '/upload'});
        }

      }
      PreviewKit.prototype = Object.create(Kit.prototype);
      PreviewKit.prototype.constructor = Kit;
      return PreviewKit;
    }]);
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('Kit', ['Sensor', 'kitUtils', function(Sensor, kitUtils) {

      /**
       * Kit constructor. 
       * @constructor
       * @param {Object} object - Object with all the data about the kit from the API
       * @property {number} id - ID of the kit
       * @property {string} name - Name of the kit
       * @property {string} type - Type of kit. Ex: SmartCitizen Kit
       * @property {string} location - Location of kit. Ex: Madrid, Spain; Germany; Paris, France
       * @property {string} avatar - URL that contains the user avatar
       * @property {Array} labels - System tags
       * @property {string} state - State of the kit. Ex: Never published
       * @property {Array} userTags - User tags. Ex: ''
       */
      function Kit(object) {
        this.id = object.id;
        this.name = object.name;
        this.type = kitUtils.parseType(object);
        this.location = kitUtils.parseLocation(object);
        this.avatar = kitUtils.parseAvatar(object, this.type);
        this.labels = kitUtils.parseLabels(object); //TODO: refactor name to systemTags
        this.state = kitUtils.parseState(object);
        /*jshint camelcase: false */
        this.userTags = object.user_tags;
      }

      return Kit;
    }]);
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('HasSensorKit', ['Kit', function(Kit) {

      function HasSensorKit(object) {
        Kit.call(this, object);

        this.data = object.data.sensors;
        this.longitude = object.data.location.longitude;
        this.latitude = object.data.location.latitude;
      }

      HasSensorKit.prototype = Object.create(Kit.prototype);
      HasSensorKit.prototype.constructor = Kit;

      HasSensorKit.prototype.sensorsHasData = function() {
        var parsedSensors = this.data.map(function(sensor) {
          return sensor.value;
        });

        return _.some(parsedSensors, function(sensorValue) {
          return !!sensorValue;
        });
      };

      return HasSensorKit;
    }]);
})();

(function() {
  'use strict';

  angular.module('app.components')
    .factory('FullKit', ['Kit', 'Sensor', 'kitUtils', function(Kit, Sensor, kitUtils) {

      /**
       * Full Kit constructor.
       * @constructor
       * @extends Kit
       * @param {Object} object - Object with all the data about the kit from the API
       * @property {string} version - Kit version. Ex: 1.0
       * @property {string} time - Last time kit sent data in UTC format
       * @property {string} timeParsed - Last time kit sent data in readable format
       * @property {string} timeAgo - Last time kit sent data in 'ago' format. Ex: 'a few seconds ago'
       * @property {string} class - CSS class for kit
       * @property {string} description - Kit description
       * @property {Object} owner - Kit owner data
       * @property {Array} data - Kit sensor's data
       * @property {number} latitude - Kit latitude
       * @property {number} longitude - Kit longitude
       * @property {string} macAddress - Kit mac address
       * @property {number} elevation
       */
      function FullKit(object) {
        Kit.call(this, object);

        this.version = kitUtils.parseVersion(object);
        this.time = kitUtils.parseTime(object);
        this.timeParsed = !this.time ? 'No time' : moment(this.time).format('MMMM DD, YYYY - HH:mm');
        this.timeAgo = !this.time ? 'No time' : moment(this.time).fromNow();
        this.class = kitUtils.classify(kitUtils.parseTypeSlug(object));
        this.description = object.description;
        this.owner = kitUtils.parseOwner(object);
        this.data = object.data.sensors;
        this.latitude = object.data.location.latitude;
        this.longitude = object.data.location.longitude;
        /*jshint camelcase: false */
        this.macAddress = object.mac_address;
        this.elevation = object.data.location.elevation;
        this.typeDescription = kitUtils.parseTypeDescription(object);
      }

      FullKit.prototype = Object.create(Kit.prototype);
      FullKit.prototype.constructor = FullKit;

      FullKit.prototype.getSensors = function(sensorTypes, options) {
        var sensors = _(this.data)
          .chain()
          .map(function(sensor) {
            return new Sensor(sensor, sensorTypes);
          }).sort(function(a, b) {
            /* This is a temporary hack to set always PV panel at the end*/
            if (a.id == 18) return -1;
            if (b.id == 18) return  1;
            /* This is a temporary hack to set always the Battery at the end*/
            if (a.id == 17) return -1;
            if (b.id == 17) return  1;
            /* This is a temporary hack to set always the Battery at the end*/
            if (a.id == 10) return -1;
            if (b.id == 10) return  1;
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

      return FullKit;
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

        vm.kitWithoutData = false;
        vm.scrollToComments = scrollToComments;

        $scope.$on('kitWithoutData', function(ev, data) {

          $timeout(function() {
            vm.kit = data.kit;
            vm.kitWithoutData = true;

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
            angular.element('#doorbell-button').hide();
          });

          $scope.$on('viewLoaded', function() {
            vm.isViewLoading = false;
            angular.element('#doorbell-button').show();
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
        .content('Are you sure you want to delete this kit?')
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
        .content('We are processing your data. Soon you will be notified in your inbox')
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
        .content('Uh-oh, something went wrong')
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

(function(){
  'use strict';

  angular.module('app.components')
    .directive('setuptool', setuptool);

  setuptool.$inject = ['scktoolService'];
  function setuptool(scktoolService){
    return {
      restrict: 'A',
      link: link,
      scope:false
    };

    function link(scope, element, attrs){
      var publishedPID;

      scope.vm.macAddressFieldVisible = true;

      scktoolService.scktool().then(function(){
        $(element).sckapp();

        $(element).on('sck_start', function(event, data){
          scope.vm.macAddressFieldVisible = false;
          scope.vm.nextAction = 'no';
          if(publishedPID){
            publishedPID();
          }
          scope.$apply();
        });

        $(element).on('sck_info', function(event, data){
          scope.vm.macAddress = data.mac;
          scope.$apply();
          scope.vm.submitForm();
        });

        $(element).on('sck_done', function(event, data){
          scope.vm.nextAction = 'waiting';
          publishedPID = scope.$on('published', function(e, data) { // here is the error...
            scope.vm.nextAction = 'ready';
            scope.$apply();
          });
        });

      });
    }
  }

})();

(function(){
  'use strict';

  angular.module('app.components')
    .service('scktoolService', scktoolService);

  scktoolService.$inject = ['angularLoad', '$q', '$rootScope'];
  function scktoolService(angularLoad, $q, $rootScope){
    var d = $q.defer();
    var scripts = [
      'scripts/scktool-app.js',
      'scripts/scktool-connector.js'
    ];
    var scriptsLoaded = 0;

    var service = {
      scktool: scktool
    };

    initialize();

    return service;

    //////////////////////////////

    function initialize(){
      load(scripts[scriptsLoaded]);
    }

    function load(scriptSrc){
      angularLoad.loadScript(scriptSrc)
        .then(function(){
          onScriptLoad();
        });
    }

    function onScriptLoad(){
      scriptsLoaded++;
      if(scriptsLoaded < scripts.length){
        load(scripts[scriptsLoaded]);
        return;
      }

      d.resolve();
    }

    function scktool(){
      return d.promise;
    }

  }
})();

(function() {
  'use strict';

  angular.module('app.components')
    .controller('NewKitController', NewKitController);

    NewKitController.$inject = ['$scope', '$state', 'animation', 'device', 'tag', 'alert', 'auth', '$timeout'];
    function NewKitController($scope, $state, animation, device, tag, alert, auth, $timeout) {
      var vm = this;

      vm.step = 1;

      vm.submitStepOne = submitStepOne;
      vm.submitStepTwo = submitStepTwo;

      // FORM INFO
      vm.kitForm = {
        name: undefined,
        exposure: undefined,
        location: {
          lat: undefined,
          lng: undefined,
          zoom: 16
        },
        tags: []
      };

      // EXPOSURE SELECT
      vm.exposure = [
        {name: 'indoor', value: 1},
        {name: 'outdoor', value: 2}
      ];

      // TAGS SELECT
      vm.tags = [];
      $scope.$watch('vm.tag', function(newVal, oldVal) {
        if(!newVal) {
          return;
        }
        // remove selected tag from select element
        vm.tag = undefined;

        var alreadyPushed = _.some(vm.kitForm.tags, function(tag) {
          return tag.id === newVal;
        });
        if(alreadyPushed) {
          return;
        }

        var tag = _.find(vm.tags, function(tag) {
          return tag.id === newVal;
        });
        vm.kitForm.tags.push(tag);
      });
      vm.removeTag = removeTag;

      // MAP CONFIGURATION
      vm.getLocation = getLocation;
      vm.markers = {
        main: {
          lat: undefined,
          lng: undefined,
          draggable: true
        }
      };
      vm.tiles = {
        url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg'
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
      }

      function getLocation() {
        window.navigator.geolocation.getCurrentPosition(function(position) {
          $scope.$apply(function() {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            vm.kitForm.location.lat = lat;
            vm.kitForm.location.lng = lng;
            vm.markers.main.lat = lat;
            vm.markers.main.lng = lng;
          });
        });
      }

      function removeTag(tagID) {
        vm.kitForm.tags = _.filter(vm.kitForm.tags, function(tag) {
          return tag.id !== tagID;
        });
      }

      function submitStepOne() {
        var data = {
          name: vm.kitForm.name,
          description: vm.kitForm.description,
          exposure: findExposure(vm.kitForm.exposure),
          latitude: vm.kitForm.location.lat,
          longitude: vm.kitForm.location.lng,
          /*jshint camelcase: false */
          user_tags: _.map(vm.kitForm.tags, 'name').join(',')
        };

        device.createDevice(data)
          .then(
            function(response) {
              alert.success('Your kit was created but has not been configured yet');
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

      function submitStepTwo() {

      }

      function getTags() {
        tag.getTags()
          .then(function(tagsData) {
            vm.tags = tagsData;
          });
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

  angular.module('app.components')
    .controller('EditKitController', EditKitController);

    EditKitController.$inject = ['$scope', '$location', '$timeout', '$state',
    'animation', 'device', 'tag', 'alert', 'step', '$stateParams', 'FullKit', 'push'];
    function EditKitController($scope, $location, $timeout, $state, animation,
     device, tag, alert, step, $stateParams, FullKit, push) {

      var vm = this;

      // WHAIT INTERVAL FOR USER FEEDBACK and TRANSITIONS (This will need to change)
      var timewait = {
          long: 5000,
          normal: 2000,
          short: 1000
      };

      vm.step = step;

      // KEY USER ACTIONS
      vm.submitFormAndKit = submitFormAndKit;
      vm.submitFormAndNext = submitFormAndNext;
      vm.backToProfile = backToProfile;
      vm.submitForm = submitForm;
      vm.goToStep = goToStep;
      vm.nextAction = 'save';

      // EXPOSURE SELECT
      vm.exposure = [
        {name: 'indoor', value: 1},
        {name: 'outdoor', value: 2}
      ];

      // FORM INFO
      vm.kitForm = {};
      vm.kitData = undefined;

      // TAGS SELECT
      vm.tags = [];
      $scope.$watch('vm.tag', function(newVal) {
        if(!newVal) {
          return;
        }
        // remove selected tag from select element
        vm.tag = undefined;

        var selectedTag = _.find(vm.tags, function(tag) {
          return tag.id === newVal;
        });

        var alreadyPushed = _.some(vm.kitForm.tags, function(tag) {
          return tag === selectedTag.name;
        });

        if(alreadyPushed) {
          return;
        }

        vm.kitForm.tags.push(selectedTag.name);
      });

      vm.removeTag = removeTag;

      // MAP CONFIGURATION
      vm.getLocation = getLocation;
      vm.markers = {};
      vm.tiles = {
        url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg'
      };
      vm.defaults = {
        scrollWheelZoom: false
      };

      initialize();

      /////////////////

      function initialize() {
        var kitID = $stateParams.id;

        animation.viewLoaded();
        getTags();

        if (!kitID || kitID === ''){
          return;
        }
        device.getDevice(kitID)
          .then(function(deviceData) {
            vm.kitData = new FullKit(deviceData);
            vm.kitForm = {
              name: vm.kitData.name,
              exposure: findExposureFromLabels(vm.kitData.labels),
              location: {
                lat: vm.kitData.latitude,
                lng: vm.kitData.longitude,
                zoom: 16
              },
              tags: vm.kitData.userTags,
              description: vm.kitData.description
            };
            vm.markers = {
              main: {
                lat: vm.kitData.latitude,
                lng: vm.kitData.longitude,
                draggable: true
              }
            };

            if(!vm.kitData.version || vm.kitData.version.id === 2 || vm.kitData.version.id === 3){
              vm.setupAvailable = true;
            }

            vm.macAddress = vm.kitData.macAddress;

            push.device(vm.kitData.id, $scope);

          });
      }

      function getLocation() {
        window.navigator.geolocation.getCurrentPosition(function(position) {
          $scope.$apply(function() {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            vm.kitForm.location.lat = lat;
            vm.kitForm.location.lng = lng;
            vm.markers.main.lat = lat;
            vm.markers.main.lng = lng;
          });
        });
      }

      function removeTag(tagName) {
        vm.kitForm.tags = _.filter(vm.kitForm.tags, function(tag) {
          return tag !== tagName;
        });
      }

      function submitFormAndKit(){
        submitForm(toProfile, timewait.normal);
      }

      function submitFormAndNext(){
        submitForm(openKitSetup, timewait.short);
      }

      function submitForm(next, delayTransition) {
        var data = {
          name: vm.kitForm.name,
          description: vm.kitForm.description,
          exposure: findExposure(vm.kitForm.exposure),
          latitude: vm.kitForm.location.lat,
          longitude: vm.kitForm.location.lng,
          /*jshint camelcase: false */
          user_tags: vm.kitForm.tags.join(',')
        };

        if(!vm.macAddress || vm.macAddress === ''){
          /*jshint camelcase: false */
          data.mac_address = null;
        } else if(/([0-9A-Fa-f]{2}\:){5}([0-9A-Fa-f]{2})/.test(vm.macAddress)){
          /*jshint camelcase: false */
          data.mac_address = vm.macAddress;
        } else {
          /*jshint camelcase: false */
          var message = 'The mac address you entered is not a valid address';
          alert.error(message);
          data.mac_address = null;
          throw new Error('[Client:error] ' + message);
        }

        device.updateDevice(vm.kitData.id, data)
          .then(
            function() {
              if (!vm.macAddress && $stateParams.step === 2) {
                alert.info.generic('Your kit was successfully updated but you will need to register the Mac Address later 🔧');
              } else if (next){
                alert.success('Your kit was successfully updated');
              }
              ga('send', 'event', 'Kit', 'update');
              device.updateContext().then(function(){
                if (next){
                  $timeout(next, delayTransition);
                }
              });
            })
            .catch(function(err) {
              if(err.data.errors.mac_address[0] === 'has already been taken') {
                alert.error('You are trying to register a kit that is already registered. Please, read <a href="http://docs.smartcitizen.me/#/start/how-do-i-register-again-my-sck">How do I register again my SCK?</a> or contact <a href="mailto:support@smartcitizen.me ">support@smartcitizen.me</a> for any questions.');
                ga('send', 'event', 'Kit', 'unprocessable entity');
              }
              else {
                alert.error('There has been an error during kit set up');
                ga('send', 'event', 'Kit', 'update failed');
              }
              $timeout(function(){ },timewait.long);
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
        if (!vm.macAddress && $stateParams.step === 2) {
          alert.info.generic('Remember you will need to register the Mac Address later 🔧');
          $timeout(toProfile, timewait.normal);
        } else {
          toProfile();
        }
      }

      function toProfile(){
        $state.transitionTo('layout.myProfile.kits', $stateParams,
        { reload: false,
          inherit: false,
          notify: true
        });
      }

      function openKitSetup() {
        $timeout($state.go('layout.kitEdit', {id:$stateParams.id, step:2}), timewait.short);
      }

      function backToKit(){
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
    .factory('utils', utils);

    utils.$inject = ['device', 'PreviewKit', '$q'];
    function utils(device, PreviewKit, $q) {
      var service = {
        parseKit: parseKit,
        parseKitTime: parseKitTime,
        parseSensorTime: parseSensorTime,
        convertTime: convertTime,
        getOwnerKits: getOwnerKits
      };
      return service;

      ///////////////////////////

      function parseKit(object) {
        var parsedKit = {
          kitName: object.device.name,
          kitType: parseKitType(object),
          kitLastTime: moment(parseKitTime(object)).fromNow(),
          kitLocation: parseKitLocation(object),
          kitLabels: parseKitLabels(object),
          kitClass: classify(parseTypeSlug(object))
        };
        return parsedKit;
      }

      function parseKitLocation(object) {
        var location = '';

        var city = object.data.location.city;
        var country = object.data.location.country;

        if(!!city) {
          location += city;
        }
        if(!!country) {
          location += ', ' + country;
        }

        return location;
      }

      function parseKitLabels(object) {
        return {
          status: object.status,
          exposure: object.data.location.exposure
        };
      }

      function parseKitType(object) {
        var kitType = !object.kit ? 'Unknown type': object.kit.name;
        return kitType; 
      }

      function parseTypeSlug(object) {
        var kitType = !object.kit ? 'unknown': object.kit.slug;
        var kitTypeSlug = kitType.substr(0,kitType.indexOf(':')).toLowerCase();
        return kitTypeSlug;
      }

      function classify(kitType) {
        if(!kitType) {
          return '';
        }
        return kitType.toLowerCase().split(' ').join('_');
      }

      function parseKitTime(object) {
        /*jshint camelcase: false */
        return object.updated_at;
      }

      function parseSensorTime(sensor) {
        /*jshint camelcase: false */
        return moment(sensor.recorded_at).format('');
      }

      function convertTime(time) {
        return moment(time).toISOString();
      }

      function getOwnerKits(ids) {
        var deferred = $q.defer();
        var kitsResolved = 0;
        var kits = [];

        ids.forEach(function(id, index) {
          device.getDevice(id)
            .then(function(data) {
              kits[index] = new PreviewKit(data);
              kitsResolved++;

              if(ids.length === kitsResolved) {
                deferred.resolve(kits);
              }
            });
        });
        return deferred.promise;
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
      getCurrentRange: getCurrentRange,
      getToday: getToday,
      getSevenDaysAgo: getSevenDaysAgo,
      getDateIn: getDateIn,
      parseTime: parseTime,
      isSameDay: isSameDay,
      isWithin15min: isWithin15min,
      isWithin1Month: isWithin1Month,
      isWithin: isWithin,
      isDiffMoreThan15min: isDiffMoreThan15min
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


    function getSecondsFromDate(date) {
      return (new Date(date)).getTime();
    }

    function getCurrentRange(fromDate, toDate) {
      return moment(toDate).diff(moment(fromDate), 'days');
    }

    function parseTime(time, format) {
      time = getSecondsFromDate(time);
      return getDateIn(time, format);
    }

    function getToday() {
      return (new Date()).getTime();
    }

    function getSevenDaysAgo() {
      return getSecondsFromDate( getToday() - (7 * 24 * 60 * 60 * 1000) );
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
            return object.avatar;
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

    markerUtils.$inject = ['device', 'kitUtils', 'COUNTRY_CODES', 'MARKER_ICONS'];
    function markerUtils(device, kitUtils, COUNTRY_CODES, MARKER_ICONS) {
      var service = {
        parseType: parseType,
        parseLocation: parseLocation,
        parseLabels: parseLabels,
        parseUserTags: parseUserTags,
        parseCoordinates: parseCoordinates,
        parseId: parseId,
        getIcon: getIcon,
        parseName: parseName,
        parseTime: parseTime,
        getMarkerIcon: getMarkerIcon,
        parseTypeSlug: parseTypeSlug
      };
      _.defaults(service, kitUtils);
      return service;

      ///////////////

      function parseType(object) {
        var kitType;

        // We must wait here if the genericKitData is not already defined.
        var genericKitData = device.getKitBlueprints();

        if(!genericKitData){
            kitType = 'Unknown kit';
            return kitType;
        }
        //////////////////////////////////////////////////////////////////

        /*jshint camelcase: false */
        if(!object.kit_id){
          kitType = 'Unknown kit';
          return;
        }

        /*jshint camelcase: false */
        var kit = genericKitData[object.kit_id];

        kitType = !kit ? 'Unknown type': kit.name;

        return kitType; 
      }

      function parseTypeSlug(object) {
        var kitType;

        // We must wait here if the genericKitData is not already defined.
        var genericKitData = device.getKitBlueprints();

        if(!genericKitData){
            kitType = 'unknown';
            return kitType;
        }
        //////////////////////////////////////////////////////////////////

        /*jshint camelcase: false */
        if(!object.kit_id){
          kitType = 'unknown';
          return;
        }

        /*jshint camelcase: false */
        var kit = genericKitData[object.kit_id];

        var kitTypeSlug = !kit ? 'unknown': kit.slug;

        return kitTypeSlug.substr(0,kitTypeSlug.indexOf(':')).toLowerCase();
      }

      function parseLocation(object) {
        var location = '';

        /*jshint camelcase: false */
        var city = object.city;
        var country_code = object.country_code;
        var country = COUNTRY_CODES[country_code];

        if(!!city) {
          location += city;
        }
        if(!!country) {
          location += ', ' + country;
        }

        return location;
      }

      function parseLabels(object) {
        /*jshint camelcase: false */
        return object.system_tags;
      }

      function parseUserTags(object) {
        return object.user_tags;
      }

      function parseCoordinates(object) {
        return {
          lat: object.latitude,
          lng: object.longitude
        };
      }

      function parseId(object) {
        return object.id;
      }

      function getIcon(object) {
        var icon;

        var labels = this.parseLabels(object);
        var type = this.parseTypeSlug(object);

        if(hasLabel(labels, 'offline')) {
          icon = MARKER_ICONS.markerSmartCitizenOffline;
        } else if (type === 'sck') {
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

      function parseName(object) {
        if(!object.name) {
          return;
        }
        return object.name.length <= 41 ? object.name : object.name.slice(0, 35).concat(' ... ');
      }

      function parseTime(object) {
        var time = object.last_reading_at;
        if(!time) {
          return 'No time';
        }
        return moment(time).fromNow();
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

      function setDefaultFilters(filterData, defaultFilters) {
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
    .factory('kitUtils', kitUtils);

    kitUtils.$inject = ['COUNTRY_CODES', 'device'];
    function kitUtils(COUNTRY_CODES, device) {
      var service = {
        parseLocation: parseLocation,
        parseLabels: parseLabels,
        parseUserTags: parseUserTags,
        parseType: parseType,
        classify: classify,
        parseTime: parseTime,
        parseVersion: parseVersion,
        parseOwner: parseOwner,
        parseState: parseState,
        parseAvatar: parseAvatar,
        belongsToUser: belongsToUser,
        parseSensorTime: parseSensorTime,
        parseTypeSlug: parseTypeSlug,
        parseTypeDescription: parseTypeDescription
      };

      return service;


      ///////////////

      function parseLocation(object) {
        var location = '';

        var locationData = object.hasOwnProperty('data') ? object.data : object;

        if (locationData.location) {
          var city = locationData.location.city;
          var country = locationData.location.country;

          if(!!city) {
            location += city;
          }
          if(!!country) {
            location += ', ' + country;
          }
        }

        return location;
      }

      function parseLabels(object) {
        /*jshint camelcase: false */
        return object.system_tags;
      }

      function parseUserTags(object) {
        return object.user_tags;
      }

      function parseType(object) {
        if (object.hasOwnProperty('kit')) {
          return !object.kit ? 'Unknown type': object.kit.name;
        } else {
          var kitBlueprints = device.getKitBlueprints();
          return !kitBlueprints[object.kit_id] ? 'Unknown type': kitBlueprints[object.kit_id].name;
        };

        return kitType;
      }
      function parseTypeDescription(object) {
        if (object.hasOwnProperty('kit')) {
          return !object.kit ? 'Unknown type': object.kit.description;
        } else {
          var kitBlueprints = device.getKitBlueprints();
          return !kitBlueprints[object.kit_id] ? 'Unknown type': kitBlueprints[object.kit_id].description;
        };
      }

      function parseTypeSlug(object) {
        if (object.hasOwnProperty('kit')) {
          var kitType = !object.kit ? 'unknown': object.kit.slug;
        } else {
          var kitBlueprints = device.getKitBlueprints();
          var kitType = !kitBlueprints[object.kit_id] ? 'unknown': kitBlueprints[object.kit_id].slug;
        };
        var kitTypeSlug = kitType.substr(0,kitType.indexOf(':')).toLowerCase();
        return kitTypeSlug;
      }

      function classify(kitType) {
        if(!kitType) {
          return '';
        }
        return kitType.toLowerCase().split(' ').join('_');
      }

      function parseTime(object) {
        /*jshint camelcase: false */
        return object.last_reading_at;
      }

      function parseVersion(object) {
        if(!object.kit || !object.kit.slug ) {
          return;
        }
        return {
          id: object.kit.id,
          hardware:  parseVersionName(object.kit.slug.split(':')[0]),
          release: parseVersionString(object.kit.slug.split(':')[1]),
          slug: object.kit.slug
        };
      }

      function parseVersionName (str) {
          if (typeof(str) !== 'string') { return false; }
          return str;
      }

      function parseVersionString (str) {
          if (typeof(str) !== 'string') { return false; }
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

      function parseOwner(object) {
        return {
          id: object.owner.id,
          username: object.owner.username,
          /*jshint camelcase: false */
          kits: object.owner.device_ids,
          city: object.owner.location.city,
          country: COUNTRY_CODES[object.owner.location.country_code],
          url: object.owner.url,
          avatar: object.owner.avatar
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

      function belongsToUser(kitsArray, kitID) {
        return _.some(kitsArray, function(kit) {
          return kit.id === kitID;
        });
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
    .filter('filterLabel', filterLabel);


    function filterLabel() {
      return function(kits, targetLabel) {
        if(targetLabel === undefined) {
          return kits;
        }
        if(kits) {
          return _.filter(kits, function(kit) {
            var containsLabel = kit.labels.indexOf(targetLabel) !== -1;
            console.log(containsLabel);
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
      {divider: true, text: 'Hello,'},
      {text: 'PROFILE', href: './profile'},
      {text: 'LOGOUT', href: './logout'}
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
          .getList({'per_page': 100})
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

    sensor.$inject = ['Restangular', 'utils', 'sensorUtils'];
    function sensor(Restangular, utils, sensorUtils) {
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
        return Restangular.all('sensors').getList({'per_page': 100});
      }

      function setTypes(sensorTypes) {
        sensorTypes = sensorTypes;
      }

      function getTypes() {
        return sensorTypes;
      }

      function getSensorsData(deviceID, sensorID, dateFrom, dateTo) {
        var rollup = sensorUtils.getRollup(dateFrom, dateTo);
        dateFrom = utils.convertTime(dateFrom);
        dateTo = utils.convertTime(dateTo);
        
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
	  .factory('push', push);

	  function push() {
      var socket;

      init();

      var service = {
        devices: devices,
        device: device
      };

      function init(){
        socket = io.connect('wss://ws.smartcitizen');
      }

      function devices(then){
        socket.on('data-received', then);
      }

      function device(id, scope){
        devices(function(data){
          if(id === data.device_id) {
            scope.$emit('published', data);
          }
        });
      }

      return service;
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
      return Restangular.all('measurements').getList({'per_page': 100});
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
      var kitBlueprints, worldMarkers;

      initialize();

	  	var service = {
        getDevices: getDevices,
        getAllDevices: getAllDevices,
        getDevice: getDevice,
        createDevice: createDevice,
        updateDevice: updateDevice,
        createKitBlueprints: createKitBlueprints,
        getKitBlueprints: getKitBlueprints,
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

      function getKitBlueprints() {
        return kitBlueprints;
      }

      function createKitBlueprints() {
        return Restangular.all('kits').getList()
          .then(function(fetchedKitBlueprints){
            kitBlueprints = _.keyBy(fetchedKitBlueprints.plain(), 'id');
            return kitBlueprints;
        });
      }

      function getWorldMarkers() {
        return worldMarkers || ($window.localStorage.getItem('smartcitizen.markers') && JSON.parse($window.localStorage.getItem('smartcitizen.markers') ).data);
      }

      function setWorldMarkers(data) {
        var obj = {
          timestamp: new Date(),
          data: data
        };

        $window.localStorage.setItem('smartcitizen.markers', JSON.stringify(obj) );
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
					.remove();
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
      '$rootScope', 'AuthUser', '$timeout', 'alert'];
    function auth($location, $window, $state, Restangular, $rootScope, AuthUser,
       $timeout, alert) {

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
        saveData: saveData,
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
        setCurrentUser('appLoad');
      }
      //run on app initialization so that we can keep auth across different sessions
      function setCurrentUser(time) {
        user.token = $window.localStorage.getItem('smartcitizen.token') &&
          JSON.parse( $window.localStorage.getItem('smartcitizen.token') );
        user.data = $window.localStorage.getItem('smartcitizen.data') &&
          new AuthUser(JSON.parse(
            $window.localStorage.getItem('smartcitizen.data')
          ));
        if(!user.token) {
          return;
        }
        return getCurrentUserInfo()
          .then(function(data) {
            $window.localStorage.setItem('smartcitizen.data', JSON.stringify(data.plain()) );

            var newUser = new AuthUser(data);
            //check sensitive information
            if(user.data && user.data.role !== newUser.role) {
              user.data = newUser;
              $location.path('/');
            }
            user.data = newUser;

            // used for app initialization
            if(time && time === 'appLoad') {
              //wait until navbar is loaded to emit event
              $timeout(function() {
                $rootScope.$broadcast('loggedIn', {time: 'appLoad'});
              }, 3000);
            } else {
              // used for login
              $state.reload();
              $timeout(function() {
                alert.success('Login was successful');
                $rootScope.$broadcast('loggedIn', {});
              }, 2000);
            }
          });
      }

      function updateUser() {
        return getCurrentUserInfo()
          .then(function(data) {
            $window.localStorage.setItem('smartcitizen.data', JSON.stringify(data.plain()) );
          });
      }

      function getCurrentUser() {
        user.token = $window.localStorage.getItem('smartcitizen.token') && JSON.parse( $window.localStorage.getItem('smartcitizen.token') ),
        user.data = $window.localStorage.getItem('smartcitizen.data') && new AuthUser(JSON.parse( $window.localStorage.getItem('smartcitizen.data') ));
        return user;
      }

      function isAuth() {
        return !!$window.localStorage.getItem('smartcitizen.token');
      }
      //save to localstorage and
      function saveData(token) {
        $window.localStorage.setItem('smartcitizen.token', JSON.stringify(token) );
        setCurrentUser();
      }

      function login(loginData) {
        return Restangular.all('sessions').post(loginData);
      }

      function logout() {
        $window.localStorage.removeItem('smartcitizen.token');
        $window.localStorage.removeItem('smartcitizen.data');
      }

      function getCurrentUserInfo() {
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

      function link(scope, elem) {
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
        kitLoaded: kitLoaded,
        showPasswordRecovery: showPasswordRecovery,
        showLogin: showLogin,
        showSignup: showSignup,
        showPasswordReset: showPasswordReset,
        hideAlert: hideAlert,
        viewLoading: viewLoading,
        viewLoaded: viewLoaded,
        kitWithoutData: kitWithoutData,
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
      function kitLoaded(data) {
        $rootScope.$broadcast('kitLoaded', data);
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
      function kitWithoutData(data) {
        $rootScope.$broadcast('kitWithoutData', data);
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
     * TODO: This directives can be split up each one in a different file
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
      'utils', 'user', 'device', 'alert', 'auth', 'userUtils', '$timeout', 'animation',
      'NonAuthUser', '$q', 'PreviewKit'];
    function UserProfileController($scope, $stateParams, $location, utils,
        user, device, alert, auth, userUtils, $timeout, animation,
        NonAuthUser, $q, PreviewKit) {

      var vm = this;
      var userID = parseInt($stateParams.id);

      vm.status = undefined;
      vm.user = {};
      vm.kits = [];
      vm.filteredKits = [];
      vm.filterKits = filterKits;

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

            var kitIDs = _.map(vm.user.kits, 'id');
            if(!kitIDs.length) {
              return [];
            }

            return $q.all(
              kitIDs.map(function(id) {
                return device.getDevice(id)
                  .then(function(data) {
                    return new PreviewKit(data);
                  });
              })
            );

          }).then(function(kitsData){
            if (kitsData){
              vm.kits = kitsData;
            }
          }, function(error) {
            if(error && error.status === 404) {
              $location.url('/404');
            }
          });

        $timeout(function() {
          setSidebarMinHeight();
          animation.viewLoaded();
        }, 500);
      }

      function filterKits(status) {
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
        .then((result) => parseDataForPost(result.data)) // TODO remove
        // TODO with workers
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
    'PreviewKit', 'animation', '$timeout', '$rootScope'
  ];

  function tagsController(tag, $scope, device, $state, $q, PreviewKit,
    animation, $timeout, $rootScope) {

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

      getTaggedKits()
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

    function getTaggedKits() {

      var deviceProm = _.map(vm.markers, getMarkerDevice);

      return $q.all(deviceProm)
        .then(function(devices) {  
          return _.map(_.sortBy(devices, descLastUpdate), toPreviewKit); // This sort is temp
        });
    }

    function toPreviewKit(dev) {
      return new PreviewKit(dev);
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
    .controller('SignupModalController', SignupModalController);

    SignupModalController.$inject = ['$scope', '$mdDialog', 'user',
      'alert', 'animation', '$location'];
    function SignupModalController($scope, $mdDialog, user,
      alert, animation, $location) {
      var vm = this;
      vm.answer = function(signupForm) {

        if (!signupForm.$valid){
          return;
        }

        $scope.waitingFromServer = true;
        user.createUser(vm.user)
          .then(function(data) {
            alert.success('Signup was successful');
            $mdDialog.hide();
            ga('send', 'event', 'Signup', 'signed up');
          }).catch(function(err) {
            alert.error('Signup failed');
            $scope.errors = err.data.errors;
            ga('send', 'event', 'Signup', 'failed');
          })
          .finally(function(data) {
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

        ga('send', 'event', 'Search Input', 'search', query);
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
    'userData', 'AuthUser', 'user', 'auth', 'utils', 'alert',
    'COUNTRY_CODES', '$timeout', 'file', 'PROFILE_TOOLS', 'animation',
    '$mdDialog', 'PreviewKit', 'device', 'kitUtils',
    'userUtils', '$filter','$state', 'Restangular'];
    function MyProfileController($scope, $location, $q, $interval,
      userData, AuthUser, user, auth, utils, alert,
      COUNTRY_CODES, $timeout, file, PROFILE_TOOLS, animation,
      $mdDialog, PreviewKit, device, kitUtils,
      userUtils, $filter, $state, Restangular) {

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
      vm.user.token = auth.getCurrentUser().token;
      vm.addNewKit = addNewKit;


      //KITS TAB
      vm.kits = [];
      vm.kitStatus = undefined;
      vm.removeKit = removeKit;

      vm.filteredKits = [];

      vm.dropdownSelected = undefined;

      //TOOLS TAB
      vm.tools = PROFILE_TOOLS;
      vm.toolType = undefined;
      vm.filteredTools = [];

      //SIDEBAR
      vm.filterKits = filterKits;
      vm.filterTools = filterTools;

      vm.selectThisTab = selectThisTab;

      var updateKitsTimer;

      $scope.$on('loggedOut', function() {
        $location.path('/');
      });

      $scope.$on('devicesContextUpdated', function(){
        initialize();
      });

      initialize();

      //////////////////

      function initialize() {
        startingTab();
        if(!vm.user.kits.length) {
          vm.kits = [];
          animation.viewLoaded();
        } else {
          device.createKitBlueprints().then(function(){

            vm.kits = vm.user.kits.map(function(data) {
              return new PreviewKit(data);
            })

            $timeout(function() {
              mapWithBelongstoUser(vm.kits);
              filterKits(vm.status);
              setSidebarMinHeight();
              animation.viewLoaded();
            });

          });
        }
      }

      function filterKits(status) {
        if(status === 'all') {
          status = undefined;
        }
        vm.kitStatus = status;
        vm.filteredKits = $filter('filterLabel')(vm.kits, vm.kitStatus);
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
        }

        user.updateUser(userData)
          .then(function(data) {
            var user = new AuthUser(data);
            _.extend(vm.user, user);
            vm.errors = {};
            alert.success('User updated');
            ga('send', 'event', 'Profile', 'update');
          })
          .catch(function(err) {
            alert.error('User could not be updated ');
            vm.errors = err.data.errors;
            ga('send', 'event', 'Profile', 'update failed');
          });
      }

      function removeUser() {
        var confirm = $mdDialog.confirm()
          .title('Delete your account?')
          .content('Are you sure you want to delete your account?')
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
          case 'tools':
            vm.startingTab = 2;
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
          file.getCredentials(fileData[0].name)
            .then(function(res) {
              file.uploadFile(fileData[0], res.key, res.policy, res.signature)
                .success(function() {
                  vm.user.avatar = file.getImageURL(res.key);
                });
              });
        }
      }

      function copyUserToForm(formData, userData) {
        var props = {username: true, email: true, city: true, country: true, country_code: true, website: true, constructor: false};

        for(var key in userData) {
          if(props[key]) {
            formData[key] = userData[key];
          }
        }
      }

      function updateKits() {
        if(!vm.user.kits.length) {
          return [];
        }

        device.createKitBlueprints().then(function(){
          vm.kits = vm.user.kits.map(function(data) {
            return new PreviewKit(data);
          })
        })

        .then(function(data){
          vm.kits = data;
        });
      }

      function mapWithBelongstoUser(kits){
        _.map(kits, addBelongProperty);
      }

      function addBelongProperty(kit){
        kit.belongProperty = kitBelongsToUser(kit);
        return kit;
      }

      function kitBelongsToUser(kit){
        if(!auth.isAuth() || !kit || !kit.id) {
          return false;
        }
        var kitID = parseInt(kit.id);
        var userData = ( auth.getCurrentUser().data ) ||
          ($window.localStorage.getItem('smartcitizen.data') &&
          new AuthUser( JSON.parse(
            $window.localStorage.getItem('smartcitizen.data') )));

        var belongsToUser = kitUtils.belongsToUser(userData.kits, kitID);
        var isAdmin = userUtils.isAdmin(userData);

        return isAdmin || belongsToUser;
      }

      function removeKit(kitID) {
        var confirm = $mdDialog.confirm()
          .title('Delete this kit?')
          .content('Are you sure you want to delete this kit?')
          .ariaLabel('')
          .ok('DELETE')
          .cancel('Cancel')
          .theme('primary')
          .clickOutsideToClose(true);

        $mdDialog
          .show(confirm)
          .then(function(){
            device
              .removeDevice(kitID)
              .then(function(){
                alert.success('Your kit was deleted successfully');
                ga('send', 'event', 'Kit', 'delete');
                device.updateContext().then(function(){
                  var userData = auth.getCurrentUser().data;
                  if(userData){
                    vm.user = userData;
                  }
                  //updateKits();
                  initialize();
                });
              })
              .catch(function(){
                alert.error('Error trying to delete your kit.');
              });
          });
      }

      function addNewKit() {
        var confirm = $mdDialog.confirm()
          .title('Hey! Do you want to add a new kit?')
          .content('Please, notice this currently supports just the SCK 1.0 and SCK 1.1')
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

  MapFilterModalController.$inject = ['$mdDialog','selectedFilters'];

  function MapFilterModalController($mdDialog, selectedFilters) {

    var vm = this;

    vm.checks = {};

    vm.answer = answer;
    vm.hide = hide;
    vm.clear = clear;
    vm.cancel = cancel;

    vm.filters = ['indoor', 'outdoor', 'online', 'offline'];

    init();

    ////////////////////////////////////////////////////////

    function init() {
      _.forEach(selectedFilters, select);
    }

    function answer() {

      var selectedFilters = _(vm.filters)
        .filter(isFilterSelected)
        .value();
      $mdDialog.hide(selectedFilters);
    }

    function hide() {
      answer();
    }

    function clear() {
      $mdDialog.hide(vm.filters);
    }

    function cancel() {
      answer();
    }

    function isFilterSelected(filter) {
      return vm.checks[filter];
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
    '$mdDialog', 'leafletData', 'mapUtils', 'markerUtils', 'alert',
    'Marker', 'tag', 'animation', '$q'];
    function MapController($scope, $state, $stateParams, $timeout, device,
      $mdDialog, leafletData, mapUtils, markerUtils, alert, Marker, tag, animation, $q) {
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
        lat: 13.14950321154457,
        lng: -1.58203125,
        zoom: 2
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

        vm.kitLoading = true;
        vm.center.lat = data.leafletEvent.latlng.lat;
        vm.center.lng = data.leafletEvent.latlng.lng;

        if(id === parseInt($state.params.id)) {
          $timeout(function() {
            vm.kitLoading = false;
          });
          return;
        }

        updateType = 'map';

        var availability = data.leafletEvent.target.options.myData.labels[0];
        ga('send', 'event', 'Kit Marker', 'click', availability);

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

      vm.readyForKit = {
        kit: false,
        map: false
      };

      $scope.$on('kitLoaded', function(event, data) {
        vm.readyForKit.kit = data;
      });

      $scope.$watch('vm.readyForKit', function() {
        if (vm.readyForKit.kit && vm.readyForKit.map) {
          zoomKitAndPopUp(vm.readyForKit.kit);
        }
      }, true);

      $scope.$on('goToLocation', function(event, data) {
        goToLocation(data);
      });

      $scope.$on('leafletDirectiveMap.dragend', function(){
        reportMapInteractionByUser();
      });

      $scope.$on('leafletDirectiveMap.click', function(){
        reportMapInteractionByUser();
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

        vm.readyForKit.map = false;

        $q.all([device.getAllDevices($stateParams.reloadMap), device.createKitBlueprints()])
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
            } else {
              updateMarkers();
            }

            vm.readyForKit.map = true;

          });
      }

      function zoomKitAndPopUp(data){

        if(updateType === 'map') {
          vm.kitLoading = false;
          updateType = undefined;
          return;
        } else {
          vm.kitLoading = true;
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
                          vm.kitLoading = false;
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

            vm.kitLoading = false;

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

      function reportMapInteractionByUser(){
        ga('send', 'event', 'Map', 'moved');
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

    LoginModalController.$inject = ['$scope', '$mdDialog', 'auth', 'alert', 'animation'];
    function LoginModalController($scope, $mdDialog, auth, alert, animation) {
      const vm = this;
      $scope.answer = function(answer) {
        $scope.waitingFromServer = true;
        auth.login(answer)
          .then(function(data) {
            /*jshint camelcase: false */
            var token = data.access_token;
            auth.saveData(token);
            $mdDialog.hide();
          })
          .catch(function(err) {
            vm.errors = err.data.errors;
            alert.error('Username or password incorrect');
            ga('send', 'event', 'Login', 'logged in');
          })
          .finally(function() {
            $scope.waitingFromServer = false;
            ga('send', 'event', 'Login', 'failed');
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
    .controller('LayoutController', LayoutController);

    LayoutController.$inject = ['$location', '$state', '$scope', '$transitions', 'auth', 'animation', '$timeout', 'DROPDOWN_OPTIONS_COMMUNITY', 'DROPDOWN_OPTIONS_USER'];
    function LayoutController($location, $state, $scope, $transitions, auth, animation, $timeout, DROPDOWN_OPTIONS_COMMUNITY, DROPDOWN_OPTIONS_USER) {
      var vm = this;

      vm.navRightLayout = 'space-around center';

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
        vm.dropdownOptions[0].text = 'Hello, ' + vm.currentUser.username;
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
        ga('send', 'event', 'Logout', 'click');
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

(function(){
  'use strict';
  angular.module('app.components')
    .directive('kitList',kitList);

  function kitList(){
    return{
      restrict:'E',
      scope:{
        kits:'=kits',
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

	DownloadModalController.$inject = ['thisKit', 'device', '$mdDialog'];

	function DownloadModalController(thisKit, device, $mdDialog) {
		var vm = this;

		vm.kit = thisKit;
		vm.download = download;
		vm.cancel = cancel;

		////////////////////////////

		function download(){
			device.mailReadings(vm.kit)
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
      //$cookies.remove('consent');
      //$cookies.remove('expires');
      //console.log($cookies.getAll());

      $scope.isCookieValid = function() {
        // Use a boolean for the ng-hide, because using a function with ng-hide
        // is considered bad practice. The digest cycle will call it multiple 
        // times, in our case around 240 times.
        $scope.isCookieValidBool = ($cookies.get('consent') === 'true') && ($scope.isCookieAlive())
      }

      $scope.isCookieAlive = function() {
        return $cookies.get('expires') > (new Date).getTime();
      }

      $scope.acceptCookie = function() {
        //console.log('Accepting cookie...');
        var d = new Date();
        d.setTime(d.getTime() + (30 * 24 * 60 * 60 *1000));
        var expires = 'expires=' + d.toUTCString();
        $cookies.put('expires', d.getTime());
        $cookies.put('consent', true);
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

        margin = {top: 20, right: 12, bottom: 20, left: 40};
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
          owner: infoNoDataOwner
        },
        longTime: infoLongTime,
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
        buttonAttributes: 'analytics-on="click" analytics-event="click" ' +
          'analytics-category="Offline Kit Comment Link"',
        href: 'https://forum.smartcitizen.me/'
      });
    }

    function infoNoDataOwner(kitID) {
      info('Woah! We couldn\'t locate this kit on the map because it hasn\'t published any data.',
        10000);
    }


    function infoLongTime() {
      info('😅 It looks like this kit hasn\'t posted any data in a long ' +
        'time. Why not leave a comment to let its owner know?', 10000,
        {
          button: 'Leave comment',
          buttonAttributes: 'analytics-on="click" analytics-event="click" ' +
          'analytics-category="Long time No published Kit Comment Link"',
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
          buttonAttributes: options && options.buttonAttributes,
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
  'angulartics',
  'angulartics.google.analytics',
  'ngSanitize',
  'angular-clipboard',
  'ngCookies',
  'ngMessages',
  'ngtweet',
  'btford.socket-io',
  'ngAnimate'
]);

(function() {
  'use strict';

  angular.module('app')
    .config(config);

    /*
      Check app.config.js to know how states are protected
    */

    belongsToUser.$inject = ['$window', '$stateParams', 'auth', 'AuthUser', 'kitUtils', 'userUtils']
    function belongsToUser($window, $stateParams, auth, AuthUser, kitUtils, userUtils) {
      if(!auth.isAuth() || !$stateParams.id) {
        return false;
      }
      var kitID = parseInt($stateParams.id);
      var userData = ( auth.getCurrentUser().data ) || ($window.localStorage.getItem('smartcitizen.data') && new AuthUser( JSON.parse( $window.localStorage.getItem('smartcitizen.data') )));
      var belongsToUser = kitUtils.belongsToUser(userData.kits, kitID);
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


    config.$inject = ['$stateProvider', '$urlServiceProvider', '$locationProvider', 'RestangularProvider', '$logProvider', '$mdAriaProvider'];
    function config($stateProvider, $urlServiceProvider, $locationProvider, RestangularProvider, $logProvider, $mdAriaProvider) {
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
        .state('layout', {
          url: '',
          abstract: true,
          templateUrl: 'app/components/layout/layout.html',
          controller: 'LayoutController',
          controllerAs: 'vm'
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
            kit: ['device', 'FullKit', '$stateParams', function(device, FullKit, $stateParams) {
              return device.getDevice($stateParams.id)
              .then(kit => new FullKit(kit));
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
            sensorTypes: function(sensor) {
              return sensor.callAPI()
                .then(function(sensorTypes) {
                  return sensorTypes.plain();
                });
            },
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
            sensorTypes: function(sensor) {
              return sensor.callAPI()
                .then(function(sensorTypes) {
                  return sensorTypes.plain();
                });
            },
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
        .state('layout.myProfile.tools', {
          url: '/tools',
          authenticate: true,
          templateUrl: 'app/components/myProfile/Tools.html',
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
        .state('layout.myProfileAdmin.tools', {
          url: '/tools',
          authenticate: true,
          templateUrl: 'app/components/myProfile/Tools.html',
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
              if(auth.isAuth()) {
                return $location.path('/kits');
              }
              $location.path('/kits/');
              $location.search('login', 'true');
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

      /* Remove angular leaflet logs */
      $logProvider.debugEnabled(false);
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
            e.preventDefault();
            $state.go('landing');
            return;
          }
        }

        if(trans.to().authenticate) {
          if(!auth.isAuth()) {
            e.preventDefault();
            $state.go('landing');
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
          var token = auth.getCurrentUser().token;
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

angular.module('app').run(['$templateCache', function($templateCache) {$templateCache.put('app/components/alert/alerterror.html','<md-toast class="red"><md-icon md-svg-src="./assets/images/alert_icon.svg" alt="Insert Drive Icon" class="alert_typeIcon"></md-icon><span ng-bind-html="vm.message" flex="">{{ vm.message }}</span><md-button ng-click="vm.close()" aria-label=""><md-icon md-svg-src="./assets/images/close_icon_black.svg" alt="Insert Drive Icon" class="alert_closeIcon"></md-icon></md-button></md-toast>');
$templateCache.put('app/components/alert/alertinfo.html','<md-toast class="yellow"><md-icon md-svg-src="./assets/images/alert_icon.svg" alt="Alert icon" class="alert_typeIcon"></md-icon><span flex="">{{ vm.message }}</span><md-button ng-click="vm.close()" aria-label=""><md-icon md-svg-src="./assets/images/close_icon_black.svg" alt="Insert Drive Icon" class="alert_closeIcon"></md-icon></md-button></md-toast>');
$templateCache.put('app/components/alert/alertinfoButton.html','<md-toast class="yellow" layout="row" layout-align="space-between center"><div flex=""><md-icon md-svg-src="./assets/images/alert_icon.svg" alt="Alert icon" class="alert_typeIcon"></md-icon><span flex="">{{ vm.message }}</span><md-button ng-href="{{vm.href}}" class="alert_button">{{ vm.button }}</md-button></div><div flex-nogrow=""><md-button ng-click="vm.close()" aria-label=""><md-icon md-svg-src="./assets/images/close_icon_black.svg" alt="Insert Drive Icon" class="alert_closeIcon"></md-icon></md-button></div></md-toast>');
$templateCache.put('app/components/alert/alertsuccess.html','<md-toast class="green"><md-icon md-svg-src="./assets/images/alert_icon.svg" alt="Insert Drive Icon" class="alert_typeIcon"></md-icon><span flex="">{{ vm.message }}</span><md-button ng-click="vm.close()" aria-label=""><md-icon md-svg-src="./assets/images/close_icon_black.svg" alt="Insert Drive Icon" class="alert_closeIcon"></md-icon></md-button></md-toast>');
$templateCache.put('app/components/apiKey/apiKey.html','<div class="api_key_number">{{ apiKey }}</div><md-button clipboard="" text="apiKey" class="api_key_refresh_button" aria-label="" on-copied="vm.copied()" on-error="vm.copyFail(err)"><md-icon class="" md-svg-src="./assets/images/paste_icon.svg"></md-icon></md-button>');
$templateCache.put('app/components/disqus/disqus.html','<div id="disqus_thread"></div><script type="text/javascript">\n   /* * * CONFIGURATION VARIABLES * * */\n   var disqus_shortname = \'smartcitizen\';\n   // var disqus_identifier = \'newid1\';\n   // var disqus_url = \'http://example.com/unique-path-to-article-1/\';\n   // var disqus_config = function () {\n   //   this.language = "en";\n   // };\n\n\n   /* * * DON\'T EDIT BELOW THIS LINE * * */\n   (function() {\n       var dsq = document.createElement(\'script\'); dsq.type = \'text/javascript\'; dsq.async = true;\n       dsq.src = \'//\' + disqus_shortname + \'.disqus.com/embed.js\';\n       (document.getElementsByTagName(\'head\')[0] || document.getElementsByTagName(\'body\')[0]).appendChild(dsq);\n   })();\n</script><noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>');
$templateCache.put('app/components/download/downloadModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Download data</h2><span flex=""></span><md-button class="md-icon-button" ng-click="vm.cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content class="modal modal_download"><div class="md-dialog-content max-width-500px"><p>We will process your sensor data and send you an email with a download link when it is ready</p></div><md-button class="btn-blue btn-full" ng-click="vm.download()">Download</md-button></md-dialog-content></md-dialog>');
$templateCache.put('app/components/footer/footer.html','<footer class="p-60" style="padding-bottom: 10px"><div layout="row" layout-xs="column" layout-sm="column" layout-wrap="" layout-align="space-between center" layout-align-xs="space-between stretch" style="color:white; margin:0 auto; max-width:1200px"><div><img style="height:80px" src="./assets/images/smartcitizen_logo2.svg" alt="logos"></div><div layout="row" layout-align="space-between center" class="border-white p-20 mb-10"><div class="mr-10">Follow us</div><a class="mr-10" href="https://twitter.com/smartcitizenkit"><img style="height:30px" src="./assets/images/tw.svg" alt="twitter"></a> <a href="https://www.facebook.com/smartcitizenBCN/"><img style="height:30px" src="./assets/images/fb.svg" alt="fb"></a></div><div layout="row" layout-align="space-between center" class="border-white p-20 mb-10"><div class="mr-10">A project by</div><a class="mr-10" href="https://fablabbcn.org"><img style="height:18px; padding-right: 5px" src="./assets/images/logo_fablab_bcn_small.png" alt="fablab"></a> <a href="https://iaac.net"><img style="height:15px" src="./assets/images/iaac.png" alt="fablab"></a></div><div flex="25" flex-xs="100" layout="row" layout-xs="column" layout-sm="column" layout-align="start center"><img style="height:48px; padding-right: 15px" src="./assets/images/eu_flag.png" alt="fablab"><p class="color-white text-funding">Smart Citizen has received funding from the European Community\u2019s H2020 Programme under Grant Agreement No. 689954.</p></div><div flex="100" layout="row" layout-align="center center" style="margin-top:20px; padding-bottom:10px"><p class="color-white text-center">Except where otherwise noted, content on this site by Smart Citizen\xAE is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>. <a rel="policy" href="policy">Terms of use and privacy policy</a></p></div></div></footer>');
$templateCache.put('app/components/home/template.html','<div><section class="content"><div ui-view="map" class="map_state"></div><div ui-view="container" class="kit"></div></section></div>');
$templateCache.put('app/components/kitList/kitList.html','<div class="" ng-if="kits.length === 0"><small>No kits</small></div><div class="kitList_parent" ng-repeat="kit in kits track by kit.id" layout="row" layout-align="start center"><md-button ng-href="./kits/{{kit.id}}" class="kitList full-width" ng-class="{kitList_primary: !kit.belongProperty, kitList_secondary: kit.belongProperty, kitList_borderBottom: $last}"><div class="kitList_container" layout="row" layout-align="start center"><img class="kitList_avatar" ng-src="{{ kit.avatar || \'./assets/images/avatar.svg\' }}"><div class="kitList_content"><h4>{{ kit.name || \'No name\' }}</h4><p class="kitList_data md-subhead"><md-icon class="icon_label" md-svg-src="./assets/images/location_icon_light.svg"></md-icon><span>{{ kit.location || \'No location\' }}</span><md-icon class="icon_label" md-svg-src="./assets/images/sensor_icon.svg"></md-icon><span>{{ kit.type || \'Unknown Kit\'}}</span></p></div><div class="kitList_right" layout="row" layout-align="end center"><div class="" ng-if="kit.belongProperty && (kit.state.name === \'never published\' || kit.state.name === \'not configured\')" layout="row" layout-align="center center"><span class="kitList_state kitList_state_{{ kit.state.className }} state">{{ kit.state.name }}</span></div></div></div><div class="kitList_tags" layout="row" layout-align="start center" layout-wrap=""><span class="label" ng-repeat="label in kit.labels">{{ label }}</span><tag ng-repeat="tag in kit.userTags" ng-attr-tag-name="tag" clickable=""></tag></div></md-button><div class="kitList_config" ng-if="kit.belongProperty" layout="row" layout-align="center center"><md-button class="kitList_dropdownButton" aria-label="" dropdown-menu="kit.dropdownOptions" dropdown-model="vm.dropdownSelected" dropdown-item-label="text"><md-icon md-svg-src="./assets/images/config_icon.svg"></md-icon></md-button></div><div ng-if="kit.belongProperty"><md-button ng-click="actions.remove(kit.id)" class="warn" aria-label=""><md-icon md-svg-src="./assets/images/delete_icon.svg"></md-icon></md-button></div></div>');
$templateCache.put('app/components/landing/landing.html','<div class="new-landing-page grey-waves"><img class="sc-logo" src="/assets/images/smartcitizen_logo.svg" alt="logo"> <a href="/kits/" class="btn-outline-white btn-round-new sc-off-cta-platform" analytics-on="click" analytics-category="Landing">GO TO THE PLATFORM</a><section class="video-section"><video style="z-index:0;" autoplay="" muted="" loop="" id="myVideo"><source src="./assets/loop_video.mp4" type="video/mp4"></video><div class="heading-over-video" layout="column" layout-align="center start"><h1 class="color-white font-kanit">CITIZEN SCIENCE REVOLUTION</h1><p class="color-white">Watch the documentary that features our work on the Making Sense project. It explores how open source design and technology can be used by local communities to create change.</p><a href="https://www.facebook.com/PlayGroundMag/videos/2061510993888766/" class="btn-yellow btn-round-new" analytics-on="click" analytics-category="Landing">WATCH IT NOW</a></div></section><div style="margin: 0 auto; max-width:1200px" class="p-60 color-black"><section layout="row" layout-xs="column"><div flex="50" flex-xs="100" layout="column" class=""><div flex="noshrink" flex-order-xs="2" class="bg-white tile tile-left border-xs-bottom tile-top"><h2>WE EMPOWER COMMUNITIES TO BETTER UNDERSTAND THEIR ENVIRONMENT</h2><p style="margin-bottom:33px">We\'re a team of passionate people who believe data is critical to inform political participation at all levels. We develop tools for citizen action in environmental monitoring and methodologies for community engagement and co-creation.</p></div><div flex-order-xs="1" class="img-new_sck tile tile-left tile-image border-xs-top"></div></div><div flex="50" flex-xs="100" layout="column"><div class="img-sck_edu tile tile-top tile-image border-xs-bottom"></div><div flex="noshrink" class="bg-white tile border-xs-left border-xs-bottom"><h2>INTRODUCING A NEW AND IMPROVED KIT</h2><p style="margin-bottom:33px">For the past three years, we have been working on an updated version of the Kit. The new sensors collect urban data more accurately and are easier to use. The Smart Citizen Kit 2.0 will be available to order soon.</p></div></div></section><section class="mt-50"><div class="bg-white p-30 border-black" layout="row" layout-align="center center"><h2>TOOLS FOR EVERY COMMUNITY</h2></div><div layout="row" layout-xs="column"><div flex="40" flex-xs="100" flex-order-xs="1" class="bg-blue tile tile-left border-xs-bottom text-center"><img style="height:85px" src="./assets/images/communities.svg" alt="Community icon"><h3 class="color-white">LOCAL COMMUNITIES</h3><p class="color-white">Launch a crowd sensing initiative in your neighborhood. Use Smart Citizen to create local maps of noise and air quality; use it to raise awareness and find solutions for issues that matter to your community.</p></div><div flex="60" flex-xs="100" flex-order-xs="0" class="img-sck_com tile-image tile border-xs-bottom"></div></div><div layout="row" layout-xs="column"><div flex="60" flex-xs="100" class="img-research tile-image tile tile-left border-xs-bottom"></div><div flex="40" flex-xs="100" class="bg-yellow tile tile-xs text-center border-xs-bottom"><img style="height:85px" src="./assets/images/research.svg" alt="Community icon"><h3>RESEARCHERS</h3><p>Use Smart Citizen as a tool for data capture and analysis. Understand the relationship between people, environment, and technology through real-world deployment. Contribute to the project by joining the open source development community.</p></div></div><div layout="row" layout-xs="column"><div flex="40" flex-xs="100" flex-order-xs="1" class="bg-red tile tile-left color-white border-xs-bottom text-center"><img style="height:110px" src="./assets/images/cities.svg" alt="Community icon"><h3 class="color-white">CITIES AND GOVERNMENTS</h3><p class="color-white">Smart Cities should be built together with Smart Citizens. We provide the tools and knowledge to foster citizen engagement through participatory data collection, analysis and action.</p></div><div flex="60" flex-xs="100" flex-order-xs="0" class="img-governm tile tile-image border-xs-bottom"></div></div></section><section class="mt-50"><div layout="row" layout-xs="column" layout-align="space-around center" class="p-30 border-black bg-white"><div flex="45" flex-xs="100"><h2>CIVIC PARTICIPATION ACROSS THE GLOBE</h2></div><div flex="45" flex-xs="100"><p>The project uses open source technologies such as Arduino to enable ordinary citizens to gather information on their environment and make it available to the public on the Smart Citizen platform.</p></div></div><div layout="column" layout-align="end center" style="" class="img-platform tile tile-left tile-image"><a href="/kits/" class="btn-blue btn-round-new mb-30" analytics-on="click" analytics-category="Landing">GO TO THE PLATFORM</a></div></section><section class="mt-50"><form action="https://smartcitizen.us2.list-manage.com/subscribe/post?u=d67ba8deb34a23a222ec4eb8a&amp;id=d0fd9c9327" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate=""><div layout="row" layout-xs="column" layout-sm="column" layout-align="space-between center" layout-align-xs="center center" class="border-black bg-blue" style="padding:30px 50px; min-height: 200px"><h3 class="color-white text-left my-20">SUBSCRIBE TO GET THE LATEST</h3><div layout="row" layout-xs="column" layout-align="space-between center"><input class="my-20 mr-30" style="background: #262626; color:#eee; padding: 9px; border:none; width:250px" type="email" name="EMAIL" placeholder="Your email address" required=""> <input style="border:none; padding:12px 50px" class="btn-yellow btn-round-new my-20" type="submit" name="subscribe" id="mc-embedded-subscribe" value="GO!" analytics-on="click" analytics-category="Landing" analytics-event="Subscribe to newsletter"><div id="mce-responses" class="clear"><div class="response" id="mce-error-response" style="display:none"></div><div class="response" id="mce-success-response" style="display:none"></div></div><div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_d67ba8deb34a23a222ec4eb8a_d5a8cea29f" tabindex="-1" value=""></div></div></div></form></section><section class="mt-50 text-center"><div layout="row" layout-xs="column" layout-sm="column" layout-align="space-between"><div flex="30" flex-xs="100" layout="column" layout-align="space-between center" class="bg-white border-black px-20 py-40 mb-10"><img style="height:80px" src="./assets/images/api.svg" alt="API icon"><h3>DEVELOPER<br>READY</h3><p>Use our powerful API to build amazing things using data.</p><a href="https://developer.smartcitizen.me/" class="btn-black-outline btn-round-new" analytics-on="click" analytics-category="Landing">USE THE API</a></div><div flex="30" flex-xs="100" layout="column" layout-align="space-between center" class="bg-white border-black px-20 py-40 mb-10"><img style="height:80px" src="./assets/images/github.svg" alt="Github icon"><h3>WE\u2019RE<br>OPEN SOURCE</h3><p>Fork and contribute to the project in Github.</p><a href="https://github.com/fablabbcn?utf8=\u2713&q=smartcitizen" class="btn-black-outline btn-round-new" analytics-on="click" analytics-category="Landing">VISIT REPOSITORY</a></div><div flex="30" flex-xs="100" layout="column" layout-align="space-between center" class="bg-white border-black px-20 py-40 mb-10"><img style="height:80px;" src="./assets/images/forum.svg" alt="Forum icon"><h3>JOIN THE<br>FORUM</h3><p>A place to share ideas with the community or find support.</p><p><a href="https://forum.smartcitizen.me" class="btn-black-outline btn-round-new" analytics-on="click" analytics-category="Landing">GET INVOLVED</a></p></div></div></section></div></div><footer ng-include="\'app/components/footer/footer.html\'" layout="row" layout-align="center center"></footer>');
$templateCache.put('app/components/landing/static.html','<section class="static_page" flex=""><div class="timeline" layout="row"><div class="content" layout="row" layout-align="start center" flex=""><h1>Title</h1></div></div><div class=""><div class="content"><h2>Heading 2</h2><h3>Heading 3</h3><h4>Heading 4</h4><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam a porta quam. Phasellus tincidunt facilisis blandit. Aenean tempor diam quis turpis vestibulum, ac semper turpis mollis. Sed ac ultricies est. Vivamus efficitur orci efficitur turpis commodo dignissim. Aliquam sagittis risus in semper ullamcorper. Sed enim diam, tempus eget lorem sit amet, luctus porta enim. Nam aliquam mollis massa quis euismod. In commodo laoreet mattis. Nunc auctor, massa ut sollicitudin imperdiet, mauris magna tristique metus, quis lobortis ex ex id augue. In hac habitasse platea dictumst. Sed sagittis iaculis eros non sollicitudin. Sed congue, urna ut aliquet ornare, nisi tellus euismod nisi, a ullamcorper augue arcu sit amet ante. Mauris condimentum ex ante, vitae accumsan sapien vulputate in. In tempor ligula ut scelerisque feugiat. Morbi quam nisi, blandit quis malesuada sit amet, gravida ut urna.</p><md-button class="md-primary md-raised">button</md-button><md-button class="md-primary">button</md-button></div></div><div class=""><div class="content"><h2>Heading 2</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam a porta quam. Phasellus tincidunt facilisis blandit. Aenean tempor diam quis turpis vestibulum, ac semper turpis mollis. Sed ac ultricies est. Vivamus efficitur orci efficitur turpis commodo dignissim. Aliquam sagittis risus in semper ullamcorper. Sed enim diam, tempus eget lorem sit amet, luctus porta enim. Nam aliquam mollis massa quis euismod. In commodo laoreet mattis. Nunc auctor, massa ut sollicitudin imperdiet, mauris magna tristique metus, quis lobortis ex ex id augue. In hac habitasse platea dictumst. Sed sagittis iaculis eros non sollicitudin. Sed congue, urna ut aliquet ornare, nisi tellus euismod nisi, a ullamcorper augue arcu sit amet ante. Mauris condimentum ex ante, vitae accumsan sapien vulputate in. In tempor ligula ut scelerisque feugiat. Morbi quam nisi, blandit quis malesuada sit amet, gravida ut urna.</p></div></div><div class=""><div class="content"><h2>Small section</h2><p>Single line comment.</p></div></div></section>');
$templateCache.put('app/components/layout/layout.html','<div class="navbar_container"><md-toolbar layout="row" layout-align="space-between center" class="stickNav" style="height:64px;"><a ui-sref="landing" class="logo_link"><md-icon md-svg-src="./assets/images/LogotipoSmartCitizen.svg" alt="Insert Drive Icon" class="logo_icon"></md-icon></a><section layout="row" class="nav_left" layout-align="space-around center"><md-button ng-show="vm.isShown" ui-sref="layout.home.kit({ id: \'\'})" class="md-flat padding14 map"><md-icon md-svg-src="./assets/images/map_icon.svg" class="nav_icon"></md-icon><span>Map</span></md-button><md-button ng-show="vm.isShown" href="" class="md-flat padding14 community" aria-label="" dropdown-menu="vm.dropdownOptionsCommunity" dropdown-model="vm.dropdownSelectedCommunity" dropdown-item-label="text" layout="row" layout-align="center center"><md-icon md-svg-src="./assets/images/community_icon.svg" class="nav_icon"></md-icon><span>Community</span></md-button></section><search hide="" show-gt-xs="" flex=""></search><section layout="row" class="nav_right" layout-align="{{vm.navRightLayout}}"><div ng-show="vm.isShown" store="" logged="vm.isLoggedin" class="md-flat get"></div><div ng-show="vm.isShown && !vm.isLoggedin" login="" class="navbar_login_button md-display-1"></div><div ng-show="vm.isShown && !vm.isLoggedin" signup="" class="navbar_signup_button md-display-1"></div><md-button ng-show="vm.isShown && vm.isLoggedin" class="md-flat navbar_avatar_button float-right" aria-label="" dropdown-menu="vm.dropdownOptions" dropdown-model="vm.dropdownSelected" dropdown-item-label="text"><img class="navbar_avatar_icon" ng-src="{{ vm.currentUser.avatar || \'./assets/images/avatar.svg\' }}"></md-button></section></md-toolbar></div><div ui-view=""></div><footer class="footer" ng-if="!vm.overlayLayout" ng-include="\'app/components/footer/footer.html\'" layout="row" layout-align="center center"></footer>');
$templateCache.put('app/components/login/login.html','<md-button class="md-flat padding14" ng-click="showLogin($event)" angular-on="click" angular-event="Login" angular-action="click">Log In</md-button>');
$templateCache.put('app/components/login/loginModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Log in</h2><span flex=""></span><md-button class="md-icon-button" ng-click="cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><md-progress-linear class="md-hue-3" ng-show="waitingFromServer" md-mode="indeterminate"></md-progress-linear><form novalidate="" ng-submit="answer(vm.user)" name="loginForm"><div class="md-dialog-content"><div layout="column"><h2>People looking for a better city</h2><p>You\'re part of them? Feel free to join us!</p></div><div layout="row" layout-sm="column"><md-input-container class="md-block"><label>Username</label> <input id="autofocus" type="text" name="username" ng-model="vm.user.username" focus-input="" ng-required="loginForm.$submitted"><div ng-messages="(loginForm.username.$touched && loginForm.username.$error)" role="alert"><div ng-message="required">Username is required</div><div ng-if="vm.errors">Username or password incorrect</div></div></md-input-container><md-input-container class="md-block"><label>Password</label> <input type="password" name="password" ng-model="vm.user.password" ng-required="loginForm.$submitted"><div ng-messages="(loginForm.$submitted || loginForm.password.$touched) && loginForm.password.$error" role="alert"><div ng-message="required">Password is required</div><div ng-if="vm.errors">Username or password incorrect</div></div></md-input-container></div><md-button class="message_below_link" ng-click="openSignup()" angular-on="click" angular-event="Login" angular-action="signup">New here?, Sign up</md-button><md-button class="message_below_link" ng-click="openPasswordRecovery()" angular-on="click" angular-event="Login" angular-action="password recover">Forgot your password?</md-button></div><div><md-button class="btn-blue btn-full" type="submit">LOG IN</md-button></div></form></md-dialog-content></md-dialog>');
$templateCache.put('app/components/map/map.html','<section class="map" change-map-height=""><leaflet center="vm.center" layers="vm.layers" markers="vm.markers" defaults="vm.defaults" event-broadcast="vm.events" width="100%" height="100%"></leaflet><div class="map_legend" layout="row" layout-align="start center" move-filters=""><div class="map_legend__filtersContainer" layout="column"><div class="map_legend__filtersRow" ng-click="vm.openFilterPopup()" flex="50"><div class="map_filter_button"><md-icon md-svg-src="./assets/images/filter_icon.svg"></md-icon></div><p class="filter_description">Filters</p></div><div class="map_legend__filtersRow" ng-click="vm.openTagPopup()" flex="50"><div class="map_filter_button"><p>#</p></div><p class="filter_description">Tags</p></div></div><div class="chips" layout="column"><div layout="row" class="chips_row"><span ng-repeat="filter in vm.selectedFilters" ng-if="!vm.checkAllFiltersSelected()" class="chip label">{{ filter }}<md-icon ng-click="vm.removeFilter(filter)" md-svg-src="./assets/images/close_icon_black.svg"></md-icon></span></div><div layout="row" class="chips_row" layout-wrap=""><span class="chip tag" ng-repeat="tag in vm.selectedTags">{{ tag }}<md-icon ng-click="vm.removeTag(tag)" md-svg-src="./assets/images/close_icon_black.svg"></md-icon></span></div></div></div><md-progress-linear ng-show="vm.kitLoading || !vm.readyForKit.map" class="md-hue-3 kit_spinner" md-mode="indeterminate"></md-progress-linear></section>');
$templateCache.put('app/components/map/mapFilterModal.html','<md-dialog class="filters"><md-toolbar><div class="md-toolbar-tools"><h2>Filters</h2><span flex=""></span><md-button class="md-icon-button" ng-click="vm.cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><div class="md-dialog-content max-width-500px"><p>Only show kits containing ALL these parameters.</p><md-content layout-padding=""><div ng-repeat="filter in vm.filters"><md-checkbox ng-model="vm.checks[filter]"><span style="padding: 3px 8px" class="filter">{{filter.toUpperCase()}}</span></md-checkbox></div></md-content></div><md-button class="md-warn btn-full" ng-click="vm.clear()">Clear filters</md-button><md-button class="btn-blue btn-full" ng-click="vm.answer()">Apply</md-button></md-dialog-content></md-dialog>');
$templateCache.put('app/components/map/mapTagModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Tags</h2><span flex=""></span><md-button class="md-icon-button" ng-click="vm.cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><div class="md-dialog-content max-width-500px min-height-80"><p>Kits sharing a #tag show their average data.</p><p class="hide-xs">Browse and select from the list to show the kits containing ALL these tags.</p><md-input-container md-no-float="" class="md-block"><input type="text" ng-model="tagSearch" placeholder="Search a tag"></md-input-container><md-content layout-padding="" style="height: calc(80vh - 450px);"><div ng-repeat="tag in vm.tags | filter:{name: tagSearch}"><md-checkbox ng-model="vm.checks[tag.name]"><span class="tag">{{tag.name}}</span></md-checkbox></div></md-content></div><md-button style="font-size:18px" class="md-warn btn-full" ng-click="vm.clear()">Clear selection</md-button><md-button class="btn-blue btn-full" ng-click="vm.answer()">Apply</md-button></md-dialog-content></md-dialog>');
$templateCache.put('app/components/myProfile/Kits.html','<div class="profile_content" layout="row"><div class="profile_sidebar"><p class="profile_sidebar_title">FILTER KITS BY</p><div class="profile_sidebar_options" layout="column"><md-button ng-click="vm.filterKits(\'all\')" class="profile_sidebar_button" analytics-on="click" analytics-event="Profile" analytics-action="kit filter">ALL</md-button><md-button ng-click="vm.filterKits(\'online\')" class="profile_sidebar_button" analytics-on="click" analytics-event="Profile" analytics-action="kit filter">ONLINE</md-button><md-button ng-click="vm.filterKits(\'offline\')" class="profile_sidebar_button" analytics-on="click" analytics-event="Profile" analytics-action="kit filter">OFFLINE</md-button></div></div><div class="profile_content_main" flex=""><div class="profile_content_main_top"><md-button class="btn-round btn-cyan" ng-click="vm.addNewKit()">ADD A NEW KIT</md-button><span class="myProfile_content_main_title">{{ vm.filteredKits.length || 0 }} kits filtering by {{ vm.kitStatus.toUpperCase() || \'ALL\' }}</span></div><kit-list actions="{remove: vm.removeKit}" kits="vm.filteredKits"></kit-list><div class="kitList kitList_primary kitList_borderBottom" ng-show="!vm.kits.length"><div class="kitList_container"><div class="kitList_noKits"><span>There are not kits yet</span></div></div></div></div></div>');
$templateCache.put('app/components/myProfile/Tools.html','<div class="profile_content" layout="row"><div class="profile_sidebar"><p class="profile_sidebar_title">FILTER TOOLS BY</p><div class="profile_sidebar_options" layout="column"><md-button ng-click="vm.filterTools(\'all\')" class="profile_sidebar_button">ALL</md-button><md-button ng-click="vm.filterTools(\'documentation\')" class="profile_sidebar_button">DOCUMENTATION</md-button><md-button ng-click="vm.filterTools(\'community\')" class="profile_sidebar_button">COMMUNITY</md-button><md-button ng-click="vm.filterTools(\'social\')" class="profile_sidebar_button">SOCIAL</md-button></div></div><div class="profile_content_main" flex=""><div class="profile_content_main_top"><span class="profile_content_main_title">{{ vm.filteredTools.length || 0 }} tools filtering by {{ vm.toolType.toUpperCase() || \'ALL\' }}</span></div><div class="profile_content_main_kits"><div ng-repeat="tool in (vm.filteredTools = (vm.tools | filter: { type: vm.toolType } ))" ng-class="{kitList_borderBottom: $last}"><md-button ng-href="{{tool.href}}" class="kitList kitList_primary" layout="column" layout-align="start start"><h4>{{ tool.title }}</h4><p class="md-subhead">{{ tool.description }}</p></md-button></div></div></div></div>');
$templateCache.put('app/components/myProfile/Users.html','<div class="profile_content" layout="row"><div class="profile_sidebar"><p class="profile_sidebar_title">EDIT YOUR PROFILE</p><p class="profile_sidebar_description">A complete profile helps us to bring to you a better experience. Please, take your time completing all fields.</p><md-button ng-href="mailto:support@smartcitizen.me" class="profile_sidebar_button myProfile_sidebar_button"><md-icon md-svg-src="./assets/images/support_icon_blue.svg" class="profile_sidebar_avatar"></md-icon><span>Support</span></md-button><md-button ng-href="http://forum.smartcitizen.me" ng-click="" class="profile_sidebar_button myProfile_sidebar_button"><md-icon md-svg-src="./assets/images/community_icon_blue.svg" class="profile_sidebar_avatar"></md-icon><span>Community</span></md-button></div><div class="profile_content_main" flex=""><div class="myProfile_content_form"><div class="myProfile_form_avatar" layout="row" layout-align="start center"><img ng-src="{{ vm.user.avatar || \'./assets/images/avatar.svg\' }}" class="myProfile_form_avatarImage"><md-button class="myProfile_form_avatarButton" ngf-select="" ngf-change="vm.uploadAvatar($files)">CHANGE AVATAR</md-button></div><form ng-submit="vm.updateUser(vm.formUser)"><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container flex=""><label>Username</label> <input type="text" ng-model="vm.formUser.username"></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.username.length"><span ng-repeat="error in vm.errors.username">Username {{ error }}<span ng-if="!$last">,</span></span></p></div><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container flex=""><label>Password</label> <input type="password" ng-model="vm.formUser.password"></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.password.length"><span ng-repeat="error in vm.errors.password">Password {{ error }}<span ng-if="!$last">,</span></span></p></div><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container flex=""><label>Email</label> <input type="email" ng-model="vm.formUser.email"></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.email.length"><span ng-repeat="error in vm.errors.email">Email {{ error }}<span ng-if="!$last">,</span></span></p></div><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container flex=""><label>City</label> <input type="text" ng-model="vm.formUser.city"></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.city.length"><span ng-repeat="error in vm.errors.city">City {{ error }}<span ng-if="!$last">,</span></span></p></div><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container class="countryInput_container" flex=""><label>Country</label><md-autocomplete md-search-text="vm.searchText" md-items="item in vm.getCountries(vm.searchText)" md-item-text="item" md-selected-item="vm.formUser.country"><span>{{ item }}</span></md-autocomplete></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.country.length"><span ng-repeat="error in vm.errors.country">Country {{ error }}<span ng-if="!$last">,</span></span></p></div><div layout="" layout-sm="column" class="field myProfile_content_form_input"><md-input-container flex=""><label>Website</label> <input type="url" ng-model="vm.formUser.url"></md-input-container><p class="myProfile_updateForm_error" ng-show="!!vm.errors.url.length"><span ng-repeat="error in vm.errors.url">URL {{ error }}<span ng-if="!$last">,</span></span></p></div><md-button type="submit" class="myProfile_form_updateButton">UPDATE PROFILE</md-button></form><div class="myProfile_apiKey_block"><div class="myProfile_apiKey" layout="row" layout-align="start center"><md-icon flex="10" md-svg-src="./assets/images/key_icon.svg" class="myProfile_tab_icon"></md-icon><span flex="30" class="myProfile_apiKey_text">oAuth API Key:</span><div flex="60" api-key="vm.user.token"></div></div><small>Keep it safe as a password, never show it or release it publicly. The new API uses oAuth but doesn\'t require any Keys for basic queries. Soon you will be able to manage and renew Keys per application. Check the <a target="_blank" href="http://developer.smartcitizen.me/">documentation and have fun!</a></small></div><div class="myProfile_apiKey_block"><div class="myProfile_apiKey" layout="row" layout-align="start center"><md-icon flex="10" md-svg-src="./assets/images/key_icon.svg" class="myProfile_tab_icon"></md-icon><span flex="30" class="myProfile_apiKey_text">Legacy API Key:</span><div flex="60" api-key="vm.user.key"></div></div><small>This API Key is limited to the <a target="_blank" href="http://developer.smartcitizen.me/#legacy">legacy API</a>.</small></div><md-button ng-click="vm.removeUser()" class="warn" style="font-size:18px" type="button">DELETE ACCOUNT</md-button><br><small>Delete your profile will erase all your data. Please consider think twice before click this button.</small></div></div></div>');
$templateCache.put('app/components/myProfile/myProfile.html','<section class="myProfile_state" layout="column"><div class="profile_header myProfile_header dark"><div class="myProfile_header_container" layout="row"><img ng-src="{{ vm.user.avatar || \'./assets/images/avatar.svg\' }}" class="profile_header_avatar myProfile_header_avatar"><div class="profile_header_content"><h2 class="profile_header_name">{{ vm.user.username || \'No data\' }}</h2><div class="profile_header_location"><md-icon md-svg-src="./assets/images/location_icon_light.svg" class="profile_header_content_avatar"></md-icon><span class="md-title" ng-if="vm.user.city">{{ vm.user.city }}</span> <span class="md-title" ng-if="vm.user.city && vm.user.country">,</span> <span class="md-title" ng-if="vm.user.country">{{ vm.user.country }}</span> <span class="md-title" ng-if="!vm.user.city && !vm.user.country">No data</span></div><div class="profile_header_url"><md-icon md-svg-src="./assets/images/url_icon_light.svg" class="profile_header_content_avatar"></md-icon><a class="md-title" ng-href="{{ vm.user.url || \'http://example.com\' }}">{{ vm.user.url || \'No website\' }}</a></div></div></div></div><div class="myProfile_tabs_parent" flex=""><md-tabs md-dynamic-height="" class="myProfile_tabs" md-center-tabs="false" md-selected="vm.startingTab"><md-tab label="" md-on-select="vm.selectThisTab(0, \'kits\')" analytics-on="click" analytics-event="Profile" analytics-action="kits"><md-tab-label><md-icon md-svg-src="./assets/images/kit_details_icon_light.svg" class="myProfile_tab_icon"></md-icon><span class="color-white">KITS</span></md-tab-label><md-tab-body><ui-view></ui-view></md-tab-body></md-tab><md-tab label="" md-on-select="vm.selectThisTab(1, \'user\')" analytics-on="click" analytics-event="Profile" analytics-action="profile"><md-tab-label><md-icon md-svg-src="./assets/images/user_details_icon.svg" class="myProfile_tab_icon"></md-icon><span class="color-white">USER</span></md-tab-label><md-tab-body><ui-view></ui-view></md-tab-body></md-tab><md-tab label="" md-on-select="vm.selectThisTab(2, \'tools\')" analytics-on="click" analytics-event="Profile" analytics-action="tools"><md-tab-label><md-icon md-svg-src="./assets/images/support_icon_white.svg" class="myProfile_tab_icon"></md-icon><span class="color-white">TOOLS</span></md-tab-label><md-tab-body><ui-view></ui-view></md-tab-body></md-tab></md-tabs></div></section>');
$templateCache.put('app/components/passwordRecovery/passwordRecovery.html','<form name="recovery_form" ng-submit="vm.recoverPassword()" novalidate="" class="form_container recovery_container"><div class="form_contentContainer"><h2 class="form_title">FORGOT YOUR PASSWORD?</h2><div class="form_messageContainer"><p class="form_messageHeader">People looking for a better city</p><p class="form_messageSubheader">You\'re part of them? Feel free to join us!</p><p class="form_messageDescription">Please insert your email address and you will receive an email in your inbox. If you do not receive an email from our team in 10 minutes approx., please check your spam folder.</p></div><div layout="" layout-sm="column" class="formRecovery_field"><md-input-container flex=""><label>Username</label> <input type="text" name="username" ng-model="vm.username" autofocus="" ng-required="recovery_form.$submitted"></md-input-container><p class="form_errors formRecovery_errors" ng-show="vm.errors"><span ng-show="recovery_form.username.$error.required">Valid Username or Email is required</span></p></div></div><md-progress-circular ng-show="vm.waitingFromServer" class="md-hue-3 login_spinner" md-mode="indeterminate"></md-progress-circular><md-button type="submit" class="md-flat md-primary form_button">REQUEST NEW PASSWORD</md-button></form><header style="margin-top:120px" class="footer" ng-include="\'app/components/footer/footer.html\'" layout="row" layout-align="center center"></header>');
$templateCache.put('app/components/passwordRecovery/passwordRecoveryModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Forgot your password?</h2><span flex=""></span><md-button class="md-icon-button" ng-click="cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><md-progress-linear ng-show="waitingFromServer" class="md-hue-3" md-mode="indeterminate"></md-progress-linear><form name="recoveryForm" novalidate="" ng-submit="recoverPassword()"><div class="md-dialog-content max-width-500px"><p>Please insert your email address and you will receive an email in your inbox. If you do not receive an email from our team in 10 minutes approx., please check your spam folder.</p><div layout="" layout-sm="column"><md-input-container flex=""><label>Username or Email</label> <input type="text" name="input" ng-model="input" focus-input="" required=""><div ng-messages="recoveryForm.input.$error"><div ng-message="required">Valid Username or Email is required</div></div></md-input-container></div><md-button ng-click="openSignup()">New here? Sign up</md-button></div><md-button class="btn-blue btn-full" type="submit">REQUEST NEW PASSWORD</md-button></form></md-dialog-content></md-dialog>');
$templateCache.put('app/components/passwordReset/passwordReset.html','<form name="form" novalidate="" ng-submit="vm.answer(vm.form)" class="form_container recovery_container"><div class="form_contentContainer"><h2 class="form_title">ENTER YOUR NEW PASSWORD</h2><div class="form_messageContainer"><p class="form_messageHeader">People looking for a better city</p><p class="form_messageSubheader">You\'re part of them? Feel free to join us!</p></div><div layout="" layout-sm="column" class="formReset_field"><md-input-container flex=""><label>New Password</label> <input type="password" name="newPassword" ng-model="vm.form.newPassword" autofocus="" ng-required="form.$submitted"></md-input-container><p class="form_errors formReset_errors" ng-show="form.$submitted || form.newPassword.$touched"><span ng-show="form.newPassword.$error.required">Password is required</span></p></div><div layout="" layout-sm="column" class="formReset_field"><md-input-container flex=""><label>Confirm Password</label> <input type="password" name="password" ng-model="vm.form.confirmPassword" ng-required="form.$submitted"></md-input-container><p class="form_errors formReset_errors" ng-show="form.$submitted || form.password.$touched"><span ng-show="form.password.$error.required">Password is required</span> <span ng-show="vm.isDifferent && !form.password.$error.required && !vm.errors.password.length">It must be the same password</span> <span ng-show="!!vm.errors.password.length"><span ng-repeat="error in vm.errors.password">Password {{ error }}<span ng-if="!$last">,</span></span></span></p></div></div><md-button class="md-flat md-primary form_button" type="submit">RESET PASSWORD</md-button></form><footer class="footer" ng-include="\'app/components/footer/footer.html\'" layout="row" layout-align="center center"></footer>');
$templateCache.put('app/components/search/search.html','<md-autocomplete id="search" md-selected-item="vm.selectedItem" md-selected-item-change="vm.selectedItemChange(item)" md-search-text="vm.searchText" md-search-text-change="vm.searchTextChange(vm.searchText)" md-items="item in vm.querySearch(vm.searchText)" md-item-text="item.name" placeholder="Search" md-delay="300" md-min-length="3"><md-item-template layout="row" layout-align="start center"><div class="search_results"><img ng-if="item.iconType === \'img\'" ng-src="{{ item.icon }}" class="result_icon"><div ng-if="item.iconType === \'div\'" class="markerSmartCitizenOnline result_icon"></div><span ng-class="{\'result_name\': item.name.length > 0}">{{ item.name }}</span> <span class="result_location">{{ item.location }}</span></div></md-item-template></md-autocomplete>');
$templateCache.put('app/components/signup/signup.html','<md-button class="md-icon-button" ng-click="vm.showSignup($event)" analytics-on="click" analytics-event="Signup" analytics-action="click">Sign Up</md-button>');
$templateCache.put('app/components/signup/signupModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Sign up</h2><span flex=""></span><md-button class="md-icon-button" ng-click="cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-progress-linear ng-show="waitingFromServer" class="md-hue-3" md-mode="indeterminate"></md-progress-linear><md-dialog-content class="modal signup"><form name="signupForm" novalidate="" ng-submit="vm.answer(signupForm)"><div class="md-dialog-content"><div layout="column"><h2 class="header">People looking for a better city</h2><p class="subheader">You\'re part of them? Feel free to join us!</p></div><div layout="column"><md-input-container><label>Username</label> <input type="text" name="username" ng-model="vm.user.username" focus-input="" required=""><div ng-messages="signupForm.username.$error || !!errors.password.length" role="alert"><div ng-message="required">Username is required</div><div ng-repeat="error in errors.username"><div>Username {{ error }}<span ng-if="!$last">,</span></div></div></div></md-input-container><md-input-container flex=""><label>Password</label> <input name="password" type="password" ng-model="vm.user.password" required=""><div ng-messages="signupForm.password.$error || !!errors.password.length" role="alert"><div ng-message="required">Password is required</div><div ng-repeat="error in errors.password"><div>Password {{ error }}<span ng-if="!$last">,</span></div></div></div></md-input-container><md-input-container><label>Email</label> <input name="email" type="email" ng-model="vm.user.email" required=""><div ng-messages="signupForm.email.$error || !!errors.email.length" role="alert"><div ng-message="required">Email is required</div><div ng-repeat="error in errors.email" ng-if="!!errors.email.length"><div>Email {{ error }}<span ng-if="!$last">,</span></div></div></div></md-input-container><md-input-container><md-checkbox name="conditions" ng-model="vm.user.conditions" aria-label="Terms and Conditions" required="">I <a ui-sref="layout.policy" ng-click="hide()">have read</a> and accept Terms and Conditions</md-checkbox><div ng-messages="signupForm.conditions.$error || !!errors.conditions.length" role="alert"><div ng-message="required">You have to accept Terms and Conditions first</div><div ng-repeat="error in errors.conditions"><div>{{ error }}<span ng-if="!$last">,</span></div></div></div></md-input-container></div><md-button class="message_below_link" ng-click="openLogin()" analytics-on="click" analytics-event="Signup" analytics-action="login">Already have an account? Log in</md-button></div><md-button class="btn-blue btn-full" type="submit">Sign up</md-button></form></md-dialog-content></md-dialog>');
$templateCache.put('app/components/static/404.html','<section class="landing-page" flex=""><div id="content-land"><div class="block photo kit-0" data-stellar-background-ratio="0.01"><div class="container" style="height:inherit"><div class=""><div class="" style="vertical-align:middle;"><div class="lead-13" style="margin-top: 85px;"><span>404 <sup style="font-size: 18px;">Not Found</sup></span></div><div class="lead-14" style="margin-top: 20px;">The current resource could not be found on Smart Citizen</div><div style="margin-top: 30px;"><md-button ng-href="/kits/" class="landing_highlight_button normal">Go to the platform</md-button></div></div></div></div><div class="bullet-landing plus grey"></div></div><div class="block photo autoheight datavis"><div class="container"><div class=""><div class="" style="text-align:center; vertical-align:middle; margin-top:95px;"><div class="lead-2">Realtime ambiental monitoring for data analysis</div><div class="lead-1">Connecting people, data and knowledge</div></div></div><div class=""><div class=""><div style="text-align:center; margin:50px 0 80px 0;"></div></div></div></div></div></div></section>');
$templateCache.put('app/components/static/about.html','<section class="static_page" flex=""><div class="timeline" layout="row"><div class="content" layout="row" layout-align="start center" flex=""><h1>About</h1></div></div><div class=""><div class="content"><h2 id="who">Who</h2><p>The project is born within <a href="http://fablabbcn.org" class="about">Fab Lab Barcelona</a> at the <a href="http://www.iaac.net" class="about">Institute for Advanced Architecture of Catalonia</a>, both focused centers on the impact of new technologies at different scales of human habitat, from the bits to geography.</p><div layout="row" layout-align="space-between center"><a href="http://www.fablabbcn.org/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/fablab-bcn.jpg"></md-card></a> <a href="http://www.iaac.net/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/iaac.jpg"></md-card></a> <a href="http://mediainteractivedesign.com/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/mid.jpg"></md-card></a> <a href="#" flex="22"></a></div><div class="subtitle-separation"><h3>Collaborators</h3><div layout="row" layout-align="space-between center"><a href="http://www.hangar.org" flex="22"><md-card><img src="../../../assets/images/who-section-logos/hangar.jpg"></md-card></a> <a href="http://goteo.org/project/smart-citizen-sensores-ciudadanos" flex="22"><md-card><img src="../../../assets/images/who-section-logos/goteo.jpg"></md-card></a> <a href="http://lafosca.cat" flex="22"><md-card><img src="../../../assets/images/who-section-logos/lafosca.jpg"></md-card></a> <a href="http://www.facebook.com/manifiestodesign" flex="22"><md-card><img src="../../../assets/images/who-section-logos/manifesto.jpg"></md-card></a></div></div><div class="subtitle-separation"><h3>Partners</h3><div layout="row" layout-align="space-between center"><a href="http://amsterdamsmartcity.com/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/amsterdam-smart-city.jpg"></md-card></a> <a href="https://www.waag.org/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/waag-society.jpg"></md-card></a> <a href="http://futureeverything.org/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/future-everything.jpg"></md-card></a> <a href="http://cisco.com/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/cisco.jpg"></md-card></a></div><div layout="row" layout-align="space-between center"><a href="http://intel.com/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/intel.jpg"></md-card></a> <a href="http://www.bcn.cat/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/aj-barcelona.jpg"></md-card></a> <a href="http://barcelonacultura.bcn.cat/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/barcelona-cultura.jpg"></md-card></a> <a href="https://arrayofthings.github.io/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/array-things.jpg"></md-card></a></div><div layout="row" layout-align="space-between center"><a href="http://organicity.eu/" flex="22"><md-card><img src="../../../assets/images/who-section-logos/organicity.jpg"></md-card></a> <a href="#" flex="22"></a> <a href="#" flex="22"></a> <a href="#" flex="22"></a></div></div><div class="subtitle-separation"><h3>Crowdfunding</h3><p>This project gets funding thanks to lovely backers on:</p><div flex="100"><h3>Kickstarter 2013</h3></div><div layout="row" layout-xs="column" layout-align="center center"><div flex-xs="100" flex="60" style="padding:20px;"><iframe width="100%" height="240px" src="https://www.kickstarter.com/projects/acrobotic/the-smart-citizen-kit-crowdsourced-environmental-m/widget/video.html" frameborder="0"></iframe></div><div flex-xs="100" flex="30"><iframe frameborder="0" height="430" src="https://www.kickstarter.com/projects/acrobotic/the-smart-citizen-kit-crowdsourced-environmental-m/widget/card.html" width="220"></iframe></div></div><div class="expandable sensor-image-margin"><div class="expandBT"><h3>Goteo 2012</h3></div><div class="expand-panel goteo"><p>You can find more information at <a href="http://goteo.org/project/smart-citizen-sensores-ciudadanos/" class="about">Goteo</a></p><table cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;"><tbody><tr><td width="30%">Garcia</td><td width="30%">Abraham Cembrero Z\xFA\xF1iga</td><td width="30%">Adria (rzcll)</td></tr><tr><td>Aitor Aloa del Teso</td><td>Albert homs</td><td>Alberto P\xE9rez Olaya</td></tr><tr><td>Alexandre Dubor</td><td>Alex Posada</td><td>Alfonso mendoza</td></tr><tr><td>Alvaros_g</td><td>Andr\xE9s Cerezo Guill\xE9n</td><td>\xC1ngel D. Berruezo</td></tr><tr><td>\xC1ngel Mu\xF1oz</td><td>Anna Kaziunas France</td><td>Antic Teatre</td></tr><tr><td>Anto Recio</td><td>Antonio Garc\xEDa Calder\xF3n</td><td>Araceli Corbo</td></tr><tr><td>Areti (IAAC)</td><td>Arnau Ayza</td><td>Arnau Cangr\xF2s i Alonso</td></tr><tr><td>Arturo Saez</td><td>Avenida Sofia Hotel & Spa Sitges</td><td>babisansone</td></tr><tr><td>BaM</td><td>Beatrice Th\xE8ves-Engelbach</td><td>Blance Duarte (blancaivette)</td></tr><tr><td>bzzzbip</td><td>Carlos Bock</td><td>Carlos Iglesias</td></tr><tr><td>castarco</td><td>champloo</td><td>Chema Casanova</td></tr><tr><td>Cliensol energy</td><td>ColaBoraBora</td><td>crisis2smart</td></tr><tr><td>Dani D\xEDaz</td><td>Daniel</td><td>Daniel N\xFCst</td></tr><tr><td>Daniel Saavedra</td><td>Daviba</td><td>David LH</td></tr><tr><td>David Pe\xF1uela</td><td>David Scarlatti</td><td>Davide Gallino</td></tr><tr><td>diegobus</td><td>dpr-barcelona</td><td>dsanchezbote</td></tr><tr><td>dvd (dpa1973)</td><td>Ed Borden</td><td>Ed Mago</td></tr><tr><td>edward hollands</td><td>El Franc</td><td>Eloi Garrido</td></tr><tr><td>Eloi Maduell</td><td>Emil Lima</td><td>Emily Sato</td></tr><tr><td>enricostn</td><td>ernesto guillen fontalba</td><td>esenabre</td></tr><tr><td>Eusebio Reyero</td><td>Eva Saura</td><td>Fabien Girardin</td></tr><tr><td>Felix Dubor</td><td>F\xE9lix Pedrera Garc\xEDa</td><td>Franz Jimeno</td></tr><tr><td>Fred Adam</td><td>Felix Sainz</td><td>G!N</td></tr><tr><td>Gabo</td><td>Gerald Kogler y Marti Sanchez</td><td>Gil Obradors</td></tr><tr><td>hHenri Aboulker</td><td>hexxan labs</td><td>pfaffsandy</td></tr><tr><td>Iker Jimenez</td><td>ilitch</td><td>Inigo Barrera</td></tr><tr><td>Javier A. Rodr\xEDguez</td><td>Javier Montaner</td><td>Javier S\xE1nchez</td></tr><tr><td>Jean-Baptiste HEREN</td><td>jnogueras</td><td>Joan Vall\xE9s</td></tr><tr><td>Jordi Ferran</td><td>Jorge Daniel Czajkowski</td><td>Jorge Sanz</td></tr><tr><td>Jos\xE9 Costoya</td><td>Jos\xE9 (politema)</td><td>Jose M Arbones Mainar</td></tr><tr><td>Jose Manuel</td><td>Josep Perell\xF3</td><td>josianito</td></tr><tr><td>Juan Saura Ram\xEDrez</td><td>Juanjo Frechilla</td><td>J\xFAlia L\xF3pez i Ventura</td></tr><tr><td>Juli\xE1n C\xE1naves</td><td>Kincubator</td><td>laia s\xE1nchez</td></tr><tr><td>LauraFdez</td><td>Lucas Cappelli</td><td>Luis (Fraguada)</td></tr><tr><td>Mara Balestrini</td><td>Marc (Pous)</td><td>Marc Garriga</td></tr><tr><td>marcabra (Bravalero(</td><td>Maria Mu\xF1oz</td><td>Marianella (Coronell)</td></tr><tr><td>marioarienza</td><td>Marita Bom</td><td>Marte Roel</td></tr><tr><td>mborobio</td><td>memojoelojo</td><td>Miguel Senabre</td></tr><tr><td>Miquel Colomer</td><td>miska (Goteo)</td><td>Mois\xE9s Fern\xE1ndez</td></tr><tr><td>monica donati</td><td>nadya</td><td>Natassa Pistofidou</td></tr><tr><td>Norella Coronell</td><td>Nuriona</td><td>Olivier (schulbaum)</td></tr><tr><td>Oriol Ferrer Mesi\xE0</td><td>Pablo Rey Trist\xE1n</td><td>Parque Cient\xEDfico y Tecnol\xF3gico de Bizkaia</td></tr><tr><td>Pilar Conesa</td><td>pang</td><td>Raf</td></tr><tr><td>Paula Baptista</td><td>Pere Casas Puig</td><td>Rocio Holzer</td></tr><tr><td>Ra\xFAl Micharet</td><td>Solo01</td><td>Rob Aalders</td></tr><tr><td>viriatov</td><td>Roberto (Madman)</td><td>Santiago Vilanova</td></tr><tr><td>Salvador Ejarque</td><td>pmisson</td><td>Sergi Mart\xEDnez</td></tr><tr><td>Sim\xF3n Lee</td><td>SirViente</td><td>SMD Arq (Oriol)</td></tr><tr><td>Vicen\xE7 Sampera</td><td>VideoDossier</td><td>Henri Boulker</td></tr><tr><td>tiefpunkt (Severin)</td><td>xa2 (Diaz)</td><td>Xavi Polo</td></tr><tr><td>Xixo</td><td>Zeca (Fernandez)</td><td></td></tr></tbody></table></div></div></div><div layout="column" class="subtitle-separation"><h2>Team</h2><div class="team-cells-margin"><h4 class="no-margin">Tomas Diez</h4><p class="no-margin">Co-founder, strategic planning</p></div><div class="team-cells-margin"><h4 class="no-margin">Alex Posada</h4><p class="no-margin">Co-founder, project hardware design and development</p></div><div class="team-cells-margin"><h4 class="no-margin">Guillem Camprodon</h4><p class="no-margin">Project management and development</p></div><div class="team-cells-margin"><h4 class="no-margin">M.A. Heras</h4><p class="no-margin">Hardware design and development</p></div><div class="team-cells-margin"><h4 class="no-margin">Aitor Aloa</h4><p class="no-margin">Customer support and logistics</p></div><div class="team-cells-margin"><h4 class="no-margin">John Rees</h4><p class="no-margin">Lead backend developer</p></div><div class="team-cells-margin"><h4 class="no-margin">Mara Balestrini</h4><p class="no-margin">Communities development and research</p></div><div class="team-cells-margin"><h4 class="no-margin">Enrique Perotti</h4><p class="no-margin">Industrial design</p></div><div class="team-cells-margin"><h4 class="no-margin">V\xEDctor Barber\xE1n</h4><p class="no-margin">Hardware design and development</p></div><div class="team-cells-margin"><h4 class="no-margin">Silvia Puglisi</h4><p class="no-margin">Front-end and backend developer</p></div></div><div class="subtitle-separation"><h2>Former team and collaborators</h2><p>We would like to thank the effort and contributions to the project of all the former team members and collaborators who helped the project since 2012.</p><div class="team-cells-margin"><h4 class="no-margin">Alexandre Dubor</h4><p class="no-margin">First platform design, programming and development</p></div><div class="team-cells-margin"><h4 class="no-margin">Leonardo Arrata</h4><p class="no-margin">Platform and mobile app design and development</p></div><div class="team-cells-margin"><h4 class="no-margin">Xavier Vinaixa</h4><p class="no-margin">Original platform API and mobile app development</p></div><div class="team-cells-margin"><h4 class="no-margin">Gabriel Bello-Diaz</h4><p class="no-margin">First platform design</p></div><div class="team-cells-margin"><h4 class="no-margin">Jorren Schauwaert</h4><p class="no-margin">Project management and communication</p></div><div class="team-cells-margin"><h4 class="no-margin">Alejandro Andreu</h4><p class="no-margin">Original project documentation and project revision</p></div><div class="team-cells-margin"><h4 class="no-margin">Rub\xE9n Vicario</h4><p class="no-margin">New web platform development</p></div><div class=""><h4 class="no-margin">M\xE1ximo Gavete</h4><p class="no-margin">New web platform platform design</p></div><div class="team-cells-margin"><h4 class="no-margin">\xC1ngel Mu\xF1oz</h4><p class="no-margin">Hardware research and development</p></div></div><div id="contact" class="subtitle-separation"><h2>Contact Us</h2><p>Please feel free to <a class="about" href="mailto:info@smartcitizen.me">contact us.</a> We will answer you as soon as possible!</p></div></div><img src="./assets/images/sck_front.jpg" class="full-width-img"></div></section>');
$templateCache.put('app/components/static/policy.html','<section class="static_page" flex=""><div class="timeline" layout="row"><div class="content" layout="row" layout-align="start center" flex=""><h1>Privacy policy</h1></div></div><div class=""><div class="content"><h2 id="terms-of-use" name="terms-of-use">Terms of use</h2><p>By using the Platform you acknowledge, accept and agree these Terms of Use and the Privacy Policy available at <a href="#terms-of-use" class="about">Terms of use</a>.</p><p>By using the Platform you acknowledge, accept and agree these Terms of Use and the Privacy Policy available at <a href="#">Terms of use</a>(/pages/terms).</p><h3>1. Your relationship with Smart Citizen</h3><p>1. Please note that your use of Smart Citizen website www.smartcitizen.me/ and any possible software or tool provided to you for the access/registration to and/or the use of the website <b>(hereinafter the "Platform")</b> is subject to the terms of a legal agreement between you and FabLab Barcelona, Pujades 102, Barcelona - 08005 <b>(hereinafter "Smart Citizen")</b>.</p><p>2. The legal agreement between you and Smart Citizen governing the use of the Platform is made up of the terms and conditions set out in this document <b>(hereinafter the "Terms of Use")</b> and the Smart Citizen\'s privacy policy available at <a href="#policy" class="about">Privacy policy</a> <b>(hereinafter the "Privacy Policy")</b> (collectively called the "Terms").</p><p>3. The Terms form a legally binding agreement between you and Smart Citizen in relation to your use of the Platform. It is important that you take the time to read them carefully.</p><p>4. The Terms apply to all users of the Platform, including those who are also contributing to it by uploading on the Platform data captured thought the Smart Citizen Kit <b>(hereinafter the "SCK")</b>. It is possible to purchase a SCK at the following <a ng-click="vm.showStore()" class="about" analytics-on="click" analytics-event="Kit Purchase" analytics-action="view">link</a> and this purchase is entirely regulated by the Terms and Conditions of Purchase available at the following <a href="#terms-of-use" class="about">link</a>.</p><h3>2. Accepting the Terms</h3><p>1. The Terms constitute a contract between you and Smart Citizen. If you do not agree to these Terms, you do not have the right to access or use the Platform.</p><p>2. If you do use the Platform, your use shall be deemed to confirm your acceptance of the Terms and your agreement to be a party to this binding contract.</p><p>3. You should print off or save a copy of the Terms for your records.</p><h3>3. Changes to the Terms</h3><p>1. Smart Citizen reserves the right to make changes the Terms from time to time, for example to address changes to the law or regulatory changes or changes to functionality offered through the Platform.</p><p>2. If such changes occur, Smart Citizen will do its best to provide you with advance notice, although in some situations, such as where a change is required to satisfy applicable legal requirements, an update to these Terms may need to be effective immediately. Smart Citizen will announce changes directly on the Platform and it also may elect to notify you of changes by sending an email to the address you have provided to it. In any case, the revised version of Terms of Use will be always accessible at <a href="#terms-of-use" class="about">Terms of use</a> and the revised version of the Privacy Policy will be accessible at <a href="#policy" class="about">Privacy policy</a>.</p><p>3. If Smart Citizen does update the Terms, you are free to decide whether to accept the revised terms or to stop using the Platform. Your continued use of the Platform after the date the revised Terms are posted will constitute your acceptance of these new Terms.</p><p>4. You understand and agree that You are solely responsible for periodically reviewing the Terms.</p><p>5. Except for changes made by Smart Citizen as described above, no other amendment or modification of these Terms shall be effective unless set forth in a written agreement bearing a written signature by you and Smart Citizen. For clarity, email or other communications will not constitute an effective written agreement for this purpose.</p><h3>4. Smart Citizen Platform Description</h3><p>1. The Smart Citizen Platform is born as part of a project within Fab Lab Barcelona (<a href="http://fablabbcn.org" class="about">fablabbcn.org</a>) at the Institute for Advanced Architecture of Catalonia (<a href="http://iaac.net" class="about">iaac.net</a>), developed in collaboration with Hangar (<a href="http://hangar.org" class="about">hangar.org</a>), focused on the impact of new technologies at different scales of human habitat, from the bits to geography.</p><p>2. Smart Citizen project is based on geolocation, Internet and free hardware and software for data collection and sharing. It aims at generating participatory processes of people in the cities. Connecting data, people and knowledge, the objective of the project is to serve as a node for building productive and open indicators and thereafter the collective construction of the city for its own inhabitants.</p><p>3. Anyone can order a Smart Citizen Kit at the following <a ng-click="vm.showStore()" class="about">link</a>. The SCK is an open source electronic sensor board equipped with air quality, temperature, sound, humidity and light quantity sensors, containing a solar charger and equipped with a WiFi antenna that allows to upload data from the sensors in real time to the Platform and make it available to the community.</p><p>4. In order to share data captured with the SCK and/or access to other user\'s data on the Platform, it is necessary to register and create a Smart Citizen account.</p><h3>5. Creating a Smart Citizen account</h3><p>1. In order to use the Platform, you need to create a Smart Citizen account. You create an account by providing Smart Citizen with username and email address and creating a password <b>(hereinafter "Account Information\u201D)</b>.</p><p>2. You are the only responsible for maintaining the accuracy, completeness and confidentiality of your Account Information, and you will be responsible for all activities that occur under your account, including activities of others to whom you have provided your Account Information. Smart Citizen is not be liable for any loss or damage arising from your failure to provide accurate information or to keep your Account Information secure. If you discover any unauthorized use of your Account Information or suspect that anyone may be able to access your private Content, you should immediately change your password and notify the Customer Support team at the following address <a href="mailto:info@smartcitizen.me" class="about">link</a>.</p><h3>6. Using the Platform and uploading Content</h3><p>1. Your use of the Platform shall be in accordance with these Terms. You agree that you are the only responsible for your own conduct and all conduct under your account.</p><p>2. Once your account is created and you accept these Terms, we grant you a limited, non-exclusive license to use the Platform subject to these Terms, for so long as you are not barred from using the Platform under the laws applicable to you, until you voluntarily close your account or until we close your account pursuant to these Terms. You do not obtain any other right or interest in the Platform.</p><p>3. Anyone can order a Smart Citizen Kit at the following <a ng-click="vm.showStore()" class="about">link</a>. The SCK is an open source electronic sensor board equipped with air quality, temperature, sound, humidity and light quantity sensors, containing a solar charger and equipped with a WiFi antenna that allows to upload data from the sensors in real time to the Platform and make it available to the community.</p><p>4. In order to share data captured with the SCK and/or access to other user\'s data on the Platform, it is necessary to register and create a Smart Citizen account.</p><p>5. You agree that you are the sole responsible as the person who created the Content or introduced it into the Platform. This applies whether the Content is kept private, shared or transmitted using the Platform or any third party application or services integrated with the Platform.</p><p>6. Smart Citizen is not liable for the Content or accuracy of any information, and shall not be responsible for any acts taken or decisions made based on such information.</p><p>7. Smart Citizen does not select or screen Content, and does not review, test, confirm, approve or verify any user data or Content or the accuracy of it. Smart Citizen access to/storing of/use of Content does not imply or create any liability on the part of it. However, Smart Citizen reserves in some circumstances the right to edit, limit or remove any such Content in its sole discretion and will not be responsible for any Content deleted or for your inability to submit any Content.</p><h3>7. Restricted use of the Platform</h3><p>1. You agree not to use the Platform for any illegal purpose nor to post, distribute, or otherwise make available or transmit any data, software or other computer files that (i) contain a virus, trojan horse, worm or other harmful or destructive component, (ii) infringe third parties\' rights (intellectual property rights and personality rights).</p><p>2. You agree not to alter or modify any part of the Platform and its related technologies nor to (or attempt to) circumvent, disable or otherwise interfere with any security related features of the Platform.</p><p>3. You agree not to distribute any part of or parts of the Platform, including but not limited to any Content, in any medium without Smart Citizen\'s prior written authorisation, unless Smart Citizen makes available the means for such distribution through functionality offered by the Platform. You also agree not to access Content through any technology or means other than those Smart Citizen may explicitly designate for this purpose.</p><p>4. You agree not to massively collect or harvest or use Content or any other data available thought the platform (including users\' data such as account names), unless you agree on keeping all generated analysis data sets open and available on the Platform.</p><p>5. You agree not to use the Platform or any data available through the platform for commercial use unless you obtain Smart Citizen\'s prior written approval nor to solicit, for such commercial purposes, any users of the Platform with respect to their Content;</p><p>6. You agree that you are solely responsible for (and that Smart Citizen has no responsibility to you or to any third party for) any breach of your obligations under the Terms and for the consequences of any such breach.</p><h3>8. Content rights and licenses</h3><p>1. You retain copyright and any other rights you already held in your Content before you submitted, posted or displayed it on or through the Platform. Other than the limited license and other rights you grant in these Terms, Smart Citizen acknowledges and agrees that it do not obtain any right, title or interest from you under these Terms in any of your Content.</p><p>2. By using the Platform and uploading you grant Smart Citizen a limited license in order to make your data accessible and usable on the Platform. Thus, you grant Smart Citizen a license to display, execute, and distribute any of your Content and to modify for technical purposes and reproduce such Content to enable Smart Citizen to operate the Platform. You also agree that Smart Citizen has the right to elect not to accept, post, execute, store, display, publish or transmit any Content. You agree that these rights and licenses are royalty free, irrevocable and worldwide (for so long as your Content is accessible on the Platform), and include a right for Smart Citizen to make such Content available to, and pass these rights along to, others with whom this latter has contractual relationships related to the provision of the Platform, solely for the purpose of providing Platform\'s services, and to otherwise permit access to or disclose your Content to third parties if it determines such access is necessary to comply with its legal obligations.</p><p>3. Except as described in these Terms of Use, unless you elect to enable others to view or have access to the Content you submit to the Platform, no one else should see your Content without your consent. Of course, if you do elect to publish or share any portion of your Content by creating a feed of information, or creating a webservice to publish Content, then you would be enabling each of those permitted users to access, use, display, perform, distribute and modify your Content. In addition, Smart Citizen enables you to use a variety of third party services and applications that interact with the Platform and your Content, and you should review the access rights you provide to those services or applications, as you may enable them to access your Content through your agreements with those parties.</p><p>4. You also represent and warranty that, by submitting Content to the Platform and granting Smart Citizen the rights described in these Terms, you are not infringing the rights of any person or third party.</p><h3>9. Changes to the Platform</h3><p>1. We retain the right, in our sole discretion, to implement new elements as part of and/or ancillary to the Platform, including changes that may affect its previous mode of operation.</p><p>2. We also reserve the right to establish limits to the nature or size of storage available to you, the number of transmissions and email messages, execution of you program code, your Content and other data, and impose other limitations at any time, with or without notice.</p><p>3. You agree that Smart Citizen has no responsibility or liability as a result of, without limitation, the deletion of, or failure to make available to you, any Content. You agree that we shall not be liable to you or to any third party for any modification, suspension or discontinuance of any part of the Platform.</p><h3>10. Termination</h3><p>1. You may close your Platform account at any time, for any reason (or no reason), and you do not even have to give us notice.</p><p>2. Smart Citizen may suspend access to your account, or close your account according to these Terms. Reasons for Smart Citizen suspending or closing your account may include, without limitation: (i) breach or violation of these Terms or any other agreement between you and Smart Citizen and related to the use of the Platform, (ii) the discontinuance or material modification of the Platform (or any part thereof) or (iii) unexpected technical or security issues or problems. In most cases, in the event we elect to close your account, we will provide at least 30 days advance notice to you at the email address you have provided at the creation of the account. After the expiration of this notice period, you will no longer be able to retrieve Content contained in that account or otherwise use the Platform through that account.</p><p>3. Smart Citizen shall not be liable to you or any third party for termination of the Platform.</p><p>4. All disclaimers, limitations of warranties and damages, and confidential commitments set forth in these Terms of Use or otherwise existing at law survive any termination, expiration of these Terms of Use.</p><h3>11. Third-Party Links, applications or APIs</h3><p>1. We may include or recommend third party resources, materials and developers and/or links to third party websites and applications as part of, or in connection with, the Platform. We have no control over such sites or developers and, accordingly, you acknowledge and agree that (i) we are not responsible for the availability of such external sites or applications; (ii) we are not responsible or liable for any content or other materials or performance available from such sites or applications and (iii) we shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, materials or applications.</p><h3>12. Indemnity</h3><p>1. You agree to indemnify and hold Smart Citizen, its subsidiaries, affiliates, officers, agents, employees, advertisers and partners harmless from and against any and all claims, liabilities, damages (actual and consequential), losses and expenses (including legal and other professional fees) arising from or in any way related to any third party claims relating to your use of any of the Platform, any violation of these Terms of Use or any other actions connected with your use of the Platform (including all actions taken under your account). In the event of such claim, we will provide notice of the claim, suit or action to the contact information we have for the account, provided that any failure to deliver such notice to you shall not eliminate or reduce your indemnification obligation hereunder.</p><h3>13. High Risk Activities</h3><p>1. Smart Citizen Platform are not fault-tolerant and are not designed, manufactured or intended for use as or with on-line control equipment in hazardous environments requiring fail-safe performance, such as in the operation of nuclear facilities, aircraft navigation or communication systems, air traffic control, direct life support machines or weapon systems in which the failure of the Platforms could lead directly to death, personal injury or severe physical or environmental damage ("High Risk Activities"). Accordingly, Smart Citizen and its suppliers specifically disclaim any express or implied warranty of fitness for High Risk Activities.</p><h3>14. The Platform is Available \u201CAs Is.\u201D</h3><p>1. The Platform is Available \u201CAs Is.\u201D YOU EXPRESSLY UNDERSTAND AND AGREE THAT:</p><p>1.1. YOUR USE OF THE PLATFORM IS AT YOUR SOLE RISK. THE PLATFORM IS PROVIDED ON AN \u201CAS IS\u201D AND \u201CAS AVAILABLE\u201D BASIS. TO THE MAXIMUM EXTENT PERMITTED BY LAW, SMART CITIZEN EXPRESSLY DISCLAIMS ALL WARRANTIES AND CONDITIONS OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO THE IMPLIED WARRANTIES AND CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT;</p><p>1.2. SMART CITIZEN DOES NOT WARRANT THAT (i) THE PLATFORM WILL MEET ALL OF YOUR REQUIREMENTS; (ii) THE PLATFORM WILL BE UNINTERRUPTED, TIMELY, SECURE OR ERROR-FREE; OR (iii) ALL ERRORS IN THE SOFTWARE OR PLATFORM WILL BE CORRECTED;</p><p>1.3. ANY MATERIAL DOWNLOADED OR OTHERWISE OBTAINED THROUGH THE USE OF THE PLATFORM IS DONE AT YOUR OWN DISCRETION AND RISK AND THAT YOU ARE SOLELY RESPONSIBLE FOR ANY DAMAGE TO YOUR COMPUTER SYSTEMS OR OTHER DEVICE OR LOSS OF DATA THAT RESULTS FROM THE DOWNLOAD OF ANY SUCH MATERIAL;</p><p>1.4. NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED BY YOU FROM SMART CITIZEN OR THROUGH OR FROM THE PLATFORM SHALL CREATE ANY WARRANTY NOT EXPRESSLY STATED IN THESE TERMS OF USE.</p><p>2. Until further notice Smart Citizen Platform is provided as a Beta software release which means THERE IS NO SERVICE LEVEL AGREEMENT AND NO WARRANTY OF SERVICE AVAILABILITY.</p><h3>15. Limitation of Liability</h3><p>1. YOU EXPRESSLY UNDERSTAND AND AGREE THAT SMART CITIZEN, ITS SUBSIDIARIES, AFFILIATES AND LICENSORS, AND OUR AND THEIR RESPECTIVE OFFICERS, EMPLOYEES, AGENTS AND SUCCESSORS SHALL NOT BE LIABLE TO YOU FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO, DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, COVER OR OTHER INTANGIBLE LOSSES (EVEN IF SMART CITIZEN HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES) RESULTING FROM:</p><p>1.1. THE USE OR THE INABILITY TO USE THE PLATFORM;</p><p>1.2. UNAUTHORIZED ACCESS TO OR THE LOSS, CORRUPTION OR ALTERATION OF YOUR TRANSMISSIONS, CONTENT OR DATA;</p><p>1.3. STATEMENTS OR CONDUCT OF ANY THIRD PARTY ON OR USING THE PLATFORM;</p><p>1.4. SMART CITIZEN ACTIONS OR OMISSIONS IN RELIANCE UPON YOUR ACCOUNT INFORMATION AND ANY CHANGES THERETO OR NOTICES RECEIVED THEREFROM;</p><p>1.5. YOUR FAILURE TO PROTECT THE CONFIDENTIALITY OF ANY PASSWORDS OR ACCESS RIGHTS TO YOUR ACCOUNT INFORMATION;</p><p>1.6. THE ACTS OR OMISSIONS OF ANY THIRD PARTY USING OR INTEGRATING WITH THE PLATFORM;</p><p>1.7. THE TERMINATION OF YOUR ACCOUNT IN ACCORDANCE WITH THESE TERMS; OR</p><p>1.8. ANY OTHER MATTER RELATING TO THE PLATFORM.</p><p>2. NOTHING IN THESE TERMS IS INTENDED TO EXCLUDE OR LIMIT ANY CONDITION, WARRANTY, RIGHT OR LIABILITY WHICH MAY NOT BE LAWFULLY EXCLUDED OR LIMITED.</p><h3>16. Miscellaneous</h3><p>1. These Terms of Use shall be governed by and construed in accordance with Spanish laws, without giving effect to any principles of conflict of law. You agree that any action at law or in equity arising out of or relating to these Terms of Use shall be filed only in Spanish Courts and you hereby consent and submit to the personal jurisdiction of such courts for the purposes of litigating any such action.</p><p>2. These Terms of Use shall be governed by and construed in accordance with Spanish laws, without giving effect to any principles of conflict of law. You agree that any action at law or in equity arising out of or relating to these Terms of Use shall be filed only in Spanish Courts and you hereby consent and submit to the personal jurisdiction of such courts for the purposes of litigating any such action.</p><p>3. No party shall be liable for any performance failure, delay in performance, or lost data under these Terms of Use due to causes beyond that party\'s reasonable control and occurring without its fault or negligence.</p><p>4. The failure of Smart Citizen to partially or fully exercise any right shall not prevent the subsequent exercise of such right. The waiver by Smart Citizen of any breach shall not be deemed a waiver of any subsequent breach of the same or any other term of these Terms of Use. No remedy made available to Smart Citizen by any of the provisions of these Terms of Use is intended to be exclusive of any other remedy, and each and every remedy shall be cumulative and in addition to every other remedy available at law or in equity.</p><p>5. All products, company names, brand names, trademarks and logos are the property of their respective owners.</p></div></div><div class=""><div class="content"><h2 id="policy" name="policy">Privacy</h2><p>This Privacy Policy explains what information Smart Citizen collects about you and why. Please read it carefully.</p><h3>1. The purpose of this Privacy Policy</h3><p>1. This Privacy Policy shall be read together with and in accordance with Smart Citizen Platform Terms of Use available at <a href="#terms-of-use" class="about">Terms of use</a> <b>(hereinafter the "Terms of Use")</b>, and applies to the personal data obtained by Smart Citizen through your use of the Smart Citizen Platform. The terms and definition used in this Privacy Policy shall have the meanings provided for in the Terms of Use if not otherwise defined.</p><h3>2. Changes to the Privacy Policy</h3><p>1. According to Smart Citizen evolution, we may need to update this Privacy Policy and change in the Terms of Use. We will always maintain our commitment to respect your privacy and comply with the laws applicable to us and to you.</p><p>2. We will always publish any revised Privacy Policy, along with its effective date, in the following page <a href="#policy" class="about">Privacy policy</a>.</p><p>3. If required by applicable law, we will obtain your consent to such changes. In the other cases, please note that your continuation of your Smart Citizen Platform account after any change means that you agree with, and consent to be bound by, the revised Privacy Policy. If you disagree with any changes and do not wish your personal data to be subject to the revised Policy, you will need to close your account before the new Policy becomes effective.</p><h3>3. Personal Data processed</h3><p>1. In order to operate the Platform, Smart Citizen collects personal data about platform\'s users. Two main types of information are processed:</p><p>1.1. Users\' personal data related to the creation and the maintenance of the Platform account (e.g. your username, email address, geo localisation and other personal information you provided at the creation of the account) ("<b>Personal Account Information</b>").</p><p>1.2. Information collected by Google Analytics and other tools while you navigate through the Platform, in order to help us to improve the service ("<b>Anonymous Data</b>")<b>(hereinafter collectively called "Personal Data")</b>.</p><p>2. Smart Citizen also passively stores Content you add/post/upload to your account but it do not autonomously collect or process those Content for its own purposes. You remain the only responsible, liable of the Content, and the only data controller in relation to personal data possibly published/uploaded in your account.</p><h3>4. Processing purposes</h3><p>1. All Personal Data received from you will be treated fairly and lawfully.</p><p>1.1. (a) The processing of Personal Account Information: (i) allows Smart Citizen to create and maintain your account, operate the Platform and provide the service; (ii) helps Smart Citizen communicate with you about your use of the Platform as well as answer to your assistance requests (iii) may be used by Smart Citizen for marketing purposes such as sending information material (i.e. commercial communications) and marketing emails. Providing your Personal Data for marketing purposes is a mere faculty and you are able to revoke your consent at any time (you can opt-out of such communications at any time by clicking the "unsubscribe" link found within Smart Citizen email). Any non-submission of Persona Data for such activities will have no consequence on the user\'s possibility to use the services and features offered by the Platform.</p><p>1.2. (b) Anonymous Data and automatic data collection tools: as you navigate through Smart Citizen Platform, certain anonymous information will be gathered without your actively providing the information. This information might be collected using various technologies, such as cookies, Internet tags or web beacons, and navigational data collection (log files, server logs, clickstream). Additional information is collected from your internet browser (such as the URL of the website you just came from, the Internet Protocol (IP) address, the browser version your computer or mobile device is currently using, the date and time you access the Platform and the pages that you access while at the Platform). This information is used exclusively for statistical purposes and in anonymous form in relation to the access of the Platform and for purposes of monitoring the correct functioning of the Platform and of enhancing its functioning and content.</p><h3>5. Personal Data communication by Smart Citizen</h3><p>1. Smart Citizen is not in the business of selling or renting user information, and it only discloses Personal data when:</p><p>1.1. We have your explicit consent to share the information;</p><p>1.2. We need to share your information with affiliated and unaffiliated service providers to fulfil the service request;</p><p>1.3. We believe it is necessary to investigate potential violations of our Terms of Use, to enforce them, or when we believe it is necessary to investigate, prevent or take action regarding illegal activities, suspected fraud or potential threats against persons, property or the systems on which we operate the Platform;</p><p>1.4. In any other case provided for by the applicable law, including compliance with warrants, court orders or other legal process.</p><h3>6. Your rights</h3><p>1. 1. Data subjects have the right to ask for confirmation, amendment, update and cancellation of her/his personal data as well as oppose unlawful processing.</p><p>2. If you wish to (i) access any personal data Smart Citizen hold about you; (ii) request that Smart Citizen corrects or deletes your personal data; or (iii) request that Smart Citizen not use or stop using your persona data for marketing purposes may do so by contacting us at <a href="mailto:info@smartcitizen.me" class="about">info@smartcitizen.me</a>. We will comply with such requests to the extent permitted or required by applicable laws.</p><h3>7. Personal Data storage and transmission within the European Union:</h3><p>1. When you use Smart Citizen Platform your Personal Data will be stored in servers which are currently located in Spain. By using Smart Citizen Platform you are confirming your consent to such information, including Personal Information and Content, being hosted and accessed in Spain.</p><p>2. Personal Data may be communicated to and shared with other companies in accordance with section 5 above but the transfer will always occur within the European Economic Area ("EEA").</p><h3>8. Security of you Data and data breach</h3><p>1. Smart Citizen is committed to protecting the security of your information and takes reasonable precautions to protect it. However, Internet data transmissions, whether wired or wireless, cannot be guaranteed to be 100% secure, and as a result, Smart Citizen cannot ensure the security of information you transmit by using the Platform. Accordingly, you acknowledge that you do so at your own risk. Once Smart Citizen receive your data transmission, we make all commercially reasonable efforts to ensure its security on our systems.</p><p>2. If Smart Citizen learns of a security system breach, we will notify you and provide information on protective steps, if available, through the email address that you have provided to Smart Citizen or by posting a notice on our Platform.</p><h3>9. Other websites and applications</h3><p>1. The Platform may contain links to other websites and applications. Smart Citizen is not responsible for the privacy policies or privacy practices of any third party.</p><h3>10. Data Controller and contacts</h3><p>1. The data controller in relation to the Persona Data as defined and described above is: <a href="http://iaac.net/"><span class="">INSTITUT d\u2019ARQUITECTURA AVAN\xC7ADA DE CATALUNYA</span></a></p><p>2. If you have questions, comments or concerns about this Privacy Policy, please contact us by email at <a href="mailto:info@smartcitizen.me" class="about">info@smartcitizen.me</a>.</p></div></div></section>');
$templateCache.put('app/components/static/static.html','<section class="static_page" flex=""><div class="timeline" layout="row"><div class="content" layout="row" layout-align="start center" flex=""><h1>Title</h1></div></div><div class=""><div class="content"><h2>Heading 2</h2><h3>Heading 3</h3><h4>Heading 4</h4><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam a porta quam. Phasellus tincidunt facilisis blandit. Aenean tempor diam quis turpis vestibulum, ac semper turpis mollis. Sed ac ultricies est. Vivamus efficitur orci efficitur turpis commodo dignissim. Aliquam sagittis risus in semper ullamcorper. Sed enim diam, tempus eget lorem sit amet, luctus porta enim. Nam aliquam mollis massa quis euismod. In commodo laoreet mattis. Nunc auctor, massa ut sollicitudin imperdiet, mauris magna tristique metus, quis lobortis ex ex id augue. In hac habitasse platea dictumst. Sed sagittis iaculis eros non sollicitudin. Sed congue, urna ut aliquet ornare, nisi tellus euismod nisi, a ullamcorper augue arcu sit amet ante. Mauris condimentum ex ante, vitae accumsan sapien vulputate in. In tempor ligula ut scelerisque feugiat. Morbi quam nisi, blandit quis malesuada sit amet, gravida ut urna.</p><md-button class="md-primary md-raised">button</md-button><md-button class="md-primary">button</md-button></div></div><div class=""><div class="content"><h2>Heading 2</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam a porta quam. Phasellus tincidunt facilisis blandit. Aenean tempor diam quis turpis vestibulum, ac semper turpis mollis. Sed ac ultricies est. Vivamus efficitur orci efficitur turpis commodo dignissim. Aliquam sagittis risus in semper ullamcorper. Sed enim diam, tempus eget lorem sit amet, luctus porta enim. Nam aliquam mollis massa quis euismod. In commodo laoreet mattis. Nunc auctor, massa ut sollicitudin imperdiet, mauris magna tristique metus, quis lobortis ex ex id augue. In hac habitasse platea dictumst. Sed sagittis iaculis eros non sollicitudin. Sed congue, urna ut aliquet ornare, nisi tellus euismod nisi, a ullamcorper augue arcu sit amet ante. Mauris condimentum ex ante, vitae accumsan sapien vulputate in. In tempor ligula ut scelerisque feugiat. Morbi quam nisi, blandit quis malesuada sit amet, gravida ut urna.</p></div></div><div class=""><div class="content"><h2>Small section</h2><p>Single line comment.</p></div></div></section>');
$templateCache.put('app/components/static/styleguide.html','<div class="styleguide"><section class="profile_header"><h1 class="sg-pageTitle">Smart Citizen Style Guide</h1></section><section layout="row"><div class="profile_sidebar"><p class="profile_sidebar_title">MENU</p><div class="profile_sidebar_options"><button class="profile_sidebar_button md-button md-default-theme">Fonts</button> <button class="profile_sidebar_button md-button md-default-theme">Buttons</button> <button class="profile_sidebar_button md-button md-default-theme">Colors</button></div></div><div flex="" class="profile_content_main"><h2 class="sg-titles">Font style - Light theme</h2><div layout="column" class="section-padding" style="border:1px solid rgba(0,0,0,0.12)"><div layout="row"><h1 flex="50">h1 Heading</h1><h1 class="info-text" flex="30">2.2 em</h1><h1 class="info-text" flex="20">normal</h1></div><md-divider></md-divider><div layout="row"><h2 flex="50">h2 Heading</h2><h2 class="info-text" flex="30">1.7 em</h2><h2 class="info-text" flex="20">normal</h2></div><md-divider></md-divider><div layout="row"><h3 flex="50">h3 Heading</h3><h3 class="info-text" flex="30">1.3 em</h3><h3 class="info-text" flex="20">bold</h3></div><md-divider></md-divider><div layout="row"><h4 flex="50">h4 Heading</h4><h4 class="info-text" flex="30">1.1 em</h4><h4 class="info-text" flex="20">normal</h4></div><md-divider></md-divider><div layout="row"><p flex="50">Paragraph</p><p class="info-text" flex="30">1 em</p><p class="info-text" flex="20">normal</p></div><md-divider></md-divider><div layout="row"><p flex="50" class="sg-paragraph2">Paragraph info</p><p class="info-text" flex="30">1 em</p><p class="info-text" flex="20">lighter</p></div><md-divider></md-divider><small>Small text</small></div><div class="sg-text-box"><pre>\n          <code>\n            <span>&lt;h1&gt;</span> h1 heading <span>&lt;/h1&gt;</span>\n            <span>&lt;h2&gt;</span> h2 heading <span>&lt;/h2&gt;</span>\n            <span>&lt;h3&gt;</span> h3 heading <span>&lt;/h3&gt;</span>\n            <span>&lt;h4&gt;</span> h4 heading <span>&lt;/h4&gt;</span>\n            <span>&lt;p&gt;</span>  Paragraph  <span>&lt;/p&gt;</span>\n            <span>&lt;small&gt;</span> Small text<span>&lt;/small&gt;</span>\n          </code>\n        </pre></div><h2 class="sg-titles">Font style - Dark theme</h2><div class="dark-text-section section-padding"><div layout="row"><h1 flex="50">h1 Heading</h1><h1 flex="30" class="info-text-dark">1.8 em</h1><h1 flex="20" class="info-text-dark">normal</h1></div><md-divider class="dark-theme-divider"></md-divider><div layout="row"><h2 flex="50">h2 Heading</h2><h2 flex="30" class="info-text-dark">1.7 em</h2><h2 flex="20" class="info-text-dark">normal</h2></div><md-divider class="dark-theme-divider"></md-divider><div layout="row"><h4 flex="50">h4 Heading</h4><h4 flex="30" class="info-text-dark">1.1 em</h4><h4 flex="20" class="info-text-dark">normal</h4></div><md-divider class="dark-theme-divider"></md-divider><div layout="row"><h6 flex="50">h6 Heading</h6><h6 flex="30" class="info-text-dark">0.75 em</h6><h6 flex="20" class="info-text-dark">bold</h6></div><md-divider class="dark-theme-divider"></md-divider><div layout="row"><p flex="50">Paragraph</p><p flex="30" class="info-text-dark">1 em</p><p flex="20" class="info-text-dark">lighter</p></div><md-divider class="dark-theme-divider"></md-divider><br><small>Small text</small></div><div class="sg-text-box"><pre>\n          <code class="">\n            <span>&lt;div class="dark-theme-section"&gt;</span>\n              <span>&lt;h1&gt;</span> h1 heading <span>&lt;/h1&gt;</span>\n              <span>&lt;h2&gt;</span> h2 heading <span>&lt;/h2&gt;</span>\n              <span>&lt;h3&gt;</span> h3 heading <span>&lt;/h3&gt;</span>\n              <span>&lt;h4&gt;</span> h4 heading <span>&lt;/h4&gt;</span>\n              <span>&lt;p&gt;</span>  Paragraph  <span>&lt;/p&gt;</span>\n              <span>&lt;small&gt;</span> Small text<span>&lt;/small&gt;</span>\n            <span>&lt;/div&gt;</span>  \n          </code>\n        </pre></div><h2 class="sg-titles">Buttons</h2><div flex="" layout="row" class="section-padding" style="border:1px solid rgba(0,0,0,0.12)"><div flex="25"><md-button>Button</md-button><br><md-button class="md-warn sg-button-margin">Warn button</md-button></div><div flex="25"><md-button ng-href="/about" class="btn-round btn-cyan">Link button</md-button><br><md-button class="md-flat md-primary sg-button-margin">Raised button</md-button></div><div flex="25"><span class="label">offline</span> <span class="tag">Barcelona</span></div></div><div class="sg-text-box"><pre>\n          <code>\n            <span>&lt;md-button&gt;</span> Button <span>&lt;/md-button&gt;</span>\n            <span>&lt;md-button class="btn-round btn-cyan"&gt;</span> Link button< span>&lt;/md-button&gt;\n            <span>&lt;md-button class="label"&gt;</span> offline <span>&lt;/md-button&gt;</span>\n            <span>&lt;md-button class="tag"&gt;</span> Barcelona <span>&lt;/md-button&gt;</span>\n            <span>&lt;md-button class="md-warn"&gt;</span> Warn button <span>&lt;/md-button&gt;</span>\n            <span>&lt;md-button class="md-flat md-primary"&gt;</span> Raised button <span>&lt;/md-button&gt;</span>\n          </code>\n        </pre></div><h2 class="sg-titles">Colors</h2><div class="colors-section section-padding" style="border:1px solid rgba(0,0,0,0.12)"><div layout="row"><div flex="20" class="secondary-color"><p>#065063</p><p>$secondary_color</p></div><div flex="20" class="terciary_color"><p>#38CEF3</p><p>$terciary_color</p></div><div flex="20" class="secondary_color_light"><p>#8DB2BA</p><p>$secondary_color_light</p></div><div flex="20" class="secondary-color-pastel"><p>#C8E6ED</p></div><div flex="20" class="white"><p>#FFFFFF</p></div></div></div><div class="sg-text-box"><pre>\n          <code class="">\n            <span>&lt;div class="secondary-color"&gt;</span> \n              &lt;p&gt;#065063&lt;/p&gt;\n              &lt;p&gt;$secondary_color&lt;/p&gt;\n            <span>&lt;/div&gt;</span>\n\n            <span>&lt;div class="terciary_color"&gt;</span> \n              &lt;p&gt;#38CEF3&lt;/p&gt;\n              &lt;p&gt;$terciary_color&lt;/p&gt;\n            <span>&lt;/div&gt;</span>\n\n            <span>&lt;div class="secondary_color_light"&gt;</span> \n              &lt;p&gt;#8DB2BA&lt;/p&gt;\n              &lt;p&gt;$secondary_color_light&lt;/p&gt;\n            <span>&lt;/div&gt;</span>\n\n            <span>&lt;div class="secondary-color-pastel"&gt;</span> \n              &lt;p&gt;#065063&lt;/p&gt;\n              &lt;p&gt;$secondary_color&lt;/p&gt;\n            <span>&lt;/div&gt;</span>\n\n            <span>&lt;div class="white"&gt;</span> \n              &lt;p&gt;#FFFFFF&lt;/p&gt;\n            <span>&lt;/div&gt;</span>\n          </code>\n        </pre></div><h2 class="sg-titles">Sensor Charts Colors</h2><div class="colors-section section-padding" style="border:1px solid rgba(0,0,0,0.12)"><div layout="row" class="sensors"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div></div></section></div>');
$templateCache.put('app/components/store/store.html','<md-button class="md-flat" ng-class="(isLoggedin) ? \'navbar_highlight_button\' : \'padding14\'" ng-click="showStore($event)" analytics-on="click" analytics-event="Kit Purchase" analytics-action="view">Get your Kit</md-button>');
$templateCache.put('app/components/store/storeModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Store</h2><span flex=""></span><md-button class="md-icon-button" ng-click="cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><md-progress-linear ng-show="waitingFromServer" class="md-hue-3" md-mode="indeterminate"></md-progress-linear><form action="https://smartcitizen.us2.list-manage.com/subscribe/post?u=d67ba8deb34a23a222ec4eb8a&amp;id=d0fd9c9327" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" target="_blank" validate=""><div class="md-dialog-content max-width-500px min-height-80"><h2>Order your Smartcitizen Kit</h2><p>An Open-Source Environmental Monitoring Platform consisting of arduino-compatible hardware, data visualization web and mobile app, and a full featured Rest API.</p><div layout="row" layout-xs="column" layout-align="space-around center"><img class="img-circle" src="assets/images/sckit_avatar.jpg" alt="Smartcitizen Kit"><div class="store_itemDescription"><h3>This is what you get</h3><ul><li>Smart Citizen Kit (Data board,<br>Ambient board and battery)</li><li>Platform life subscription</li><li>Private REST API Key</li><li>Android App</li><li><i>Note: Outdoor enclosure available<br>separately. Please, write us on <a href="mailto:store@smartcitizen.me">store@smartcitizen.me</a></i></li></ul></div></div><p>We are currently out of stock working against time to finish the new version of the Smart Citizen Kit. Share us your email below and we will notify you as soon as kits are ready!</p><md-input-container><label>Email</label> <input type="email" name="EMAIL" required=""></md-input-container><div id="mce-responses" class="clear"><div class="response" id="mce-error-response" style="display:none"></div><div class="response" id="mce-success-response" style="display:none"></div></div></div><md-button ng-disabled="MailchimpSubscriptionForm.$invalid" type="submit" name="subscribe" id="mc-embedded-subscribe" class="btn-blue btn-full" analytics-on="store" analytics-event="Kit Purchase" ng-click="addSubscription(mailchimp)" analytics-action="purchase">Notify me when ready</md-button></form></md-dialog-content></md-dialog>');
$templateCache.put('app/components/tags/tags.html','<section class="kitTags__section" ng-if="tagsCtl.selectedTags.length > 0" change-content-margin=""><div class="shadow"></div><div class="over_map"><div class="kit_fixed kitTags__container"><div class="kitTags__textContainer" layout-xs="column"><div class="kitTags__textElement"><h1><span ng-repeat="tag in tagsCtl.selectedTags">#{{tag}}</span></h1><h2>{{tagsCtl.markers.length}} kit{{tagsCtl.markers.length > 1 ? \'s are\' : \' is\'}} on <span ng-repeat="tag in tagsCtl.selectedTags">#{{tag}}</span> and {{tagsCtl.percActive}}% are active today.</h2><p ng-repeat="tag in tagsCtl.selectedTags"><span ng-if="tag==\'BarcelonaNoise\'">The Barcelona <a href="http://making-sense.eu/">Making Sense</a> community looking at noise while testing the new SCK 1.5!</span></p></div><div class="kitTags__textElement"><h4 class="md-title">About #Tags</h4><p class="sg-paragraph2">Smart Citizen is a platform to generate participatory processes of the people in the cities. Connecting data, people and knowledge, the objective of the platform is to serve as a node for building productive open indicators and distributed tools, and thereafter the collective construction of the cityfor its own inhbitants.</p><md-button class="color-cyan" ng-href="https://forum.smartcitizen.me/index.php?p=/discussion/comment/1501" target="_blank">SUGGEST NEW TAGS</md-button></div></div></div></div><div class="kitTags__listContainer kit_fixed"><md-progress-circular ng-show="!tagsCtl.kits || tagsCtl.kits.length <= 0" class="md-hue-3 chart_spinner" md-mode="indeterminate"></md-progress-circular><section class="kit_owner_kits inside_list" ng-if="tagsCtl.kits.length > 0"><kit-list kits="tagsCtl.kits"></kit-list></section></div></section>');
$templateCache.put('app/components/upload/csvUpload.html','<button name="csvFiles" type="file" class="md-button btn-blue md-flat btn-round ml-0" ngf-select="vm.change($files, $invalidFiles)" ngf-before-model-change="vm.onSelect()" ngf-multiple="true" ngf-accept="\'application/csv,.csv\'" ngf-max-files="30" ngf-max-size="\'10MB\'" ngf-pattern="\'.csv\'">Load CSV Files</button><div ng-if="vm.invalidFiles && vm.invalidFiles.length > 0"><h3>Unsopported files<p>We\u2019re unable to upload the following files due to the problems mentioned below.</p><md-list class="list-shadow bg-red-light"><md-list-item ng-repeat="invalidFile in vm.invalidFiles"><span>{{invalidFile.name}}</span> <span flex=""></span><div ng-messages="invalidFile.$errorMessages"><div class="label color-white bg-red" ng-message="pattern">Invalid format</div><div class="label color-white bg-red" ng-message="maxSize">Too large (Max 10MB)</div><div class="label color-white bg-red" ng-message="maxFiles">Too many files (Max 30)</div><div class="label color-white bg-red" ng-message="duplicate">Already on the list</div></div><md-icon ng-click="vm.invalidFiles.splice($index, 1);" md-svg-icon="./assets/images/close_icon_black.svg"></md-icon></md-list-item></md-list></h3></div><div class=""><h3>Upload your files<p>Select the files you want and upload them into your kit!</p></h3></div><md-input-container><label>Actions</label><md-select ng-model="vm.action"><md-option ng-value="null"><em>None</em></md-option><md-option value="selectAll" ng-disabled="vm.haveSelectedAllFiles()">Select all</md-option><md-option value="deselectAll" ng-disabled="vm.haveSelectedNoFiles()">Deselect all</md-option><md-option value="upload" ng-disabled="!vm.haveSelectedFiles()">Upload</md-option><md-option value="remove" ng-disabled="!vm.haveSelectedFiles()">Remove</md-option></md-select></md-input-container><md-button class="md-flat" ng-class="vm.action ? \'color-blue\' : \'\'" ng-click="vm.doAction()" ng-disabled="(!vm.csvFiles || vm.csvFiles.length === 0) && !vm.action">Apply</md-button><div class="relative"><md-progress-linear class="green absolute" md-mode="{{ vm.loadingType }}" ng-value="vm.loadingProgress" ng-if="vm.loadingStatus"></md-progress-linear></div><md-list ng-if="vm.csvFiles && vm.csvFiles.length > 0" class="list-shadow"><md-list-item ng-class="{\'bg-green\':csvFile.success}" ng-repeat="csvFile in vm.csvFiles"><md-checkbox ng-model="csvFile.checked" ng-disabled="csvFile.success"></md-checkbox><span>{{csvFile.name}}</span><md-button ng-click="vm.showErrorModal(csvFile)" ng-if="(csvFile.parseErrors || csvFile.backEndErrors) && !csvFile.success" class="md-icon-button md-warn"><md-tooltip md-direction="top">Show details</md-tooltip><md-icon md-svg-icon="./assets/images/alert_icon.svg"></md-icon></md-button><md-icon class="color-green" style="margin-left: 14px" md-svg-icon="./assets/images/check_circle.svg" ng-if="csvFile.success"></md-icon><md-progress-circular style="margin-left: 14px;" ng-if="csvFile.progress" md-mode="indeterminate" md-diameter="20"></md-progress-circular><span flex=""></span> <span ng-if="csvFile.isNew && !csvFile.success" class="label bg-grey">new data</span><md-button ng-click="vm.removeFile($index)" class="md-icon-button md-default"><md-icon md-svg-icon="./assets/images/delete_icon.svg"></md-icon></md-button></md-list-item></md-list><md-list ng-if="!vm.csvFiles || vm.csvFiles.length === 0" class="list-shadow"><md-list-item><div class="md-list-item-text" layout="column">There are no files here. Let\u2019s upload something!</div></md-list-item></md-list>');
$templateCache.put('app/components/upload/errorModal.html','<md-dialog><md-toolbar><div class="md-toolbar-tools"><h2>Errors</h2><span flex=""></span><md-button class="md-icon-button" ng-click="csvFile.cancel()"><md-icon md-svg-icon="./assets/images/close_icon_blue.svg" aria-label="Close dialog"></md-icon></md-button></div></md-toolbar><md-dialog-content><div style="min-height: 200px" layout="column" layout-align="space-around center"><md-icon class="s-48 md-warn" md-svg-icon="./assets/images/alert_icon.svg"></md-icon><md-list><md-list-item ng-repeat="error in csvFile.parseErrors">{{error.message}} <span ng-if="error.row">(at row: {{error.row}})</span></md-list-item><md-list-item ng-if="csvFile.backEndErrors">{{csvFile.backEndErrors.statusText || csvFile.backEndErrors}} {{csvFile.backEndErrors.status}} <span ng-if="csvFile.backEndErrors.data"></span>: {{ csvFile.backEndErrors.data.message || csvFile.backEndErrors.data.errors }}</md-list-item></md-list></div></md-dialog-content></md-dialog>');
$templateCache.put('app/components/upload/upload.html','<section class="upload-csv timeline" flex="1" layout="row" layout-align="center center"><div class="container" layout="row" layout-align="space-between center"><span class="color-white title-timeline">Upload CSV Files</span><md-button style="margin-left: auto" class="md-flat md-primary timeline_buttonBack" ui-sref="layout.home.kit({id: vm.kit.id})">Back to Kit</md-button></div></section><section class="upload-csv" style="margin-top: 64px; margin-bottom: 64px;"><div class="container"><sc-csv-upload kit="vm.kit"><sc-csv-upload></sc-csv-upload></sc-csv-upload></div></section>');
$templateCache.put('app/components/userProfile/userProfile.html','<section class="myProfile_state" layout="column"><div class="profile_header myProfile_header dark"><div class="myProfile_header_container" layout="row"><img ng-src="{{ vm.user.avatar || \'./assets/images/avatar.svg\' }}" class="profile_header_avatar myProfile_header_avatar"><div class="profile_header_content"><h2 class="profile_header_name">{{ vm.user.username || \'No data\' }}</h2><div class="profile_header_location"><md-icon md-svg-src="./assets/images/location_icon_light.svg" class="profile_header_content_avatar"></md-icon><span class="md-title" ng-if="vm.user.city">{{ vm.user.city }}</span> <span class="md-title" ng-if="vm.user.city && vm.user.country">,</span> <span class="md-title" ng-if="vm.user.country">{{ vm.user.country }}</span> <span class="md-title" ng-if="!vm.user.city && !vm.user.country">No data</span></div><div class="profile_header_url"><md-icon md-svg-src="./assets/images/url_icon_light.svg" class="profile_header_content_avatar"></md-icon><a class="md-title" ng-href="{{ vm.user.url || \'http://example.com\' }}">{{ vm.user.url || \'No website\' }}</a></div></div></div></div><div class="profile_content" layout="row"><div class="profile_sidebar"><p class="profile_sidebar_title">FILTER KITS BY</p><div class="profile_sidebar_options" layout="column"><md-button ng-click="vm.filterKits(\'all\')" class="profile_sidebar_button" analytics-on="click" analytics-event="Profile" analytics-action="kit filter">ALL</md-button><md-button ng-click="vm.filterKits(\'online\')" class="profile_sidebar_button" analytics-on="click" analytics-event="Profile" analytics-action="kit filter">ONLINE</md-button><md-button ng-click="vm.filterKits(\'offline\')" class="profile_sidebar_button" analytics-on="click" analytics-event="Profile" analytics-action="kit filter">OFFLINE</md-button></div></div><div class="profile_content_main" flex=""><div class="profile_content_main_top"><span class="profile_content_main_title">{{ vm.filteredKits.length || 0 }} kits filtering by {{ vm.status.toUpperCase() || \'ALL\' }}</span></div><div class="profile_content_main_kits"><kit-list actions="{remove: vm.removeKit}" kits="(vm.filteredKits = (vm.kits | filterLabel:vm.kitStatus ))"></kit-list><div class="kitList kitList_primary kitList_borderBottom" ng-show="!vm.kits.length"><div class="kitList_container"><div class="kitList_noKits"><span>There are not kits yet</span></div></div></div></div></div></div></section>');
$templateCache.put('app/components/kit/editKit/editKit.html','<section class="kit_dataChange"><section class="timeline" flex="1" layout="row" layout-align="center center"><div class="timeline_container" layout="row" layout-align="space-between center"><div layout="row" layout-align="start center"><div class="timeline_stepCircle" ng-class="{\'is-on\':vm.step===1, \'is-off\':vm.step!==1}" layout="row" layout-align="center center">1</div><md-button ng-click="vm.goToStep(1)" class="timeline_stepName">Kit data</md-button><div ng-show="vm.setupAvailable" class="timeline_line timeline_line_small"></div><div ng-show="vm.setupAvailable" layout="row" layout-align="start center"><div class="timeline_stepCircle" ng-class="{\'is-on\':vm.step===2, \'is-off\':vm.step!==2}" layout="row" layout-align="center center">2</div><md-button ng-show="vm.setupAvailable" ng-click="vm.goToStep(2)" class="timeline_stepName">Set up</md-button></div></div><md-button style="margin-left: auto" class="md-flat md-primary timeline_buttonBack" ng-click="vm.backToProfile()">Back to Profile</md-button><md-button style="margin-left: 20px" class="md-flat md-primary timeline_buttonSave" ng-click="vm.submitFormAndKit()">Save</md-button></div></section><section class="timeline_content" flex="1"><section ng-show="vm.step === 1"><form><section class="form_block form_blockNormal isEven"><div layout="row" layout-xs="column" layout-align="space-around start"><div flex="30" class="form_blockContent"><div layout="row"><div class="form_blockContent_text"><h2>Basic information</h2><small>Please, provide kit basic info. That includes a name and exposure</small></div></div></div><div flex="50" class="form_blockInput"><div class="form_blockInput_container" layout="column"><md-input-container><label>Kit Name</label> <input type="text" class="font-roboto-condensed" ng-model="vm.kitForm.name"></md-input-container><div layout="row" layout-align="space-between start"><div class="form_blockInput_select" layout="row" layout-align="start center"><label>Exposure:</label><md-select ng-model="vm.kitForm.exposure" placeholder="Select exposure"><md-option ng-repeat="exposure in vm.exposure" ng-value="{{ exposure.value }}">{{ exposure.name }}</md-option></md-select></div></div></div></div></div></section><section class="form_block form_blockMap"><div layout="row" layout-xs="column" layout-align="space-around start"><div flex="30" class="form_blockContent"><div layout="row"><div class="form_blockContent_text"><h2>Kit location</h2><small>You can adjust the location by dragging the marker on the map.</small></div></div></div><div flex="50" class="form_blockInput"><div class="form_blockInput_button" ng-if="!vm.kitForm.location.lat && !vm.kitForm.location.lng"><div class="form_blockInput_container" layout="row" layout-align="center center"><md-button class="md-flat btn-cyan" ng-click="vm.getLocation()">Get your location</md-button></div></div><div class="form_blockInput_map" ng-if="vm.kitForm.location.lat && vm.kitForm.location.lng"><leaflet center="vm.kitForm.location" defaults="vm.defaults" markers="vm.markers" tiles="vm.tiles" width="100%" height="100%"></leaflet></div></div></div></section><section class="form_block form_blockNormal isEven"><div layout="row" layout-xs="column" layout-align="space-around start"><div flex="30" class="form_blockContent"><div layout="row"><div class="form_blockContent_text"><h2>Kit tags</h2><small>Kits can be grouped by tags. Choose from the available tags or submit a tag request on the <a href="https://forum.smartcitizen.me/" target="_blank">Forum</a>.</small></div></div></div><div flex="50" class="form_blockInput"><div class="form_blockInput_container"><div flex="100" flex-gt-md="50"><md-select ng-model="vm.tag" placeholder="Select tag"><md-option ng-value="{{ tag.id }}" ng-repeat="tag in vm.tags">{{ tag.name }}</md-option></md-select></div><div class="form_blockInput_chips"><div class="chips" layout="row" layout-align="start center"><div class="chip kit_tag" ng-repeat="tag in vm.kitForm.tags"><span class="chip_name">{{ tag }}</span> <button class="chip_icon" ng-click="vm.removeTag(tag)" arial-label=""><md-icon md-svg-src="./assets/images/close_icon_black.svg"></md-icon></button></div></div></div></div></div></div></section><section class="form_block form_blockNormal"><div layout="row" layout-xs="column" layout-align="space-around start"><div flex="30" class="form_blockContent"><div layout="row"><div class="form_blockContent_text"><h2>Kit description</h2><small>Say something nice about your kit. Why is it for? Is this part of any kind of project? Whatever :)</small></div></div></div><div flex="50" class="form_blockInput"><div class="form_blockInput_container" layout="row"><md-input-container flex="100" flex-gt-md="50"><label>Description</label> <textarea class="font-roboto-condensed" type="text" ng-model="vm.kitForm.description" placeholder="Describe your kit" md-maxlength="120"></textarea></md-input-container></div></div></div></section></form><md-button ng-show="vm.setupAvailable" class="md-primary timeline_button timeline_buttonOpen" ng-click="vm.submitFormAndNext()">Open kit set up</md-button></section><section ng-show="vm.step === 2 && vm.setupAvailable"><form><section class="form_block form_blockNormal isEven"><div layout="row" layout-align="start start"><div class="form_blockContent"><div layout="row"><div class="form_blockContent_text long"><h2>Setup your kit</h2><small>In order to have your kit connected to the Smart Citizen platform, we need a few step involving the connection of your kit to your computer. This tool will help you register your kit to the platform, setup your kit\'s Wi-Fi settings and update its firmware. Currently we support Google Chrome in Win, Mac and Linux. If this is your first time, maybe you will like to follow the <a href="http://docs.smartcitizen.me/#/start/adding-a-smart-citizen-kit" target="_blank">Startup guide</a>.</small></div><img src="assets/images/sckit_avatar_2.jpg" alt="Smartcitizen Kit"></div></div></div></section></form><section class="form_block"><div setuptool=""></div></section><form><section ng-show="vm.macAddressFieldVisible" class="form_block form_blockNormal isEven"><div layout="row" layout-align="start start"><div class="form_blockContent"><div layout="row"><div class="form_blockContent_text"><h2>Mac address</h2><small>The setup tool will read the Mac Address automatically from your kit. Plase wait or enter it manually.</small></div></div></div><div class="form_blockInput" flex=""><div class="form_blockInput_container"><md-input-container><label>Mac Address</label> <input type="text" pattern="([0-9A-Fa-f]{2}\\:){5}([0-9A-Fa-f]{2})" ng-model="vm.macAddress"></md-input-container></div></div></div></section></form><md-button ng-click="vm.submitFormAndKit()" ng-show="vm.nextAction == \'save\'" class="btn-cyan timeline_button">Save</md-button><md-progress-linear class="md-hue-3" ng-show="vm.nextAction == \'waiting\'" md-mode="indeterminate"></md-progress-linear><md-button ng-disabled="true" ng-show="vm.nextAction == \'waiting\'" class="md-primary timeline_button timeline_buttonOpen">Waiting for your kit\'s data<small>We are waiting for your kit to connect on-line, this can take a few minutes</small><small>Check the process on the report window and contact <a ng-href="mailto:support@smartcitizen.me">support@smartcitizen.me</a> if you have any problem.</small></md-button><md-button ng-click="vm.submitFormAndKit()" ng-show="vm.nextAction == \'ready\'" class="md-primary timeline_button timeline_buttonOpen inverted">Ready! <small>Go and visit your kit on-line</small></md-button></section></section></section>');
$templateCache.put('app/components/kit/newKit/newKit.html','<section class="kit_dataChange"><section class="timeline" flex="1" layout="row" layout-align="center center"><div class="timeline_container" layout="row" layout-align="space-between center"><div layout="column" layout-align="start center"><div class="timeline_stepCircle" layout="row" layout-align="center center" ng-class="{\'is-on\': vm.step === 1, \'is-off\': vm.step !== 1}">1</div><div class="timeline_stepName vertical">Kit data</div></div><div class="timeline_line"></div><div layout="column" layout-align="start center"><div class="timeline_stepCircle" layout="row" layout-align="center center" ng-class="{\'is-on\': vm.step === 2, \'is-off\': vm.step !== 2}">2</div><div class="timeline_stepName vertical">Set up</div></div></div></section><section class="timeline_content" flex="1"><section ng-show="vm.step === 1"><form><section class="form_block form_blockNormal isEven"><div layout="row" layout-align="space-around start"><div flex="30" class="form_blockContent"><div layout="row"><div class="form_blockContent_text"><h2>Basic information</h2><small>Please, provide kit basic info. That includes a name and exposure</small></div></div></div><div flex="50" class="form_blockInput"><div class="form_blockInput_container"><md-input-container><label>Kit Name</label> <input type="text" ng-model="vm.kitForm.name"><div class="form_errors"><div ng-repeat="error in vm.errors.name">Name {{ error }}</div></div></md-input-container><div layout="row" layout-align="space-between start"><div class="form_blockInput_select" layout="row" layout-align="start center"><label>Exposure:</label><md-select ng-model="vm.kitForm.exposure" placeholder="Select exposure"><md-option ng-repeat="exposure in vm.exposure" ng-value="{{ exposure.value }}">{{ exposure.name }}</md-option></md-select></div></div></div></div></div></section><section class="form_block form_blockMap"><div layout="row" layout-align="space-around start"><div flex="30" class="form_blockContent"><div layout="row"><div class="form_blockContent_text"><h2>Kit location</h2><small>Please, let us locate you, later you can adjust the location by dragging the marker on the map.</small></div></div></div><div flex="50" class="form_blockInput"><div class="form_blockInput_button" ng-if="!vm.kitForm.location.lat && !vm.kitForm.location.lng"><div class="form_blockInput_container" layout="row" layout-align="center center"><md-button class="md-flat btn-cyan" ng-click="vm.getLocation()">Get your location</md-button></div></div><div class="form_blockInput_map" ng-if="vm.kitForm.location.lat && vm.kitForm.location.lng"><leaflet center="vm.kitForm.location" defaults="vm.defaults" markers="vm.markers" tiles="vm.tiles" width="100%" height="100%"></leaflet></div></div></div></section><section class="form_block form_blockNormal isEven"><div layout="row" layout-align="space-around start"><div flex="30" class="form_blockContent"><div layout="row"><div class="form_blockContent_text"><h2>Kit tags</h2><small>Kits can be grouped by tags. Choose from the available tags or submit a tag request on the <a href="https://forum.smartcitizen.me/" target="_blank">Forum</a>.</small></div></div></div><div flex="50" class="form_blockInput"><div class="form_blockInput_container"><div><md-select ng-model="vm.tag" placeholder="Select tag"><md-option ng-value="{{ tag.id }}" ng-repeat="tag in vm.tags">{{ tag.name }}</md-option></md-select></div><div class="form_blockInput_chips"><div class="chips" layout="row" layout-align="start center"><div class="chip kit_tag" ng-repeat="tag in vm.kitForm.tags"><span class="chip_name">{{ tag.name }}</span> <button class="chip_icon" ng-click="vm.removeTag(tag.id)" arial-label=""><md-icon md-svg-src="./assets/images/close_icon_black.svg"></md-icon></button></div></div></div></div></div></div></section><section class="form_block form_blockNormal"><div layout="row" layout-align="space-around start"><div flex="30" class="form_blockContent"><div layout="row"><div class="form_blockContent_text"><h2>Kit description</h2><small>Say something nice about your kit. Why is it for? Is this part of any kind of project? Whatever :)</small></div></div></div><div flex="50" class="form_blockInput"><div class="form_blockInput_container" layout="row"><md-input-container flex="100" flex-gt-md="50"><label>Description</label> <textarea type="text" ng-model="vm.kitForm.description" placeholder="Describe your kit" md-maxlength="120"></textarea></md-input-container></div></div></div></section></form><md-button class="md-flat btn-cyan timeline_button" ng-click="vm.submitStepOne()">Next</md-button></section></section></section>');
$templateCache.put('app/components/kit/showKit/showKit.html','<section class="kit_data" change-content-margin=""><div class="shadow"></div><div class="over_map"><section class="kit_menu" stick=""><section ng-if="!vm.kit" class="overlay-kitinfo"></section><div class="container" layout="row" layout-align="space-between center"><div flex="nogrow" layout="row" layout-align="start center"><div hide="" show-gt-xs="" class="kit_user"><img ng-src="{{ vm.kit.owner.avatar || \'./assets/images/avatar.svg\'}}"> <a href="./users/{{vm.kit.owner.id}}"><span>{{ vm.kit.owner.username}}</span></a></div><div hide="" show-gt-xs="" class="kit_name"><md-icon md-svg-src="./assets/images/sensor_icon.svg" class="sensor_icon"></md-icon><span>{{ vm.kit.name }}</span></div><div ng-animate-swap="vm.battery.value" ng-class="{bat_animation: vm.prevKit}" class="kit_battery"><md-icon md-svg-src="{{ vm.battery.icon }}"></md-icon><span>{{ vm.battery.value }} {{ vm.battery.unit }}</span></div></div><div ng-animate-swap="vm.kit.time" ng-class="{time_animation: vm.prevKit}" flex="" class="kit_time"><span ng-if="vm.kit.time" hide="" show-gt-xs="">Last data received:</span><span>{{ vm.kit.timeParsed }}</span></div><div hide="" show-gt-xs="" flex="nogrow" class="kit_navbar" active-button="" layout="row" layout-align="end center"><md-button href="#" class="md-flat chart_icon" aria-label="" analytics-on="click" analytics-category="Kit Detail Section Button" analytics-event="click" analytics-label="Chart"><md-icon md-svg-src="./assets/images/chart_icon.svg"></md-icon></md-button><md-button href="#" class="md-flat kit_details_icon" aria-label="" analytics-on="click" analytics-category="Kit Detail Section Button" analytics-event="click" analytics-label="Kit"><md-icon md-svg-src="./assets/images/kit_details_icon_light.svg"></md-icon></md-button><md-button href="#" class="md-flat user_details" aria-label="" analytics-on="click" analytics-category="Kit Detail Section Button" analytics-event="click" analytics-label="User"><md-icon md-svg-src="./assets/images/user_details_icon.svg"></md-icon></md-button></div></div></section><section class="kit_fixed" move-down=""><section class="overlay" ng-if="!vm.kitID"><h2 class="title">No kit selected <span class="emoji">\uD83D\uDC46</span></h2><p>Browse the map and tap on any kit to see its data.</p></section><div no-data-backdrop=""></div><section class="kit_overview" layout="row"><md-button ng-click="vm.slide(\'right\')" class="md-flat button_scroll button_scroll_left" aria-label=""><md-icon md-svg-src="./assets/images/arrow_left_icon.svg"></md-icon></md-button><div flex="90" class="sensors_container" layout="row" layout-align="start center" horizontal-scroll=""><div ng-animate-swap="vm.sensors" ng-repeat="sensor in vm.sensors" class="sensor_container" ng-click="vm.showSensorOnChart(sensor.id)" ng-class="{selected: vm.selectedSensor === sensor.id, sensor_animation: vm.prevKit}"><md-icon md-svg-src="{{ sensor.icon }}" class="sensor_icon"></md-icon><div class="sensor_value" ng-class="{sensor_value_null: sensor.value === \'N/A\'}">{{ sensor.value }}</div><div class="sensor_right"><div class="sensor_unit">{{ sensor.unit }}</div><md-icon md-svg-src="./assets/images/{{ sensor.arrow }}_icon.svg" class="sensor_arrow {{ sensor.arrow }}"></md-icon></div><p>{{ sensor.name }}</p></div></div><md-button ng-click="vm.slide(\'left\')" class="md-flat button_scroll button_scroll_right" aria-label=""><md-icon md-svg-src="./assets/images/arrow_right_icon.svg"></md-icon></md-button></section></section></div><section class="kit_fixed"><div class="hint" ng-if="!vm.kit"><p>We can also take you to your nearest online kit by letting us know your location.</p><md-button class="btn-round btn-cyan" ng-click="vm.geolocate()">Locate me</md-button></div><section class="kit_detailed"><section class="kit_chart"><div class="hint" ng-if="vm.kitWithoutData"><p></p></div><div class="container" layout="row" layout-xs="column"><div class="kit_chart_left" flex="100" flex-gt-xs="20" layout-xs="column" layout-align-xs="end start"><div class="sensor_select"><md-icon md-svg-src="{{ vm.selectedSensorData.icon }}" class="sensor_icon_selected"></md-icon><md-select placeholder="Choose sensor" ng-model="vm.selectedSensor" analytics-on="click" analytics-category="Kit Chart" analytics-event="click" analytics-label="Metric"><md-option ng-repeat="sensor in vm.chartSensors" ng-value="{{sensor.id}}" ng-selected="$first"><img class="select_image" ng-src="{{ sensor.icon }}"> <span>{{ sensor.name }}</span></md-option></md-select></div><div class="sensor_data" show-popup-info=""><span class="sensor_value">{{ vm.selectedSensorData.value }}</span> <span class="sensor_unit">{{ vm.selectedSensorData.unit }}</span></div><div class="sensor_data_description" hide-popup-info="">This is the latest value received</div><div class="sensor_description"><h6>{{ vm.selectedSensorData.name }}</h6><div class="sensor_description_content"><small class="sensor_description_preview">{{ vm.selectedSensorData.previewDescription }}<a href="#" ng-show="vm.selectedSensorData.previewDescription.length > 140" show-popup="">More info</a></small><p class="sensor_description_full" hide-popup="">{{ vm.selectedSensorData.fullDescription }}</p></div></div><div ng-if="vm.sensorsToCompare.length >= 1" class="sensor_compare"><div><span class="float-left" style="margin-top:7px">Compare with</span><md-select placeholder="NONE" ng-model="vm.selectedSensorToCompare"><md-option ng-repeat="sensor in vm.sensorsToCompare" ng-value="{{sensor.id}}" analytics-on="click" analytics-category="Kit Chart" analytics-event="click" analytics-label="Compare"><img class="select_image" ng-src="{{ sensor.icon }}"> <span class="sensor_name">{{ sensor.name }}</span></md-option></md-select></div></div></div><div class="kit_chart_right" flex=""><div class="chart_navigation" layout="row" layout-xs="column" layout-align="end center" layout-align-xs="end end"><div class="picker_container"><md-select class="kit_timeOpts" ng-model="vm.dropDownSelection" placeholder="Last Data Received" ng-change="vm.timeOptSelected()"><md-option ng-value="opt" ng-repeat="opt in vm.timeOpt">{{ opt }}</md-option></md-select></div><div class="picker_container"><label for="picker_from">From:</label> <input type="text" id="picker_from" class="date_picker" placeholder="FROM"></div><div class="picker_container"><label for="picker_to">To:</label> <input type="text" id="picker_to" class="date_picker" placeholder="TO"></div><div class="chart_move"><md-button href="#" ng-click="vm.moveChart(\'left\')" class="chart_move_button chart_move_left" aria-label="" layout="row" layout-align="center center"><md-icon md-svg-src="./assets/images/arrow_left_icon.svg"></md-icon></md-button><md-button href="#" ng-click="vm.moveChart(\'right\')" class="chart_move_button chart_move_right" aria-label="" layout="row" layout-align="center center"><md-icon md-svg-src="./assets/images/arrow_right_icon.svg"></md-icon></md-button></div></div><md-progress-circular ng-show="vm.loadingChart && !vm.kitWithoutData" class="md-hue-3 chart_spinner" md-mode="indeterminate"></md-progress-circular><div chart="" class="chart_container" chart-data="vm.chartDataMain"></div></div></div></section><section class="kit_details" ng-if="vm.kit"><div class="kit_detailed_content_container" layout="row" layout-xs="column" layout-align="space-around end"><div class="kit_details_content_main" flex=""><div class="kit_details_content"><h1 class="kit_details_name">{{ vm.kit.name }}</h1><p class="kit_details_location"><md-icon class="icon_label" md-svg-src="./assets/images/location_icon_normal.svg"></md-icon><span class="md-title">{{ vm.kit.location || \'No location\' }}</span></p><p class="kit_details_type"><md-icon class="icon_label" md-svg-src="./assets/images/kit_details_icon_normal.svg"></md-icon><span class="md-title">{{ vm.kit.typeDescription }}</span></p><p class="description" ng-bind-html="vm.kit.description | linky:\'_blank\'"></p><p class="kit_details_labels"><span style="padding:4px 8px" class="label" ng-repeat="label in vm.kit.labels">{{ label }}</span><tag style="padding:4px 8px" ng-repeat="tag in vm.kit.userTags" ng-attr-tag-name="tag" clickable=""></tag></p></div></div><div flex="30" class="kit_details_manage" ng-if="vm.kitBelongsToUser"><div class="kit_details_manage_buttons"><md-button style="font-size:18px" ui-sref="layout.kitEdit({id: vm.kit.id})" class="color-cyan" aria-label="">EDIT</md-button><md-button style="font-size:18px" ng-if="vm.kit.setupAvailable" ui-sref="layout.kitEdit({step: 2, id: vm.kit.id})" class="" aria-label="">SET UP</md-button><md-button style="font-size:18px" ng-if="vm.kit.version" ui-sref="layout.kitUpload({id: vm.kit.id})" class="" aria-label="">CSV UPLOAD</md-button><md-button style="font-size:18px" ng-click="vm.removeKit()" class="warn md-subhead" aria-label="">DELETE</md-button></div><div class="kit_details_manage_data"><div class="kit_details_macaddress data_container"><md-icon class="kit_detailed_icon_content" md-svg-src="./assets/images/kit_details_icon_normal.svg"></md-icon><span class="bold">Device:</span> <span>{{ vm.kit.id }}</span></div><div ng-show="vm.kit.macAddress" class="kit_details_macaddress data_container"><md-icon class="kit_detailed_icon_content" md-svg-src="./assets/images/mac_address_icon.svg"></md-icon><span class="bold">Mac Address:</span> <span>{{ vm.kit.macAddress }}</span></div><div class="data_container"><md-icon class="kit_detailed_icon_content" md-svg-src="./assets/images/debug_icon.svg"></md-icon><span class="bold">Status:</span> <span class="kitList_state kitList_state_{{ vm.kit.state.className }} state">{{ vm.kit.state.name }}</span></div><div class="clearfix"></div><md-button class="kit_details_download data_container color-cyan" ng-click="vm.downloadData(vm.kit)"><md-icon class="kit_detailed_icon_content" md-svg-src="./assets/images/download_icon.svg" ng-click="vm.downloadData(vm.kit)"></md-icon><span class="bold md-subhead">Download Data</span></md-button></div></div><section flex="" class="info kit_details_notAuth" ng-if="!vm.kitBelongsToUser"><h1>People looking for a better city</h1><p>Smart Citizen is a a platform to generate participatory processes of the people in the cities. Connecting data, people and knowledge, the objective of the platform is to serve as a node for building productive open indicators and distributed tools, and thereafter the collective construction of the city for its own inhabitants.</p><md-button class="btn-blue" ng-click="vm.showStore()">GET YOUR KIT AND JOIN US</md-button></section></div></section><section class="kit_owner" ng-if="vm.kit"><div class="kit_detailed_content_container" layout="row" layout-xs="column"><div class="kit_detailed_avatar"><img ng-src="{{ vm.kit.owner.avatar || \'./assets/images/avatar.svg\' }}"></div><div class="kit_owner_content" flex="100"><div class="kit_owner_info"><a href="./users/{{vm.kit.owner.id}}" class="kit_owner_usernameLink"><h2 class="kit_owner_usernameText">{{ vm.kit.owner.username }}</h2></a><p><md-icon class="kit_detailed_icon_content" md-svg-src="./assets/images/location_icon_normal.svg"></md-icon><span class="md-title"><span ng-if="vm.kit.owner.city">{{ vm.kit.owner.city }}</span> <span ng-if="vm.kit.owner.city && vm.kit.owner.country">,</span> <span ng-if="vm.kit.owner.country">{{ vm.kit.owner.country }}</span> <span ng-if="!vm.kit.owner.city && !vm.kit.owner.country">No location</span></span></p><p ng-if="vm.kit.owner.url"><md-icon class="kit_detailed_icon_content" md-svg-src="./assets/images/url_icon_normal.svg"></md-icon><span class="md-title" ng-bind-html="vm.kit.owner.url | linky:\'_blank\'">{{ vm.kit.owner.url || \'No URL\'}}</span></p></div><section class="kit_owner_kits inside_list" ng-if="vm.sampleKits.length > 0"><h1>Other kits owned by {{ vm.kit.owner.username }}</h1><kit-list kits="vm.sampleKits"></kit-list><md-button ng-href="/users/{{ vm.kit.owner.id }}" ng-if="vm.kit.owner.kits.length > 5" class="kit_owner_kits_more_button" aria-label="">VIEW ALL KITS BY {{ vm.kit.owner.username }}</md-button></section></div></div><div class="clearfix"></div></section></section></section></section>');
$templateCache.put('app/core/animation/backdrop/loadingBackdrop.html','<md-content ng-if="vm.isViewLoading || vm.mapStateLoading" ng-class="{\'md-mainBackdrop\': vm.isViewLoading, \'md-stateChangeBackdrop\': vm.mapStateLoading}"><md-icon ng-if="vm.isViewLoading" md-svg-src="./assets/images/LogotipoSmartCitizen.svg" class="backdrop_icon"></md-icon></md-content>');
$templateCache.put('app/core/animation/backdrop/noDataBackdrop.html','<md-backdrop ng-if="vm.kitWithoutData" class="md-noDataBackdrop"><div class="block info_overlay" layout="column" layout-align="center center"><div ng-if="vm.user === \'visitor\'"><h2 class="title">This kit hasn\u2019t still said a word \uD83D\uDC76</h2><p></p></div><div ng-if="vm.user === \'owner\'" class="static_page"><h2 class="title">Your kit has still not posted any data \uD83D\uDD27\uD83D\uDD29\uD83D\uDD28</h2></div></div></md-backdrop>');}]);