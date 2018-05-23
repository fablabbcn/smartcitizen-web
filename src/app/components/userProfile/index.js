import angular from 'angular';

import userProfileController from './userProfile.controller';

export default angular.module('app.component.userProfile',[])
.controller('userProfileController', userProfileController)
.name;
