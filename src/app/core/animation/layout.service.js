    export default function layout() {

      var kitHeight;

      var service = {
        setKit: setKit,
        getKit: getKit
      };
      return service;

      function setKit(height) {
        kitHeight = height;
      }

      function getKit() {
        return kitHeight;
      }
    }
