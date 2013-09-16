===============================
JavaScript and CSS Minification
===============================

Minification is important to load web applications faster. The scope of this research is to
reduce the page load time by decreasing the number and size of the requests performed by the
browser. The number of requests is decreased by combining multiple CSS or JavaScript files in
a single file. The request size is reduced by removing white spaces and applying other compression
algorithms that gives you smaller files while preserving the same functionality, e.g.: name
mangling, stripping comments etc.

The minification will be performed as a predeployment step using a SDK command like ``rain minify``
which will generate the minified files for each component. It might be desired that this command
generates a new RAIN project containing only the minified files instead of adding the minified
files in the current project.

-----------------------
JavaScript Minification
-----------------------

The tool used for JavaScript minification is
`RequireJS Optimizer <http://requirejs.org/docs/optimization.html>`_. It is able to trace
module dependencies and combine multiple RequireJs modules into a single file. When combining
multiple modules in the same file each module must have the optional module name specified::

    define("example/3.0/js/notes", ["js/note"], function (Note) {
        function Notes () {}

        return Notes;
    });

When performing minification, the client-side controllers associated with each view are identified
and added to the list of modules to be included in the minified file. The dependencies of each
client-side controller are identified and included by the RequireJS Optimizer. This process
generates a file named ``index.min.js`` for each component. Any external dependencies are
excluded since it would be redundant to have the same module in multiple files. A sample
configuration used to minify the javascript files for the ``example`` component looks like this::

    var options = {
        /*
         * Path used to locate the modules.
         * The module path is composed as baseUrl/{moduleName}.js
         */
        baseUrl: '/path/to/rain/components/example/client',

        /*
         * minification options
         * Name mangling is disabled since it will also change the names for t, nt and logger.
         */
        optimize: "uglify2",
        uglify2: {
            mangle: false
        },

        "packages": [{
            "name": "raintime",
            "main": "raintime",
            "location": "../../core/client/js"
        }],

        /*
         * The modules to be included in the minified file.
         * Dependencies are detected automatically by RequireJS Optimizer.
         */
        include: ['js/index', 'js/notes', 'js/text_localization'],

        /*
         * Any external dependencies shouldn't be included; they are included in the file
         * located in the component to which they belong.
         * In this configuration only the raintime dependencies are excluded, but any external
         * module should be added here.
         */
        exclude: ["raintime"],

        out: '/path/to/rain/components/example/client/js/index.min.js',

        /*
         * An empty module is added at the end of the file since the require for the minified
         * file will look like: require(['example/3.0/js/index.min]', function () {});
         */
        wrap: {
            end: 'define('example/3.0/js/index.min', [], function () {});'
        },

        /*
         * This function is called when the contents of a module are read. It is also called for
         * excluded modules.
         * It adds an empty define for modules that are loaded in the global scope like jquery.
         * RequireJS Optimizer does this automatically, but this define isn't included in the
         * contents passed to the onBuildWrite method where module names are replaced with the
         * correct names for the RAIN context.
         */
        onBuildRead: function (moduleName, path, contents) {
            // global modules
            if (contents.indexOf('define(') === -1) {
                contents += '\n\n';
                contents += util.format('define("%s", function(){});', moduleName);
                contents += '\n\n';
            }

            return contents;
        },

        /*
         * On build write is called before the contents of a module are added to the minified file.
         * It replaces the module names with the correct ones, RequireJS Optimizer has no knowledge
         * about RAIN's components and routes. For example js/notes becomes example/3.0/js/notes.
         */
        onBuildWrite: (function (moduleName, path, contents) {
            return contents.replace(moduleName, util.format('example/3.0/%s', moduleName));
        }
    };

After this, the RequireJS Optimizer is called with these options to perform the actual
minification::

    requirejs.optimize(options, function () {
        // minification finished
    });

An exception from the process described above is the ``core`` component. The configuration for
the ``core`` component is written manually and it should look like this::

    var options = {
        baseUrl: path.join(coreComponentPath, 'client/js'),
        optimize: "uglify2",
        uglify2: {
            mangle: false
        },

        "packages": [{
            "name": "raintime",
            "main": "raintime",
            "location": "."
        }],

        /*
         * These modules have all the other modules in the core component as dependencies.
         * When adding modules to the core component you need to make sure that all the modules
         * from the core component are still included in the minified file. Just putting all
         * the files in the include list will not help since the modules should appear in a
         * specific order to guarantee that module dependencies will be resolve correctly.
         */
        include: [
            'raintime/dependencies',
            'raintime/client_rendering',
            'raintime/dialog',
            'raintime/translation'
        ],
        out: path.join(coreComponentPath, 'client/js/index.min.js'),

        wrap: {
            end: "define('raintime/index.min', [], function () {});"
        }
    };

The current minification prototype requires a few improvements which are listed below:
 - the files that need to be included for the ``core`` component should be found automatically.
   An approach might be to use the RequireJS optimizer to trace the dependencies for each module
   an than adding all the files to the include list in the correct order. This might not be an
   issue in our case since the module that is required when requesting the file is the empty
   ``raintime/index.min`` module which has no dependencies. When any other module is requested
   all the other modules will already be loaded and no new request will be performed.
 - a proper strategy that uses a JavaScript parser and a code generator (Esprima + escodegen)
   should be used to analyze and rewrite the content of the module. The simple string replace
   that is used now will fail in some cases, e.g.: a module contains the module name in its content
   (not only in the define call as expected).
 - name mangling should be enabled in order to obtain smaller file sizes. The current issue is that
   ``t``, ``nt`` and ``logger`` names should be preserved and no way of excluding only these names
   from mangling was found.
   One approach is to change the implementation for the way ``t``, ``nt``  and ``logger``
   dependencies are obtained to something like ``define(['t', 'nt'], function (t, nt) {});``
   In this case the string literals aren't touched by the minification and it is safe
   to change the name of ``t`` and ``nt`` while minifying. The ``t`` and ``nt`` names should
   still be used in unminified code in order to guarantee that the generate po files sdk command
   is working correctly.
 - currently external dependencies aren't working except for raintime dependencies. When a
   dependency like ``external/1.0/js/module`` is found the RequireJS optimizer will fail to
   locate the dependency with the current configuration. This should work if all the other
   components are added as packages and excluded, but we should establish what module names are
   supported.
 - currently only dependencies of the form ``js/module`` and raintime dependencies are supported.
   We should come up with a list of supported module paths and see what needs to be done to
   make them work.

Some changes need to be implemented in RAIN to use the minified files:

 - a flag indicating if minification is enabled should be added
 - the dependencies module should be modified to support multiple modules per file
 - raintime should be modified to require the ``index.min`` module associated with the component
   before requiring the client side controller when minification is used.
 - the bootstrap should be modified to require the minified raintime.

----------------
CSS Minification
----------------

The tool used for CSS minification is less. It supports CSS minification using the YUI compressor.
All the css files (\*.css) for a component are rendered using less and placed in the same file.
The rules should also be counted when adding CSS to the minified file to avoid the situation where
more than 4095 rules are added in the same file. If this is the case, a JSON file should be created
specifying which files were added to which minified file.

Some changes needs to be implemented in RAIN to use the minified files:

 - a flag indicating if minification is enabled should be added
 - the css helper should be modified to replace the requested css file path with the minified file
   when minification is enabled. It should also ensure that the same path is added only once in the
   css list
 - there is an issue when precompiling less at server startup that when multiple URLs are on the
   same line, only the first URL is rewritten
 - media queries aren't working properly in the current prototype because all the CSS files are
   placed in the same file and no mather which file will be matched by the media query selector
   the same css will be placed in the page.
