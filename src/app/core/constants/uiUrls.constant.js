(function() {
    'use strict';

    /**
     * Country codes.
     * @constant
     * @type {Object}
     */

    angular.module('app.components')
      .constant('URLS', {
        // TODO Change
        'base': 'https://api.smartcitizen.me/ui',
        'seeed': 'https://www.seeedstudio.com/Smart-Citizen2-3-p-6327.html',
        'login': '/sessions/new',
        'logout': '/sessions/destroy',
        'users': '/users',
        'newUsers': '/users/new',
        'users:username': '/users/:username',
        'devices:id:edit': '/devices/:id/edit',
        'devices:id:download': '/devices/:id/download',
        'devices:id:upload': '/devices/:id/upload',
        'devices:id:delete': '/devices/:id/delete',
        'goto': '?goto=:url'
    });
  })();
