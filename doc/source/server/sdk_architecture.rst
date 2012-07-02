=====================
RAIN SDK Architecture
=====================

In order to make the RAIN SDK easy to mantain, its functionality is split across multiple files.
The ``commands`` folder contains a javascript file for each command of the sdk. Each such module
should export a function that when called registers the command.

The RAIN SDK uses Commander.js to parse the command-line arguments
(`https://github.com/visionmedia/commander.js <https://github.com/visionmedia/commander.js>`_). When
the command is registered the Commander instance is passed as the only argument of the function.

The following example shows how a new command can be registered:

.. code-block:: javascript

    function register(program) {
        program
            .command('some-command <required-argument> [optional-argument]')
            .description('Description for the command.')
            .option('-o1, --option1 <arg>', 'description for option1')
            .option('-o2, --option2 <arg>', 'description for option2')
            .option('-o3, --option3', 'an option that does not receive arguments')
            .action(fn);
    }

    function fn(requiredArgument, optionalArgument, options) {
        //code to run when the command is executed
        //you can find the value passed to --option1 in options.option1
    }

    module.exports = register;

When registering a new command at least the command name, the description and the function to be
executed must be provided. However, required and optional arguments and multiple options can be
specified.

The ``start`` command was moved to a new executable called ``raind`` to eliminate the logic used to
start the server from the RAIN SDK.