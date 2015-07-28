(function() {
  'use strict';

  angular.module('app.components')
    .directive('disableScroll', disableScroll);

    disableScroll.$inject = [];
    function disableScroll() {
      return {
        // link: {
          // pre: link
        // },
        compile: link,
        restrict: 'A',
        priority: 100000
      };


      //////////////////////

      function link(elem) {
        console.log('i', elem);
        // var select = elem.find('md-select'); 
        // angular.element(select).on('click', function() {
        elem.on('click', function() {
          console.log('e'); 
          angular.element(document.body).css('overflow', 'hidden');
          setTimeout(function() {
            angular.element(document.body).css('overflow', 'initial'); 
          })
        });
      }
    }
})();
