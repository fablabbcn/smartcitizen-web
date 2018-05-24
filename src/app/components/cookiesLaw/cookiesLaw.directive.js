





cookiesLaw.$inject = ['$cookies'];

export default function cookiesLaw($cookies) {
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
