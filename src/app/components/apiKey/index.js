import angular from 'angular';

import apiKeyController from 'apiKey.controller';

export default angular.module('apiKey',[])
.controller('apiKeyController', apiKeyController)
.name;
