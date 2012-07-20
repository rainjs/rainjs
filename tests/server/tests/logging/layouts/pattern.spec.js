describe("The pattern layout", function() {
    var Pattern, event,
    params = {
        "pattern": "[%%%level%%] %date: %message"
    };

    beforeEach(function () {
        var date = jasmine.createSpyObj('date', [
            'getDate', 'getMonth', 'getFullYear',
            'getHours', 'getMinutes', 'getSeconds'
        ]);
        Pattern = loadModuleExports('/lib/logging/layouts/pattern.js');
        event = jasmine.createSpyObj('event', ['date', 'level', 'logger', 'message']);
        event.date.andReturn(date);
        event.level.andReturn('info');
        event.logger.andReturn('RAIN');
        event.message.andReturn('Some funky message');

        date.getDate.andReturn(1);
        date.getMonth.andReturn(1);
        date.getFullYear.andReturn(1970);
        date.getHours.andReturn(1);
        date.getMinutes.andReturn(1);
        date.getSeconds.andReturn(1);
    });

    it("should be properly constructed", function () {
        var layout = new Pattern(params);

        expect(layout._pattern).toEqual('%date|%level|%logger|%message|%newline|%stacktrace|%%');
    });

    it("should corectly calculate the date", function() {
        var layout = new Pattern(params);

        expect(layout._placeholders.date(event)).toEqual('02/01/1970 - 01:01:01');
    });

    it("should corectly determine the newline format", function() {
        var layout = new Pattern(params);

        process.platform = 'linux';
        expect(layout._placeholders.newline()).toEqual('\n');

        process.platform = 'darwin';
        expect(layout._placeholders.newline()).toEqual('\r');

        process.platform = 'win32';
        expect(layout._placeholders.newline()).toEqual('\r\n');

        process.platform = 'solaris';
        expect(layout._placeholders.newline()).toEqual('\n');

        process.platform = 'freebsd';
        expect(layout._placeholders.newline()).toEqual('\n');
    });

    it("should corectly format the message", function() {
        var layout = new Pattern(params);

        expect(layout.format(event)).toEqual('[%info%] 02/01/1970 - 01:01:01: Some funky message')
    });
});
