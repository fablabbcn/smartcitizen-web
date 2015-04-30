'use strict';


  angular.module('app.core')
    .directive('moveDown', moveDown)
    .directive('stick', stick)
    .directive('blur', blur);


  function moveDown() {
    
    function link(scope, element, attrs) {
      scope.$watch('moveDown', function(isTrue) {
        if(isTrue) {
          element.css('transform', 'translateY(35px)');
        } else {
          element.css('transform', 'translateY(0px)');
        }
      });
    }

    return {
      link: link,
      scope: false,
      restrict: 'A'
    };
  }


  function stick($window) {

    function link(scope, element, attrs) {
      var elementPosition = element[0].offsetTop;
      var elementHeight = element[0].offsetHeight;
      
      var navbarHeight = 64;

      angular.element($window).on('scroll', function() {
        var windowPosition = document.body.scrollTop;
        if(windowPosition + navbarHeight >= elementPosition) {
          element.addClass('stickMenu');
          scope.$apply(function() {
            scope.moveDown = true;
          });
        } else {
          element.removeClass('stickMenu');
          scope.$apply(function() {
            scope.moveDown = false;
          });
        }
      });
    }

    return {
      link: link,
      scope: false,
      restrict: 'A'
    };
  }

  function blur() {
    
    function link(scope, element, attrs) {
      console.log('scope', scope);
      scope.$watch('blur', function(isTrue) {
        console.log('this', isTrue);
        if(isTrue) {
          element.addClass('blur');
        } else {
          element.removeClass('blur');
        }
      });
    }

    return {
      link: link,
      scope: false,
      restrict: 'A'
    }
  }