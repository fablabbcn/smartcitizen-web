  errorDecorator.$inject = ['$provide'];
  export default function errorDecorator ($provide) {

        var airbrake = new airbrakeJs.Client();

        airbrake.setProject('561ce288daa9031312000008', '791ff4af9dda4841b5ebd594ecad961e');
        airbrake.setHost('https://errors.smartcitizen.me');

        $provide.decorator('$exceptionHandler', ['$delegate', function($delegate) {
          return function (exception, cause) {
            /*jshint camelcase: false */
            exception.params = { angular_cause: cause };
            airbrake.notify(exception);
            $delegate(exception, cause);
          };
        }]);

    };
