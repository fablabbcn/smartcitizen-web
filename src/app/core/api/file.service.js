(function() {
  'use strict';

  angular.module('app.components')
    .factory('file', file);

    file.$inject = ['Restangular', 'Upload'];
    function file(Restangular, Upload) {
      var service = {
        getCredentials: getCredentials,
        uploadFile: uploadFile,
        getImageURL: getImageURL
      };
      return service;

      ///////////////

      function getCredentials(filename) {
        var data = {
          filename: filename
        };
        return Restangular.all('me/avatar').post(data);
      }

      function uploadFile(fileData, key, policy, signature) {
        return Upload.upload({
          url: 'https://smartcitizen.s3-eu-west-1.amazonaws.com',
          method: 'POST',
          data: {
            key: key,
            policy: policy,
            signature: signature,
            AWSAccessKeyId: 'AKIAJ753OQI6JPSDCPHA',
            acl: 'public-read',
            "Content-Type": fileData.type || 'application/octet-stream',
            /*jshint camelcase: false */
            success_action_status: 200,
            file: fileData
          }
        });
      }

      function getImageURL(filename, size) {
        size = size === undefined ? 's101' : size;

        return 'https://images.smartcitizen.me/' + size + '/' + filename;
      }
    }
})();
