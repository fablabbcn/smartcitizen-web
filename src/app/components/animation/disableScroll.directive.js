(function() {
  'use strict';

  angular.module('app.components')
    .directive('disableScroll', disableScroll);

    disableScroll.$inject = ['$timeout'];
    function disableScroll($timeout) {
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
          $timeout(function() {
            angular.element(document.body).css('overflow', 'initial'); 
          });
        });
      }
    }
})();
