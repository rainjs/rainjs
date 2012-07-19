describe('The console appender', function () {
    var Appender, ConsoleAppender, layout, mocks, event, options;
    beforeEach(function (){
        mocks = {};
        mocks['../appender'] = Appender = jasmine.createSpy('Appender');
        layout = jasmine.createSpyObj('layout', ['format']);
        event = jasmine.createSpyObj('event', ['level', 'message', 'error', 'logger']);
        event.logger.andReturn('RAIN');
        layout.format.andReturn('Some message');

        spyOn(console, 'log');

        options = {
            "debug": {
                "foreground": "green"
            },
            "info": {
                "foreground": "cyan"
            },
            "warn": {
                "foreground": "yellow"
            },
            "error": {
                "foreground": "red"
            },
            "fatal": {
                "foreground": "black",
                "background": "red"
            }
        };

        ConsoleAppender = loadModuleExports('/lib/logging/appenders/console.js', mocks);
    });

    it('should call the parent constructor', function () {
        var appender = new ConsoleAppender(0, layout, options);

        expect(Appender).toHaveBeenCalled();
    });

    it("should corectly format a debug message", function() {
        event.level.andReturn('debug');
        var appender = new ConsoleAppender('debug', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('\u001b[32mSome message\u001b[39m');
    });

    it("should corectly format an info message", function() {
        event.level.andReturn('info');
        var appender = new ConsoleAppender('info', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('\u001b[36mSome message\u001b[39m');
    });

    it("should corectly format a warning message", function() {
        event.level.andReturn('warn');
        var appender = new ConsoleAppender('warn', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('\u001b[33mSome message\u001b[39m');
    });

    it("should corectly format an error message", function() {
        event.level.andReturn('error');
        var appender = new ConsoleAppender('error', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('\u001b[31mSome message\u001b[39m');
    });

    it("should corectly format a fatal message", function() {
        event.level.andReturn('fatal');
        var appender = new ConsoleAppender('fatal', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('\u001b[30m\u001b[41mSome message\u001b[39m\u001b[49m');
    });

    it("shouldn't color messages on windows", function() {
        event.level.andReturn('fatal');
        process.platform = 'win32';
        var appender = new ConsoleAppender('fatal', layout, options);

        appender._write('Some message', event);
        expect(console.log).toHaveBeenCalledWith('Some message');
    });
});
