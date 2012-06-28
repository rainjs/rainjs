describe('the component class', function () {
    var module, utils, mocks, fs, semver, wrench, stat;
    var root = '/root';

    beforeEach(function () {
        mocks = {};
        path = mocks['path'] = jasmine.createSpyObj('path', ['join', 'resolve', 'existsSync', 'basename']);
        fs = mocks['fs'] = jasmine.createSpyObj('fs', ['mkdirSync', 'readdirSync', 'statSync', 'readFileSync', 'writeFileSync']);
        wrench = mocks['wrench'] = jasmine.createSpyObj('wrench', ['copyDirSyncRecursive']);
        semver = mocks['semver'] = jasmine.createSpyObj('semver', ['neq', 'valid', 'maxSatisfying']);
        mocks['/root'] = {
            id: 'c',
            version: '1.0'
        };

        module = loadModuleExports('bin/lib/component.js', mocks);
        spyOn(module, 'create');
        spyOn(module, '_updatePlaceholders');

        stat = jasmine.createSpyObj('stat', ['isDirectory']);
        stat.isDirectory.andReturn(true);
        fs.statSync.andReturn(stat);

        fs.readdirSync.andReturn(['a', 'b', 'c']);

        path.join.andReturn(root);
        path.resolve.andReturn(root);
    });

    describe('create', function() {
        it('should throw an error if the component path already exists', function () {
            module.create.andCallThrough();
            path.existsSync.andReturn(true);

            expect(function () {
                module.create(root, 'test', '1.0');
            }).toThrow();
        });

        it('should create the component', function () {
            module.create.andCallThrough();

            module.create(root, 'test', '1.0');

            expect(fs.mkdirSync).toHaveBeenCalledWith(root, '0755');
            expect(wrench.copyDirSyncRecursive).toHaveBeenCalledWith(root, root);
            expect(module._updatePlaceholders.calls[0].args).toEqual([root, {
                'component_name': 'test',
                'component_version': '1.0'
            }]);
            expect(module._updatePlaceholders.calls[1].args).toEqual([root, {
                'component_name': 'test'
            }]);
        });
    });

    it('should update placeholders', function () {
        fs.readFileSync.andReturn("Hello {{name}}");
        module._updatePlaceholders.andCallThrough();

        module._updatePlaceholders('/file.html', {name: 'some-name'});

        expect(fs.writeFileSync).toHaveBeenCalledWith('/file.html', 'Hello some-name', 'utf8');
    });
});
