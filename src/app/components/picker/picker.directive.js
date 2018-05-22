import angular from 'angular';

  angular.module('app.components')
    .directive('picker', picker);


    picker.$inject = [];
    function picker() {
      return {
        restrict: 'A',
        link: link,
        controller: controller,
        controllerAs: 'vm'
      };

      function controller($scope) {
        console.log('sc', $scope);
      }

      function link(scope, elemenet, attrs) {

        function getSecondsFromDate(date) {
          return (new Date(date)).getTime();
        }

        function getCurrentRange() {
          return getSecondsFromDate( picker.getValuePickerTo() ) - getSecondsFromDate( picker.getValuePickerFrom() );
        }
        
        console.log('vm l', scope);
        var updateType = 'single'; //set update type to single by default 

        /*jshint camelcase: false*/
        var from_$input = angular.element('#picker_from').pickadate({
          onClose: function(){
            angular.element(document.activeElement).blur();
          },
          container: 'body',
          klass: {
            holder: 'picker__holder picker_container'
          }
        });
        var from_picker = from_$input.pickadate('picker');

        var to_$input = angular.element('#picker_to').pickadate({
          onClose: function(){
            angular.element(document.activeElement).blur();
          },
          container: 'body',
          klass: {
            holder: 'picker__holder picker_container'
          }
        });
        var to_picker = to_$input.pickadate('picker');

        if( from_picker.get('value') ) {
          to_picker.set('min', from_picker.get('select') );
        } 
        if( to_picker.get('value') ) {
          from_picker.set('max', to_picker.get('select') );
        }

        from_picker.on('set', function(event) {
          if(event.select) {
            if(to_picker.get('value') && updateType === 'single') {
              var sensors = [mainSensorID, compareSensorID];
              sensors = sensors.filter(function(sensor) {
                return sensor;
              }); 
              changeChart(sensors, {from: from_picker.get('value'), to: to_picker.get('value') });                                          
            }
            to_picker.set('min', from_picker.get('select') );
          } else if( 'clear' in event) {
            to_picker.set('min', false);
          }
        });

        to_picker.on('set', function(event) {
          if(event.select) {  
            if(from_picker.get('value')) {
              var sensors = [mainSensorID, compareSensorID];
              sensors = sensors.filter(function(sensor) {
                return sensor;
              }); 
              changeChart(sensors, {from: from_picker.get('value'), to: to_picker.get('value') });                             
            }          
            from_picker.set('max', to_picker.get('select'));
          } else if( 'clear' in event) {
            from_picker.set('max', false);
          }
        });

        //set to-picker max to today
        to_picker.set('max', new Date());

        function getToday() {
          return getSecondsFromDate(new Date());
        }

        function getSevenDaysAgo() {
          return getSecondsFromDate( getToday() - (7 * 24 * 60 * 60 * 1000) );
        }

        //set from-picker to seven days ago
        from_picker.set('select', getSevenDaysAgo());
        //set to-picker to today
        to_picker.set('select', getToday());

        var api = {
          getValuePickerFrom: function() {
            return from_picker.get('value');
          },
          setValuePickerFrom: function(newValue) {
            updateType = 'single';
            from_picker.set('select', newValue);
          },
          getValuePickerTo: function() {
            return to_picker.get('value');
          },
          setValuePickerTo: function(newValue) {
            updateType = 'single';
            to_picker.set('select', newValue);
          },
          setValuePickers: function(newValues) {
            var from = newValues[0];
            var to = newValues[1];

            updateType = 'pair'; 
            from_picker.set('select', from);
            to_picker.set('select', to);
          }
        };

        _.extend($scope, api);
      }
    }

