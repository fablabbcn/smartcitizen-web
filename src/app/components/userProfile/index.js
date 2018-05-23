import angular from 'angular';

import userProfileController from './userProfile.controller';

export default angular.module('userProfile',[])
.controller('userProfileController', userProfileController)
.name;
