import angular from 'angular';

import alertController from './alert.controller';

import alert from './alert.service';

export default angular.module('app.component.alert',[])
.service('alert', alert)
.controller('alertController', alertController)
.name;
