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
      description: 'Adding a Smart Citizen Kit',
      avatar: '',
      href: 'http://www.google.com'
    }, {
      type: 'documentation',
      title: 'Download the latest SCK Firmware',
      description: 'Github version of the firmware',
      avatar: ''
    }, {
      type: 'documentation',
      title: 'RESTful API Documentation',
      description: 'API Docs',
      avatar: ''
    }, {
      type: 'documentation',
      title: 'Style Guide',
      description: 'Guidelines of the Smart Citizen UI',
      avatar: '',
      href: '/styleguide'
    }, {
      type: 'community',
      title: 'Smart Citizen Forum',
      description: 'Your feedback is important for us',
      avatar: ''
    }, {
      type: 'documentation',
      title: 'SCK Repository Documentation',
      description: 'Fork the project',
      avatar: ''
    }, {
      type: 'social',
      title: 'Like us on Facebook',
      description: 'Follow our news on Facebook',
      avatar: ''
    }, {
      type: 'social',
      title: 'Follow us on Twitter',
      description: 'Discover the weather and your smart connections on Twitter',
      avatar: ''
    }, {
      type: 'social',
      title: 'Be our friend on Google+',
      description: 'Get informed about latest news of Smart Citizen',
      avatar: ''
    }]);
})();