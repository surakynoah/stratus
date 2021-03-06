//     Stratus.Services.Model.js 1.0

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

// Function Factory
// ----------------

// Define AMD, Require.js, or Contextual Scope
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['stratus', 'underscore', 'angular'], factory);
    } else {
        factory(root.Stratus, root._);
    }
}(this, function (Stratus, _) {

    // Angular Model Service
    // ---------------------

    // This Model Service handles data binding for a single object with the $http Service
    Stratus.Services.Model = ['$provide', function ($provide) {
        $provide.factory('model', function ($q, $http, $rootScope) {
            return function (options, attributes) {

                // TODO: Add Auto-Saving
                // TODO: Create a deep watcher for the data property

                // Environment
                this.target = null;
                this.manifest = false;
                if (!options || typeof options !== 'object') options = {};
                angular.extend(this, options);

                // Infrastructure
                this.urlRoot = '/Api';
                this.data = {};

                // Handle Collections & Meta
                this.meta = new Stratus.Prototypes.Model();
                if (_.has(this, 'collection')) {
                    if (this.collection.target) this.target = this.collection.target;
                    if (this.collection.meta.has('api')) this.meta.set('api', this.collection.meta.get('api'));
                }

                // Handle Attributes (Typically from Collection Hydration)
                if (attributes && typeof attributes === 'object') {
                    angular.extend(this.data, attributes);
                }

                // Generate URL
                if (this.target) {
                    this.urlRoot += '/' + _.ucfirst(this.target);
                }

                // XHR Flags
                this.pending = false;
                this.error = false;
                this.completed = false;

                // Auto-Saving Flags
                this.changing = false;
                this.changed = 0;
                this.saving = false;
                this.watching = false;

                // Contextual Hoisting
                var that = this;

                // Watch for Data Changes
                this.watcher = function () {
                    if (that.watching) return true;
                    that.watching = true;
                    $rootScope.$watch(function () {
                        return that.data;
                    }, function (newData, oldData) {
                        if (!_.isEqual(newData, oldData)) {
                            that.changing = true;
                            that.changed = 1;
                        }
                    }, true);
                };

                /**
                 * @returns {*}
                 */
                this.url = function () {
                    return that.get('id') ? that.urlRoot + '/' + that.get('id') : that.urlRoot;
                };

                /**
                 * @param obj
                 * @param chain
                 * @returns {string}
                 */
                this.serialize = function (obj, chain) {
                    var str = [];
                    obj = obj || {};
                    angular.forEach(obj, function (value, key) {
                        if (angular.isObject(value)) {
                            str.push(that.serialize(value, key));
                        } else {
                            var encoded = '';
                            if (chain) encoded += chain + '[';
                            encoded += key;
                            if (chain) encoded += ']';
                            str.push(encoded + '=' + value);
                        }
                    });
                    return str.join('&');
                };

                // TODO: Abstract this deeper
                /**
                 * @param action
                 * @param data
                 * @returns {*}
                 */
                this.sync = function (action, data) {
                    this.pending = true;
                    return $q(function (resolve, reject) {
                        action = action || 'GET';
                        var prototype = {
                            method: action,
                            url: that.url(),
                            headers: {}
                        };
                        if (angular.isDefined(data)) {
                            if (action === 'GET') {
                                if (angular.isObject(data) && Object.keys(data).length) {
                                    prototype.url += '?' + that.serialize(data);
                                }
                            } else {
                                prototype.headers['Content-Type'] = 'application/json';
                                prototype.data = JSON.stringify(data);
                            }
                        }
                        $http(prototype).then(function (response) {
                            if (response.status === 200 && angular.isObject(response.data)) {
                                // TODO: Make this into an over-writable function
                                // Data
                                that.meta.set(response.data.meta || {});
                                that.data = response.data.payload || response.data;

                                // XHR Flags
                                that.pending = false;
                                that.completed = true;

                                // Auto-Saving Settings
                                that.saving = false;

                                // Begin Watching
                                that.watcher();

                                // Promise
                                resolve(that.data);
                            } else {
                                // XHR Flags
                                that.pending = false;
                                that.error = true;

                                // Promise
                                reject((response.statusText && response.statusText !== 'OK') ? response.statusText : (
                                    angular.isObject(response.data) ? response.data : (
                                    'Invalid Payload: ' + prototype.method + ' ' + prototype.url)
                                ));
                            }
                        }).catch(reject);
                    });
                };

                /**
                 * @param action
                 * @param data
                 * @returns {*}
                 */
                this.fetch = function (action, data) {
                    return that.sync(action, data || that.meta.get('api')).catch(console.error);
                };

                /**
                 * @returns {*}
                 */
                this.save = function () {
                    that.changing = false;
                    that.saving = true;
                    return that.sync(that.get('id') ? 'PUT' : 'POST', that.toJSON()).catch(console.error);
                };

                // Attribute Functions

                /**
                 * @returns {{meta, payload}}
                 */
                this.toJSON = function () {
                    var data = (that.meta.has('api')) ? {
                        meta: that.meta.get('api'),
                        payload: that.data
                    } : that.data;
                    if (this.meta.size() > 0) {
                        this.meta.clearTemp();
                    }
                    return data;
                };

                /**
                 * @param attribute
                 * @returns {*}
                 */
                this.get = function (attribute) {
                    if (typeof attribute !== 'string' || !that.data || typeof that.data !== 'object') {
                        return undefined;
                    } else {
                        return attribute.split('.').reduce(function (attributes, a) {
                            return attributes && attributes[a];
                        }, that.data);
                    }
                };

                /**
                 * @param attr
                 * @param value
                 */
                this.set = function (attr, value) {
                    if (attr && typeof attr === 'object') {
                        _.each(attr, function (value, attr) {
                            that.setAttribute(attr, value);
                        }, this);
                    } else {
                        that.setAttribute(attr, value);
                    }
                };

                /**
                 * @param attr
                 * @param value
                 */
                this.setAttribute = function (attr, value) {
                    if (typeof attr === 'string' && attr.indexOf('.') !== -1) {
                        var reference = that.data;
                        var chain = attr.split('.');
                        _.find(_.initial(chain), function (link) {
                            if (!_.has(reference, link) || !reference[link]) reference[link] = {};
                            if (typeof reference !== 'undefined' && reference && typeof reference === 'object') {
                                reference = reference[link];
                            } else {
                                reference = that.data;
                                return true;
                            }
                        }, this);
                        if (!_.isEqual(reference, that.data)) {
                            var link = _.last(chain);
                            if (reference && typeof reference === 'object') {
                                reference[link] = value;
                            }
                        }
                    } else {
                        that.data[attr] = value;
                    }
                    /* TODO: that.trigger('change:' + attr, value); */
                };

                /**
                 * @param attribute
                 * @param item
                 * @param options
                 * @returns {*}
                 */
                this.toggle = function (attribute, item, options) {
                    if (typeof options !== 'object') options = { multiple: true };
                    console.log('toggle:', attribute, item, options);
                    var request = attribute.split('[].');
                    var target = that.get(request.length > 1 ? request[0] : attribute);
                    if (typeof target === 'undefined') {
                        target = options.multiple ? [] : null;
                        that.set(request.length > 1 ? request[0] : attribute, target);
                    }
                    if (typeof item === 'undefined') {
                        that.set(attribute, !target);
                    } else if (angular.isArray(target)) {
                        /* This is disabled, since hydration should not be forced by default *
                        var hydrate = {};
                        if (request.length > 1) {
                            hydrate[request[1]] = { id: item };
                        } else {
                            hydrate.id = item;
                        }
                        /* */
                        if (!that.exists(attribute, item)) {
                            target.push(item);
                        } else {
                            _.each(target, function (element, key) {
                                var child = (request.length > 1 && angular.isObject(element) && request[1] in element) ? element[request[1]] : element;
                                var childId = (angular.isObject(child) && child.id) ? child.id : child;
                                var itemId = (angular.isObject(item) && item.id) ? item.id : item;
                                if (childId === itemId || (angular.isString(childId) && angular.isString(itemId) && _.strcmp(childId, itemId) === 0)) {
                                    target.splice(key, 1);
                                }
                            });
                        }
                    } else if (typeof target === 'object' || typeof target === 'number') {
                        // (item && typeof item !== 'object') ? { id: item } : item
                        that.set(attribute, !that.exists(attribute, item) ? item : null);
                    }
                    return that.get(attribute);
                };

                /**
                 * @param attribute
                 * @returns {*}
                 */
                this.pluck = function (attribute) {
                    if (typeof attribute === 'string' && attribute.indexOf('[].') > -1) {
                        var request = attribute.split('[].');
                        if (request.length > 1) {
                            attribute = that.get(request[0]);
                            if (attribute && angular.isArray(attribute)) {
                                var list = [];
                                attribute.forEach(function (element) {
                                    if (angular.isObject(element) && request[1] in element) {
                                        list.push(element[request[1]]);
                                    }
                                });
                                if (list.length) {
                                    return list;
                                }
                            }
                        }
                    } else {
                        return that.get(attribute);
                    }
                    return undefined;
                };

                /**
                 * @param attribute
                 * @param item
                 * @returns {boolean}
                 */
                this.exists = function (attribute, item) {
                    if (!item) {
                        attribute = that.get(attribute);
                        return typeof attribute !== 'undefined' && attribute;
                    } else if (typeof attribute === 'string' && item) {
                        attribute = that.pluck(attribute);
                        if (angular.isArray(attribute)) {
                            return typeof attribute.find(function (element) {
                                    return element === item || (
                                        angular.isObject(element) && element.id && element.id === item || _.isEqual(element, item)
                                    );
                                }) !== 'undefined';
                        } else {
                            return attribute === item || (
                                    angular.isObject(attribute) && attribute.id && (
                                        _.isEqual(attribute, item) || attribute.id === item
                                    )
                                );
                        }
                    }
                    return false;
                };

                /**
                 * @type {Function}
                 */
                this.destroy = function () {
                    if (that.collection) {
                        that.collection.remove(that);
                    }
                    if (that.get('id')) {
                        that.sync('DELETE', {}).catch(console.error);
                    }
                };

                /**
                 * @type {Function}
                 */
                this.initialize = this.initialize || function () {
                        if (that.manifest && !that.get('id')) {
                            that.sync('POST', {}).catch(console.error);
                        }
                    };
                this.initialize();
            };
        });
    }];

}));
