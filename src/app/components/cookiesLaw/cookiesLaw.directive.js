(function(){
'use strict';

angular.module('app.components')
  .directive('cookiesLaw', cookiesLaw);


cookiesLaw.$inject = ['$cookies'];

function cookiesLaw($cookies) {
  return {
    template:
      '<div class="cookies-policy_container" ng-hide="isCookieValid()">' +
      'This site uses cookies to offer you a better experience.  ' +
      ' <a href="" ng-click="acceptCookie(true)">Accept</a> or' +
      ' <a ui-sref="layout.policy">Learn More.</a> ' +
      '</div>',
    controller: function($scope) {

      // Helpers to debug
      //$cookies.remove('consent');
      //$cookies.remove('expires');
      console.log($cookies.getAll());

      $scope.isCookieValid = function() {
        return ($cookies.get('consent') === 'true') && ($scope.isCookieAlive())
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
        console.log('all after accepting:', $cookies.getAll());
      };

    }
  };
}


})();
