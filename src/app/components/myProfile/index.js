import angular from 'angular';

import myProfileController from './myProfile.controller';

export default angular.module('app.component.myProfile',[])
.controller('myProfileController', myProfileController)
.name;
