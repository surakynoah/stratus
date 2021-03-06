//     Stratus.Filters.Truncate.js 1.0

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

    // Angular Truncate Filter
    // ---------------------

    // This filter truncates a sentence
    Stratus.Filters.Truncate = function () {
        return function (input, options) {
            if (!angular.isString(input)) return input;
            this.limit = null;
            this.suffix = null;
            if (angular.isObject(options)) angular.extend(this, options);
            return _.truncate(input, this.limit, this.suffix);
        };
    };

}));
