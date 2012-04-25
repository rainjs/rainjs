var jsonString = '{"foo": "bar"}',
    malformedJsonString = '{foo": "bar"}',
    jsonObject = {foo: "bar"};

describe('RequireJS locale plugin', function () {
    it('should be able to load a JSON string',
        ['locale', 'text'],
        function (locale, text) {
            var parsed = null;

            runs(function () {
                text.get.andCallFake(function (res, cb) {
                    cb(jsonString);
                });
                locale.load.andCallThrough();
                locale.load(null, null, function (data) {
                    parsed = data;
                })
            });

            waitsFor(function () {
                return parsed;
            })

            runs(function () {
                expect(parsed).toEqual(jsonObject);
            });
        });

    it('should return an empty object in case of a malformed JSON string',
        ['locale', 'text'],
        function (locale, text) {
            var parsed = null;
            runs(function () {
                text.get.andCallFake(function (res, cb) {
                    cb(malformedJsonString);
                });
                locale.load.andCallThrough();
                locale.load(null, null, function (data) {
                    parsed = data;
                });
            });

            waitsFor(function () {
                return (parsed !== null);
            })

            runs(function () {
                expect(parsed).toEqual({});
            });
        });

    it('should return the same name when normalized', ['locale'], function (locale) {
        locale.normalize.andCallThrough();
        expect(locale.normalize('test-string')).toEqual('test-string');
    });
});
