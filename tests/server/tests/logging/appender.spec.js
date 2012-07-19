var path = require('path');

describe('abstract appender', function () {
    describe('append', function () {
        var Mocks, Spy, Appender;
        var Levels = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
        var appender, message;

        beforeEach(function () {
            Spy = {};
            Spy.Event = jasmine.createSpyObj('Spy.Event', ['level']);
            Spy.Layout = jasmine.createSpyObj('Spy.Layout', ['format']);

            Mocks = {};
            Mocks['./logger'] = { LEVELS: Levels };

            Appender = loadModuleExports(path.join('lib', 'logging', 'appender.js'),
                    Mocks);

            message = 'message';
            spyOn(Appender.prototype, '_write');
            Spy.Layout.format.andReturn(message);
        });

        it('should log if the event\'s level is greater than the logger\'s level', function () {
            appender = new Appender('info', Spy.Layout);
            Spy.Event.level.andReturn('error');

            appender.append(Spy.Event);

            expect(Spy.Layout.format).toHaveBeenCalledWith(Spy.Event);
            expect(appender._write).toHaveBeenCalledWith(message, Spy.Event);
        });

        it('should log if the event\'s level is equal to the logger\'s level', function () {
            appender = new Appender('warn', Spy.Layout);
            Spy.Event.level.andReturn('warn');

            appender.append(Spy.Event);

            expect(Spy.Layout.format).toHaveBeenCalledWith(Spy.Event);
            expect(appender._write).toHaveBeenCalledWith(message, Spy.Event);
        });

        it('shouldn\'t log if the event\'s level is less than the logger\'s level', function () {
            appender = new Appender('error', Spy.Layout);
            Spy.Event.level.andReturn('debug');

            appender.append(Spy.Event);

            expect(Spy.Layout.format).not.toHaveBeenCalled();
            expect(appender._write).not.toHaveBeenCalled();
        });
    });
});