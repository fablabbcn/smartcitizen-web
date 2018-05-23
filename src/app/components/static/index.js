import angular from 'angular';

import staticController from './static.controller';

export default angular.module('app.component.static',[])
.controller('staticController', staticController)
.name;
