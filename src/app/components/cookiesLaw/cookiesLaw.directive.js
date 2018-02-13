(function(){
'use strict';

angular.module('app.components')
  .directive('cookiesLaw', cookiesLaw);


cookiesLaw.$inject = ['$cookies', '$document'];

function cookiesLaw($cookies, $document) {
  return {
    template:
      '<div class="cookies-policy_container" ng-hide="consent()">' +
      'This site uses cookies to offer you a better experience.  ' +
      ' <a href="" ng-click="consent(true)">Accept</a> or' +
      ' <a ui-sref="layout.policy">Learn More.</a> ' +
      '</div>',
    controller: function($scope) {
      var _consent = $cookies.get('consent');

      if ($cookies.get('expires') < (new Date).getTime()) {
        //console.log('Cookie has expired!');
        $cookies.remove('consent');
      }else{
        //console.log('Cookie expires could be OK or just undefined');
        // Uncomment this to force delete the cookie
        //$cookies.remove('consent');
      }

      //console.log('all:', $cookies.getAll());

      $scope.consent = function(consent) {
        if (consent === undefined) {
          return _consent;
        } else if (consent) {
          //console.log('Accepting cookie...');
          var d = new Date();
          d.setTime(d.getTime() + (30 * 24 * 60 * 60 *1000));
          var expires = 'expires=' + d.toUTCString();
          $cookies.put('expires', d.getTime());
          $cookies.put('consent', true);
          _consent = true;
          console.log('all after accepting:', $cookies.getAll());
        }
      };
    }
  };
}


})();
