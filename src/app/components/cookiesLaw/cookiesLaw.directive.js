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
