(function() {
    'use strict';

    /**
     * Country codes.
     * @constant
     * @type {Object}
     */

    angular.module('app.components')
      .constant('URLS', {
        // Change for testing purposes
        'base': 'https://api.smartcitizen.me/ui',
        'map': 'https://smartcitizen.me/kits',
        'map:id': 'https://smartcitizen.me/kits/:id',
        'seeed': 'https://www.seeedstudio.com/Smart-Citizen2-3-p-6327.html',
        'labmaker': 'https://www.labmaker.org/collections/earth-and-ecology/products/smart-citizen-kit',
        'login': '/sessions/new',
        'logout': '/sessions/destroy',
        'users': '/users',
        'newUsers': '/users/new',
        'users:id': '/users/:id',
        'users:username': '/users/:username',
        'devices:id': '/devices/:id',
        'devices:id:edit': '/devices/:id/edit',
        'devices:id:download': '/devices/:id/download',
        'devices:id:upload': '/devices/:id/upload',
        'devices:id:delete': '/devices/:id/delete',
        'goto': '?goto=:url'
    });
  })();
