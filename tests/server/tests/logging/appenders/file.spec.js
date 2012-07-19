var path = require('path');

describe('file appender', function () {
    var Mocks, Spy;
    var Appender, FileAppenderModule, FileAppender, Stream;
    var appender, level, layout, options, message;

    beforeEach(function () {
        Spy = jasmine.createSpyObj('Spy', ['Appender']);

        Spy.Stream = jasmine.createSpyObj('Spy.Stream', ['write', 'end', 'on']);

        Spy.fs = jasmine.createSpyObj('Spy.fs', ['createWriteStream']);
        Spy.fs.createWriteStream.andReturn(Spy.Stream);

        Mocks = {};
        Mocks['../appender'] = Spy.Appender;
        Mocks['fs'] = Spy.fs;

        // NEWLINE is needed from the module's context
        FileAppenderModule = loadModuleContext(
                path.join('lib', 'logging', 'appenders', 'file.js'), Mocks);
        FileAppender = FileAppenderModule.module.exports;

        layout = {};
    });

    describe('constructor', function () {

        it('should throw an exception if options are missing', function () {
            function instantiate() { new FileAppender('info', layout); }

            expect(instantiate).toThrowType(RainError.ERROR_PRECONDITION_FAILED);
        });

        it('should throw an exception if file option is missing', function () {
            function instantiate() { new FileAppender('info', layout, {}); }

            expect(instantiate).toThrowType(RainError.ERROR_PRECONDITION_FAILED);
        });

        it('should call the parent constructor', function () {
            options = { file: 'log.log' };
            appender = new FileAppender('info', layout, options);

            expect(Spy.Appender).toHaveBeenCalledWith('info', layout);
        });

        it('should create a write stream with default params', function () {
            options = { file: 'log.log' };
            appender = new FileAppender('info', layout, options);

            expect(Spy.fs.createWriteStream).toHaveBeenCalledWith(
                    options.file,
                    { flags: 'a', encoding: 'utf-8', mode: '0644' });

            expect(Spy.Stream.on.mostRecentCall.args[0]).toEqual('error');
            expect(Spy.Stream.on.mostRecentCall.args[1]).toEqual(jasmine.any(Function));
        });

        it('should create a write stream with custom params', function () {
            options = { file: 'log.log', encoding: 'ascii', mode: '0622'}
            appender = new FileAppender('info', layout, options);

            expect(Spy.fs.createWriteStream).toHaveBeenCalledWith(
                    options.file,
                    { flags: 'a', encoding: options.encoding, mode: options.mode });

            expect(Spy.Stream.on.mostRecentCall.args[0]).toEqual('error');
            expect(Spy.Stream.on.mostRecentCall.args[1]).toEqual(jasmine.any(Function));
        });
    });

    describe('write', function () {
        message = 'message';
        options = { file: 'log.log' };

        it('should write the log message to the stream', function () {
            appender = new FileAppender('info', layout, options);
            appender._write(message);

            expect(Spy.Stream.write)
                .toHaveBeenCalledWith(message + FileAppenderModule.NEWLINE);
        });
    });

    describe('destroy', function () {
        message = 'message';
        options = { file: 'log.log' };

        it('should end the write stream', function () {
            appender = new FileAppender('info', layout, options);
            appender.destroy();

            expect(Spy.Stream.end).toHaveBeenCalled();
        })
    });
});