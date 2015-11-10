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
