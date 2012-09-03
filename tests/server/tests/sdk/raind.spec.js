var path = require('path');

var cwd = process.cwd();

describe('raind', function () {
    var mocks, program, utils, server;

    beforeEach(function () {
        mocks = {};

        program = jasmine.createSpyObj('program', ['option', 'version', 'usage', 'parse']);
        utils = jasmine.createSpyObj('utils', ['getProjectRoot']);
        server = jasmine.createSpyObj('server', ['start']);

        program.dir = process.cwd();
        program.debug = false;

        program.usage.andReturn(program);
        program.version.andReturn(program);
        program.option.andReturn(program);

        mocks['commander'] = program;
        mocks['./lib/utils'] = utils;
        mocks[path.join(cwd, 'lib', 'server')] = server;

        spyOn(process, 'chdir');
        spyOn(process, 'kill');
        spyOn(process, 'exit');
    });

    it('should correctly setup the command line options', function () {
        loadModuleContext(path.join('bin', 'raind'), mocks);

        expect(program.version).toHaveBeenCalled();
        expect(program.option.calls.length).toBe(2);
        expect(program.option.calls[0].args).toEqual([
            '-d, --debug',
            'start the server in debug mode'
        ]);
        expect(program.option.calls[1].args).toEqual([
            '-D, --dir <path>',
            'the server working directory',
            process.cwd()
        ]);
    });

    it('should exit with error code 1 if the project dir is not inside a rain project', function () {
        utils.getProjectRoot.andCallFake(function () {
            throw new Error('this gets thrown when no valid path is found');
        });

        loadModuleExports(path.join('bin', 'raind'), mocks);

        expect(utils.getProjectRoot).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    if ('win32' !== process.platform) {
        it('should send a SIGUSR1 to itself to go into debug mode if -d is detected', function () {
            program.debug = true;

            loadModuleExports(path.join('bin', 'raind'), mocks);

            expect(process.kill).toHaveBeenCalledWith(process.pid, 'SIGUSR1');
        });
    }

    it('should not go into debug mode if -d is not present', function () {
        program.debug = false;

        loadModuleExports(path.join('bin', 'raind'), mocks);

        expect(process.kill).not.toHaveBeenCalled();
    });

    it('should initialize the server if all went well', function () {
        loadModuleExports(path.join('bin', 'raind'), mocks);
        expect(server.start).toHaveBeenCalled();
    });
});
