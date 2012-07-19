describe('Logger events', function () {
    var Event, evt, error;
    beforeEach(function () {

        Event = loadModuleExports('/lib/logging/event.js');

        error = new Error('gigi');
        evt = new Event(0, 'Some random event', error);
    });

    it('should correctly instantiate', function () {
        expect(evt._level).toEqual(0);
        expect(evt._message).toEqual('Some random event');
        expect(evt._error).toEqual(error);
    });

    it('should return the correct message', function () {
        expect(evt.message()).toEqual('Some random event');
    });

    it('should return the correct error', function () {
        expect(evt.error()).toEqual(error);
    });

    it('should return the correct level', function () {
        expect(evt.level()).toEqual(0);
    });
});
