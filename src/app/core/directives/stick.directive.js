'use strict';


  angular.module('app.core')
    .directive('stickNav', stickNav)
    .directive('stickMenu', stickMenu);


  function stickNav($window) {
    
    function link(scope, element, attrs) {
      var elementPosition = element[0].offsetTop;
      var elementHeight = element[0].offsetHeight;

      angular.element($window).on('scroll', function() {
        var windowPosition = document.body.scrollTop;
        if(windowPosition >= elementPosition + elementHeight) {
          element.addClass('stickNav');
        } else {
          element.removeClass('stickNav');
        }
      });
    }

    return {
      link: link,
      scope: false,
      restrict: 'A'
    };
  }


  function stickMenu($window) {
    function link(scope, element, attrs) {
      var elementPosition = element[0].offsetTop;
      var elementHeight = element[0].offsetHeight;
      
      var navbarHeight = 64;

      angular.element($window).on('scroll', function() {
        var windowPosition = document.body.scrollTop;
        if(windowPosition + navbarHeight >= elementPosition + elementHeight) {
          element.addClass('stickMenu');
        } else {
          element.removeClass('stickMenu');
        }
      });
    }

    return {
      link: link,
      scope: false,
      restrict: 'A'
    };
  }