"use strict";

/**
 * @fileoverview require.js locale plugin
 */

define(['text'],
    /**
     * Require.JS locale plugin.
     *
     * Accepts a resource name composed of a component name and a version
     * and loads the locale information from the server for that component.
     *
     * Under the hood, it accepts JSON data and tries to parse it and make it
     * available as a native JavaScript object.
     *
     * @param {plugin} text the require.js standard text plugin
     */
    function (text) {

        // shim JSON.parse if it's not available
        var p = typeof JSON !== 'undefined' && JSON.parse;
        if (!p) {
            p = function (json) {
                return Function('return ' + json)();
            };
        }

        /**
         * Parses the JSON data.
         *
         * Returns an empty object in case the JSON isn't parseable.
         *
         * @param {String} json the JSON to parse
         * @returns {Object} the parsed JSON object or an empty one
         */
        function parse(json) {
            var o;

            try { o = p(json); }
            catch (e) { o = {}; }

            return o;
        }

        /**
         * Tests the resource name for validity and assembles a correct
         * locale route for the given (component, version) pair.
         * It accepts an optional version.
         *
         * @param {String} res the resource name
         * @param {String} the locale route
         */
        function route(res) {
            var format = /^[\w-]+\/\d(?:\.\d)?(?:\.\d)?$/;
            return format.test(res) ? '/' + res + '/locale' : '';
        }

        return {
            /**
             * The require.JS load() implementation, following the plugin API.
             *
             * Uses the text plugin's AJAX get() method to load the JSON from
             * the locale route.
             */
            load : function(res, req, load, config) {
                text.get(route(res), function (data) {
                    load(parse(data));
                });
            },

            /**
             * The require.JS normalize() implementation, following the plugin API.
             *
             * Require.JS by default tries to normalize the name with the normal
             * module resolution. To avoid false interpretations of component names
             * a simple implementation that just returns the original resource
             * name is provided.
             */
            normalize: function (name) {
                return name;
            }
        };
});
