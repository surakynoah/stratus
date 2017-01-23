//     Stratus.Components.Base.js 1.0

//     Copyright (c) 2016 by Sitetheory, All Rights Reserved
//
//     All information contained herein is, and remains the
//     property of Sitetheory and its suppliers, if any.
//     The intellectual and technical concepts contained herein
//     are proprietary to Sitetheory and its suppliers and may be
//     covered by U.S. and Foreign Patents, patents in process,
//     and are protected by trade secret or copyright law.
//     Dissemination of this information or reproduction of this
//     material is strictly forbidden unless prior written
//     permission is obtained from Sitetheory.
//
//     For full details and documentation:
//     http://docs.sitetheory.io

// Stratus Base Component
// ----------------------

// Define AMD, Require.js, or Contextual Scope
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['stratus', 'underscore', 'angular', 'angular-material', 'stratus.services.collection'], factory);
    } else {
        factory(root.Stratus, root._);
    }
}(this, function (Stratus, _) {
    // This component intends to allow editing of various permissions depending on context.
    Stratus.Components.Permission = {
        bindings: {
            elementId: '@',
            ngModel: '=',
            user: '@',
            role: '@',
            bundle: '@',
            type: '@',
            target: '@',
            sentinel: '@'
        },
        controller: function ($scope, $attrs, $log, collection) {
            // Initialize
            this.uid = _.uniqueId('permission_');
            Stratus.Instances[this.uid] = $scope;
            $scope.elementId = $attrs.elementId || this.uid;

            // Permission Collection
            $scope.collection = null;
            $scope.$watch('$ctrl.ngModel', function (data) {
                if (data instanceof collection) {
                    $scope.collection = data;
                }
            });

            // Sentinel Objects
            $scope.sentinel = {};
            $scope.$watch('collection.models', function (models) {
                _.each(models, function (model) {
                    if (model.exists('id') && model.exists('sentinel')) {
                        var sentinel = new Stratus.Prototypes.Sentinel();
                        sentinel.permissions(model.get('permissions'));
                        $scope.sentinel[model.get('id')] = sentinel;
                    }
                });
            });

            // Permission Calculations
            $scope.$watch('sentinel', function (sentinels) {
                if (angular.isObject(sentinels)) {
                    _.each(sentinels, function (sentinel, id) {
                        if (angular.isObject($scope.collection) && angular.isObject(sentinel)) {
                            _.each($scope.collection.models || [], function (model) {
                                if (angular.isObject(model) && model.get('id') === parseInt(id)) {
                                    model.set('permissions', sentinel.permissions());
                                    $log.log('set:', model.get('permissions'));
                                    model.save();
                                }
                            });
                        }
                    });
                }
            }, true);
        },
        template: '<div layout="row" flex="100" ng-repeat="permission in collection.models"><div flex ng-controller="Generic" data-selected="permission.identityUser" data-raw="true" data-target="User"><md-autocomplete md-menu-class="autocomplete-custom-template" md-selected-item="selected" md-search-text="query" md-items="user in collection.filter(query)" md-item-text="user.bestName" md-no-cache="true" md-autoselect="true" md-floating-label="User or Role" placeholder="Choose an Identity"><md-item-template><div class="contact-item" layout="row"><img ng-src="{{ user.email | gravatar }}" class="md-avatar" alt="{{ user.bestName }}"><div flex class="md-list-item-text compact"><p class="md-contact-name" md-highlight-text="true" md-highlight-flags="i">{{ user.bestName }}</p><p class="md-contact-email">{{ user.email }}</p></div></div></md-item-template></md-autocomplete></div><div flex ng-controller="Generic" data-selected="permission.asset" data-raw="true" data-target="ContentType"><md-autocomplete md-menu-class="autocomplete-custom-template" md-selected-item="selected" md-search-text="query" md-items="contentType in collection.filter(query)" md-item-text="contentType.name" md-no-cache="true" md-autoselect="true" md-floating-label="Content" placeholder="Choose an Asset"><md-item-template><p>{{ contentType.name }}</p></md-item-template></md-autocomplete></div><div flex><md-menu><a ng-click="$mdOpenMenu($event)" aria-label="Choose Permissions" href="#">{{ sentinel[permission.data.id].summary().join(", ") }}</a><md-menu-content width="3"><md-menu-item ng-show="!sentinel[permission.data.id].master"><md-checkbox ng-model="sentinel[permission.data.id].view" aria-label="View">View</md-checkbox></md-menu-item><md-menu-item ng-show="!sentinel[permission.data.id].master"><md-checkbox ng-model="sentinel[permission.data.id].create" aria-label="Create">Create</md-checkbox></md-menu-item><md-menu-item ng-show="!sentinel[permission.data.id].master"><md-checkbox ng-model="sentinel[permission.data.id].edit" aria-label="Edit">Edit</md-checkbox></md-menu-item><md-menu-item ng-show="!sentinel[permission.data.id].master"><md-checkbox ng-model="sentinel[permission.data.id].delete" aria-label="Delete">Delete</md-checkbox></md-menu-item><md-menu-item ng-show="!sentinel[permission.data.id].master"><md-checkbox ng-model="sentinel[permission.data.id].publish" aria-label="Publish">Publish</md-checkbox></md-menu-item><md-menu-item ng-show="!sentinel[permission.data.id].master"><md-checkbox ng-model="sentinel[permission.data.id].design" aria-label="Design">Design</md-checkbox></md-menu-item><md-menu-item ng-show="!sentinel[permission.data.id].master"><md-checkbox ng-model="sentinel[permission.data.id].dev" aria-label="Dev">Dev</md-checkbox></md-menu-item><md-menu-divider ng-show="!sentinel[permission.data.id].master"></md-menu-divider><md-menu-item><md-checkbox ng-model="sentinel[permission.data.id].master" aria-label="Master">Master</md-checkbox></md-menu-item></md-menu-content></md-menu></div><md-button flex ng-if="$last" ng-click="collection.add({})">+</md-button></div>'
    };
}));
