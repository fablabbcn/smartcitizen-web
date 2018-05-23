




  /**
   * Used to highlight and unhighlight buttons on the kit dashboard when scrolling horizontally
   *
   */
  horizontalScroll.$inject = ['$window', '$timeout'];
  export default function horizontalScroll($window, $timeout) {
    return {
      link: link,
      restrict: 'A'
    };

    ///////////////////


    function link(scope, element) {

      element.on('scroll', function() {
        // horizontal scroll position
        var position = angular.element(this).scrollLeft();
        // real width of element
        var scrollWidth = this.scrollWidth;
        // visible width of element
        var width = angular.element(this).width();

        // if you cannot scroll, unhighlight both
        if(scrollWidth === width) {
          angular.element('.button_scroll_left').css('opacity', '0.5');
          angular.element('.button_scroll_right').css('opacity', '0.5');
        }
        // if scroll is in the middle, highlight both
        if(scrollWidth - width > 2) {
          angular.element('.button_scroll_left').css('opacity', '1');
          angular.element('.button_scroll_right').css('opacity', '1');
        }
        // if scroll is at the far right, unhighligh right button
        if(scrollWidth - width - position <= 2) {
          angular.element('.button_scroll_right').css('opacity', '0.5');
          return;
        }
        // if scroll is at the far left, unhighligh left button
        if(position === 0) {
          angular.element('.button_scroll_left').css('opacity', '0.5');
          return;
        }

        //set opacity back to normal otherwise
        angular.element('.button_scroll_left').css('opacity', '1');
        angular.element('.button_scroll_right').css('opacity', '1');
      });

      $timeout(function() {
        element.trigger('scroll');
      });

      angular.element($window).on('resize', function() {
        $timeout(function() {
          element.trigger('scroll');
        }, 1000);
      });
    }
  }
