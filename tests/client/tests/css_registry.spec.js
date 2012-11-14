describe ('registry API', function (){
    var component,
        adding,
        css,
        file,
        rule;
    beforeEach(function () {
    component = "style0";
    adding = 0;
    css = [{ path: 'path1',
            ruleCount: 1,
            content: '.rule1{}',
                },
                { path: 'path2',
                    ruleCount: 1,
                    content: '.rule2{}',
                        }]
    file = [{path: 'path1'},{path: 'path2'}];
    rule =  { start : 0, style : {id: 0} };
    });

    describe('register method', function () {

        it('should add to the current styleSheet',['raintime/css/registry', 'raintime/css/stylesheet',
                                                   'raintime/css/rule_set'],
                                                   function(Registry, StyleSheet, RuleSet){

            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            StyleSheet.prototype.add.andCallFake(function (rule) {
                return true;
            });
            var fakeRegistry = new Registry();
            fakeRegistry.register(component, css);
            var rules = new RuleSet(css);
            expect(fakeRegistry.register).toHaveBeenCalledWith(component, css);
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rules);
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rules);
            expect(fakeRegistry._currentSheetIndex).toEqual(0);
            expect(StyleSheet.prototype.add.calls.length).toEqual(2);
            expect(fakeRegistry._unsavedSheets.length).toEqual(1);

        });

        it ('should generate another styletag if the actual styletag is full',
                                                ['raintime/css/registry', 'raintime/css/stylesheet',
                                                 'raintime/css/rule_set'],function(Registry, StyleSheet, RuleSet){

            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            StyleSheet.prototype.add.andCallFake(function (rule) {
                if(adding === 0) {
                    adding++;
                    return true;
                }else if (adding === 1){
                    adding++;
                    return false;
                }else {
                    return true;
                }
            });
            var fakeRegistry = new Registry();
            fakeRegistry.register(component, css);
            var rules = new RuleSet(css);
            expect(fakeRegistry.register).toHaveBeenCalledWith(component, css);
            expect(fakeRegistry._currentSheetIndex).toEqual(1);
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rules);
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rules);
            expect(adding).toEqual(2);
            expect(StyleSheet.prototype.add.calls.length).toEqual(3);
            expect(fakeRegistry._unsavedSheets.length).toEqual(2);
        });

        it ('should generate an error message if the max style tags is reached',
                                    ['raintime/css/registry', 'raintime/css/stylesheet',
                                     'raintime/css/rule_set'],function (Registry, StyleSheet, RuleSet){

            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            Registry.prototype._getRulesWithin.andCallThrough();
            Registry.prototype._collectWhitespace.andCallThrough();
            StyleSheet.prototype.getRulesWithin.andReturn([]);
            StyleSheet.prototype.add.andCallFake(function (rule, css, file) {
                    adding++;
                    return false;
            });
            StyleSheet.prototype.getFreeSpace.andReturn(0);
            var fakeRegistry = new Registry();
            var success = fakeRegistry.register(component,css);
            expect(fakeRegistry.register).toHaveBeenCalledWith(component,css);
            expect(fakeRegistry._currentSheetIndex).toEqual(31);
            expect(success).toBe(false);
        });
    });


    describe("unregister method", function(){
        it("should remove a css",  ['raintime/css/registry', 'raintime/css/stylesheet',
                                    'raintime/css/rule_set'], function(Registry, StyleSheet, RuleSet){

            var removed = false;
            Registry.prototype.register.andCallThrough();
            Registry.prototype._save.andCallThrough();
            StyleSheet.prototype.add.andCallThrough();
            Registry.prototype.unregister.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            StyleSheet.prototype.write.andCallThrough();
            Registry.prototype._remove.andCallThrough();
            StyleSheet.prototype._append.andCallThrough();
            StyleSheet.prototype.remove.andCallThrough();
            StyleSheet.prototype.remove.andCallFake(function (rule) {
                removed = true;
            });
            var fakeRegistry = new Registry();
            fakeRegistry.register(component, css);
            fakeRegistry.unregister(component);
            expect(removed).toBe(true);
        });
    });

    describe ("get new files method", function () {
        it("should return an empty array if ther aren't new files",  ['raintime/css/registry',
                                                                      'raintime/css/stylesheet',
                                                                      'raintime/css/rule_set'],
                                                                      function(Registry, StyleSheet, RuleSet){

            Registry.prototype.register.andCallThrough();
            Registry.prototype.getNewFiles.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            Registry.prototype._save.andCallThrough();
            StyleSheet.prototype.add.andCallThrough();
            var fakeRegistry = new Registry();
            fakeRegistry.register(component, css);
            var resp;
            var filterFunction = function () {
                return (!fakeRegistry._components[component] || 'undefined' === typeof fakeRegistry._components[component].files[file.path]);
            };
            resp = filterFunction();
            var response = fakeRegistry.getNewFiles(component,file);
            expect(resp).toBe(true);
            expect(response).toEqual([]);
        });

        it("should return an array if there are found new files", ['raintime/css/registry',
                                                                   'raintime/css/stylesheet',
                                                                   'raintime/css/rule_set'],
                                                                   function(Registry, StyleSheet, RuleSet){

            Registry.prototype.register.andCallThrough();
            Registry.prototype.getNewFiles.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            StyleSheet.prototype.add.andCallThrough();
            Registry.prototype._save.andCallThrough();
            StyleSheet.prototype.write.andCallThrough();
            var fakeRegistry = new Registry();
            var file2 = [{path: 'path3'},{path: 'path4'}];
            StyleSheet.prototype.add.andCallThrough();
            var fakeRegistry = new Registry();
            fakeRegistry.register(component, css);
            var resp;
            var filterFunction = function () {
                return (!fakeRegistry._components[component] || 'undefined' === typeof fakeRegistry._components[component].files[file2.path]);
            };
            resp = filterFunction();
            var response = fakeRegistry.getNewFiles(component, file2);
            expect(resp).toBe(true);
            expect(response).toEqual(file2);
        });
    });
});
