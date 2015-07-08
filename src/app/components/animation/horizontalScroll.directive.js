(function() {
  'use strict';

  angular.module('app.components')
    .directive('horizontalScroll', horizontalScroll);

  horizontalScroll.$inject = [];
  function horizontalScroll() {
    return {
      link: link,
      restrict: 'A'
    };

    ///////////////////


    function link(scope, element) {

      element.on('scroll', function() {
        var position = angular.element(this).scrollLeft();

        if(position === 0) { 
          //unhighlight left button
          angular.element('.button_scroll_left').css('opacity', '0.5');
          return;
        } 

        var totalWidth = this.scrollWidth;
        var width = angular.element(this).width();
        if(totalWidth - width === position) {
          //unhighlight right button
          angular.element('.button_scroll_right').css('opacity', '0.5');
          return;
        }
        //set opacity back to normal
        angular.element('.button_scroll_left').css('opacity', '1');
        angular.element('.button_scroll_right').css('opacity', '1');
      });
    }
  }
})();
