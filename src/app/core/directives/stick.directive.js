'use strict';


  angular.module('app.core')
    .directive('slideDown', slideDown)
    .directive('stick', stick);


  function slideDown($window) {
    
    function link(scope, element, attrs) {
      var elementPosition = element[0].offsetTop;
      var elementHeight = element[0].offsetHeight;


      angular.element($window).on('scroll', function() {
        var windowPosition = document.body.scrollTop;
        var stickPosition = windowPosition + 64;

        if(windowPosition >= elementPosition) {
          element.css('position', 'relative');
          element.css('top', stickPosition + 'px');
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