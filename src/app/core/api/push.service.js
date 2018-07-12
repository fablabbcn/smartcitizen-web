(function() {
	'use strict';

	angular.module('app.components')
	  .factory('push', push);

	  function push() {
      var socket;

      init();

      var service = {
        devices: devices,
        device: device
      };

      function init(){
        socket = io.connect('wss://ws.smartcitizen');
      }

      function devices(then){
        socket.on('data-received', then);
      }

      function device(id, scope){
        devices(function(data){
          if(id === data.device_id) {
            scope.$emit('published', data);
          }
        });
      }

      return service;
	  }

})();
