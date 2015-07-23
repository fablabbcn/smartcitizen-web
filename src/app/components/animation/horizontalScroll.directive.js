(function() {
  'use strict';

  angular.module('app.components')
    .directive('horizontalScroll', horizontalScroll);

  horizontalScroll.$inject = ['$window'];
  function horizontalScroll($window ) {
    return {
      link: link,
      restrict: 'A'
    };

    ///////////////////


    function link(scope, element) {

      element.on('scroll', function() {
        var position = angular.element(this).scrollLeft();

        var scrollWidth = this.scrollWidth;
        var width = angular.element(this).width();

        if(scrollWidth - width > 2) {
          angular.element('.button_scroll_left').css('opacity', '1');          
          angular.element('.button_scroll_right').css('opacity', '1');
        }
        if(scrollWidth - width <= position) {
          //unhighlight right button
          angular.element('.button_scroll_right').css('opacity', '0.5');
        }

        if(position === 0) { 
          //unhighlight left button
          angular.element('.button_scroll_left').css('opacity', '0.5');
          return;
        } 

        //set opacity back to normal
        angular.element('.button_scroll_left').css('opacity', '1');
        angular.element('.button_scroll_right').css('opacity', '1');
      });

      setTimeout(function() {
        element.trigger('scroll');        
      });

      angular.element($window).on('resize', function() {
        setTimeout(function() {
          element.trigger('scroll');
        }, 1000);
      });
    }
  }
})();
