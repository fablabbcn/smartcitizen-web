import angular from 'angular';

import tagsController from './tags.controller';

import tag from './tag.directive';

export default angular.module('app.component.tags',[])
.directive('tag', tag)
.controller('tagsController', tagsController)
