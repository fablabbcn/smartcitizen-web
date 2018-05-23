import angular from 'angular';

import apiKeyController from './apiKey.controller';

import apiKey from './apiKey.directive';

export default angular.module('app.component.apiKey',[])
.directive('apiKey', apiKey)
.controller('apiKeyController', apiKeyController)
.name;
