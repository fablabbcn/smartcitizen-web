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

    EditKitController.$inject = ['$scope', '$window', '$location', '$stateParams', 'URLS', 'AuthUser', 'urlUtils', 'user'];
    function EditKitController($scope,  $window, $location, $stateParams, URLS, AuthUser, urlUtils, user) {

      var ui_base_url = URLS['base'];
      var device_edit_path = URLS['devices:id:edit'];

      var vm = this;
      vm.device_id = $stateParams.id;

      $window.location.href = ui_base_url + urlUtils.get_path(device_edit_path, ":id" , vm.device_id);
    }
})();
