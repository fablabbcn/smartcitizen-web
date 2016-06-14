(function() {
  'use strict';

  angular.module('app.components')
    .controller('EditKitController', EditKitController);

    EditKitController.$inject = ['$scope', '$location', '$timeout', '$state',
    'animation', 'device', 'tag', 'alert', 'step', '$stateParams', 'FullKit'];
    function EditKitController($scope, $location, $timeout, $state, animation,
     device, tag, alert, step, $stateParams, FullKit) {

      var vm = this;
      // This will need to be claned up at a certain point
      var timewait = 3000;

      vm.step = step;

      vm.submitForm = submitForm;
      vm.openKitSetup = openKitSetup;

      vm.kitData = undefined;

      // EXPOSURE SELECT
      vm.exposure = [
        {name: 'indoor', value: 1},
        {name: 'outdoor', value: 2}
      ];

      // FORM INFO
      vm.kitForm = {};

      vm.backToProfile = backToProfile;

      // TAGS SELECT
      vm.tags = [];
      $scope.$watch('vm.tag', function(newVal) {
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
        vm.kitForm.tags.push(tag.name);
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
              exposure: (vm.kitData.labels.indexOf('indoor') >= 0 ||
                vm.kitData.labels.indexOf('outdoor') >= 0 ) &&
              ( findExposure(vm.kitData.labels.indexOf('indoor') ?
                'indoor' : 'outdoor') ),
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
            vm.macAddress = vm.kitData.macAddress;
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

      function removeTag(tagID) {
        vm.kitForm.tags = _.filter(vm.kitForm.tags, function(tag) {
          return tag.id !== tagID;
        });
      }

      function submitForm() {
        var data = {
          name: vm.kitForm.name,
          description: vm.kitForm.description,
          exposure: findExposure(vm.kitForm.exposure),
          latitude: vm.kitForm.location.lat,
          longitude: vm.kitForm.location.lng,
          /*jshint camelcase: false */
          user_tags: vm.kitForm.tags.join(',')
        };

        if(!vm.macAddress || vm.macAddress == ""){
          data.mac_address = null;
        } else if(/([0-9A-Fa-f]{2}\:){5}([0-9A-Fa-f]{2})/.test(vm.macAddress)){
          /*jshint camelcase: false */
          data.mac_address = vm.macAddress;
        } else {
          /*jshint camelcase: false */
          var message = 'The mac address you entered is not a valid address'
          alert.error(message);
          data.mac_address = null;
          throw new Error("[Client:error] " + message);
        }

        device.updateDevice(vm.kitData.id, data)
          .then(
            function() {
              alert.success('Your kit was successfully updated');
              ga('send', 'event', 'Kit', 'update');
              device.updateContext().then(function(){
                backToProfile();
              });
            })
            .catch(function(err) {
              if(err.data.errors.mac_address[0] === "has already been taken") {
                timewait = 5000;
                alert.error('You are trying to register a kit that is already registered. Please, read <a href="http://docs.smartcitizen.me/#/start/how-do-i-register-again-my-sck">How do I register again my SCK?</a> or contact <a href="mailto:support@smartcitizen.me ">support@smartcitizen.me</a> for any questions.');
                ga('send', 'event', 'Kit', 'unprocessable entity');
              }
              else {
                timewait=4000;
                alert.error('There has been an error during kit set up');
                ga('send', 'event', 'Kit', 'update failed');
              }
              $timeout(function(){ },timewait);
            });
      }

      function openKitSetup() {
        $location.path($location.path()).search({'step':2});
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
    }
})();
