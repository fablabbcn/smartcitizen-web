import angular from 'angular';

import myProfileController from './myProfile.controller';

export default angular.module('myProfile',[])
.controller('myProfileController', myProfileController)
.name;
