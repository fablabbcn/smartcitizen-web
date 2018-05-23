

  
    

    PasswordRecoveryDialogController.$inject = ['$scope', 'animation', '$mdDialog', 'auth', 'alert'];
    export default function $1Controller($scope, animation, $mdDialog, auth, alert) {

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

