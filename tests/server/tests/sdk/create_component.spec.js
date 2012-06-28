describe('RAIN create component', function () {
    var mocks, program, path, fs, utils, wrench, component, module, createComponent;

    beforeEach(function () {
        mocks = {};
        path = mocks['path'] = jasmine.createSpyObj('path', ['existsSync', 'resolve']);
        fs = mocks['fs'] = jasmine.createSpyObj('fs', ['mkdirSync', 'writeFileSync']);
        wrench = mocks['wrench'] = jasmine.createSpyObj('wrench', ['copyDirSyncRecursive']);
        utils = mocks['../lib/utils'] = jasmine.createSpyObj('utils', ['getProjectRoot']);
        component = mocks['../lib/component'] = jasmine.createSpyObj('component', ['create']);

        spyOn(console, 'log');
        spyOn(process, 'exit');

        program = jasmine.createSpyObj('program', ['command', 'description', 'action', 'option']);
        program.command.andReturn(program);
        program.description.andReturn(program);
        program.action.andReturn(program);
        program.option.andReturn(program);
        component.create.andReturn({
            id: 'test',
            version: '1.0'
        });

        var context = loadModuleContext('bin/commands/create_component.js', mocks);
        module = context.module.exports;
        createComponent = context.createComponent;
    });

    it('should register the create-component command', function () {
        module(program);

        expect(program.command).toHaveBeenCalledWith('create-component <component-name> [component-version]');
    });

    it('should create a new component', function () {
        utils.getProjectRoot.andReturn('/root');

        createComponent('test', '1.0');
        expect(component.create).toHaveBeenCalledWith('/root', 'test', '1.0');
    });

    it('should exit in case it cannot create the component and print the error', function () {
        component.create.andThrow(new Error('Some funky error'));

        try {
            createComponent('test', '1.0');
        } catch (e) {
            // avoid crash due to execution not stopping at process.exit();
        }

        expect(process.exit).toHaveBeenCalledWith(1);
    });
});
