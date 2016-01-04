(function() {
  'use strict';

  /**
   * Tools links for user profile
   * @constant
   * @type {Array}
   */

  angular.module('app.components')
    .constant('PROFILE_TOOLS', [{
      type: 'documentation',
      title: 'How to connect your Smart Citizen Kit tutorial',
      description: 'Adding a Smart Citizen Kit tutorial',
      avatar: '',
      href: 'http://docs.smartcitizen.me/#/start/adding-a-smart-citizen-kit'
    }, {
      type: 'documentation',
      title: 'Download the latest SCK Firmware',
      description: 'The latest Arduino firmware for yout kit',
      avatar: '',
      href: 'https://github.com/fablabbcn/Smart-Citizen-Kit/releases/latest'
    }, {
      type: 'documentation',
      title: 'RESTful API Documentation',
      description: 'Documentation for the new API',
      avatar: '',
      href: 'http://new-apidocs.smartcitizen.me/'
    }, {
      type: 'documentation',
      title: 'Style Guide',
      description: 'Guidelines of the Smart Citizen UI',
      avatar: '',
      href: '/styleguide'
    }, {
      type: 'community',
      title: 'Smart Citizen Forum',
      description: 'Join the community discussion. Your feedback is important for us.',
      avatar: '',
      href:'http://forum.smartcitizen.me/'
    }, {
      type: 'documentation',
      title: 'SCK Repository Documentation',
      description: 'Fork the project',
      avatar: ''
    }, {
      type: 'social',
      title: 'Like us on Facebook',
      description: 'Join the community on Facebook',
      avatar: '',
      href: 'https://www.facebook.com/smartcitizenBCN'
    }, {
      type: 'social',
      title: 'Follow us on Twitter',
      description: 'Follow our news on Twitter',
      avatar: '',
      href: 'https://twitter.com/SmartCitizenKit'
    }]);
})();
