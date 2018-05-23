


    .factory('animation', animation);

    /**
     * Used to emit events from rootscope.
     *
     * This events are then listened by $scope on controllers and directives that care about that particular event
     */

    animation.$inject = ['$rootScope'];
    export default function animation($rootScope) {

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
