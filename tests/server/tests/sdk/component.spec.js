describe('the component class', function () {
    var module, utils, mocks, fs, semver, wrench, stat;
    var root = '/root';

    beforeEach(function () {
        mocks = {};
        path = mocks['path'] = jasmine.createSpyObj('path', ['join', 'resolve', 'existsSync', 'basename']);
        fs = mocks['fs'] = jasmine.createSpyObj('fs', ['mkdirSync', 'readdirSync', 'statSync']);
        wrench = mocks['wrench'] = jasmine.createSpyObj('wrench', ['copyDirSyncRecursive']);
        semver = mocks['semver'] = jasmine.createSpyObj('semver', ['neq', 'valid', 'maxSatisfying']);
        mocks['/root'] = {
            id: 'c',
            version: '1.0'
        };

        module = loadModuleExports('bin/lib/component.js', mocks);
        spyOn(module, 'create');
        spyOn(module, 'get');
        spyOn(module, '_updatePlaceholders');
        spyOn(module, '_normalizeVersion');

        stat = jasmine.createSpyObj('stat', ['isDirectory']);
        stat.isDirectory.andReturn(true);
        fs.statSync.andReturn(stat);

        fs.readdirSync.andReturn(['a', 'b', 'c']);

        path.join.andReturn(root);
        path.resolve.andReturn(root);
    });

    describe('create', function() {
        it('should call get with the component version id and version', function () {
            module.create.andCallThrough();

            module.create(root, 'test', '1.0');

            expect(module.get).toHaveBeenCalledWith(root, 'test', '1.0')
        });

        it('should throw an error if it finds a component with the same version as the one specified', function () {
            module.create.andCallThrough();
            module.get.andReturn({
                id: 'test',
                version: '1.0'
            });

            expect(function () {
                module.create(root, 'test', '1.0');
            }).toThrow();
        });

        it('should call normalize version with the version recived as a param', function () {
            module.create.andCallThrough();

            module.create(root, 'test', '1.0');

            expect(module._normalizeVersion).toHaveBeenCalledWith('1.0');
        });

        it('should throw an error if the component path already exists', function () {
            module.create.andCallThrough();
            path.existsSync.andReturn(true);

            expect(function () {
                module.create(root, 'test', '1.0');
            }).toThrow();
        });

        it('should create the component', function () {
            module.create.andCallThrough();
            module._normalizeVersion.andReturn('1.0.0');

            module.create(root, 'test', '1.0');

            expect(fs.mkdirSync).toHaveBeenCalledWith(root, '0755');
            expect(wrench.copyDirSyncRecursive).toHaveBeenCalledWith(root, root);
            expect(module._updatePlaceholders.calls[0].args).toEqual([root, {
                'component_name': 'test',
                'component_version': '1.0.0'
            }]);
            expect(module._updatePlaceholders.calls[1].args).toEqual([root, {
                'component_name': 'test'
            }]);
        });
    });

    describe('get', function () {
        it('should read the components dir and validate the files', function () {
            module.get.andCallThrough();

            module.get(root, 'c', '1.0');

            expect(fs.readdirSync).toHaveBeenCalledWith(root);
            expect(fs.statSync).toHaveBeenCalledWith(root);
        });

        it('should normalize the component and input version', function () {
            module.get.andCallThrough();

            module.get(root, 'c', '1.0');

            expect(module._normalizeVersion).toHaveBeenCalled();
        });

        it('should find the version if it exists', function () {
            module.get.andCallThrough();
            semver.maxSatisfying.andReturn('0.9.0');

            var v = module.get(root, 'test', '1.0');

            expect(v).toEqual(new module('test', '0.9.0'));
        });
    });
});
