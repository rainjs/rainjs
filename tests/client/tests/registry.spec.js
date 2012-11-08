describe ('registry API', function (){
    var component,
        adding,
        css,
        file,
        rule;
    beforeEach(function () {
    component = "style0";
    adding = 0;
    css = {path1 : { length: 1,
            ruleCount: 1,
            content: '.rule1{}',
                },
                path2 : { length: 1,
                    ruleCount: 1,
                    content: '.rule2{}',
                        }
    };
    file = [{path: 'path1'},{path: 'path2'}];
    rule =  { start : 0, style : {id: 0} };
    });

    describe('register method', function () {

        it('should add to the current styleSheet',['raintime/css/registry', 'raintime/css/stylesheet',
                                                   'raintime/css/rule_set'],
                                                   function(Registry, StyleSheet, RuleSet){

            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            StyleSheet.prototype.add.andCallFake(function (rule, css, file) {
                adding++; //mime add
                return true;
            });
            var fakeRegistry = new Registry();
            fakeRegistry.register(component, css);
            var rulez = new RuleSet(css); 
            expect(fakeRegistry.register).toHaveBeenCalledWith(component, css);
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rulez, component, 'path1');
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rulez, component, 'path2');
            expect(fakeRegistry._currentSheetIndex).toEqual(0);
            expect(adding).toEqual(2);
            expect(fakeRegistry._unsavedSheets.length).toEqual(2);

        });

        it ('should generate another styletag if the actual styletag is full', 
                                                ['raintime/css/registry', 'raintime/css/stylesheet',
                                                 'raintime/css/rule_set'],function(Registry, StyleSheet, RuleSet){

            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            StyleSheet.prototype.add.andCallFake(function (rule,css,file) {
                if(adding === 0) {
                    adding++;//just to add in a new styletag
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
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rules, component, 'path1');
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rules, component, 'path2');
            expect(adding).toEqual(1);
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
            Registry.prototype.save.andCallThrough();
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
            fakeRegistry.save();
            fakeRegistry.unregister(component);
            expect(removed).toBe(true);
        });
    });

    describe ("save method", function () {
       it("should call twice the write method",  ['raintime/css/registry', 'raintime/css/stylesheet',
                                    'raintime/css/rule_set'], function(Registry, StyleSheet, RuleSet){

            var countWrite = 0;
            Registry.prototype.register.andCallThrough();
            Registry.prototype.save.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            StyleSheet.prototype.write.andCallFake(function() {
                 countWrite++;//mime write
            });
            StyleSheet.prototype.add.andCallFake(function (rule,css,file) {
                adding++; //mime add
                return true;
            });
            var fakeRegistry = new Registry();
            fakeRegistry.register(component, css);
            fakeRegistry.save();
            expect(StyleSheet.prototype.write.calls.length).toEqual(2);
            expect(countWrite).toEqual(2);
            expect(fakeRegistry._unsavedSheets.length).toEqual(2);
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
            StyleSheet.prototype.add.andCallThrough();
            var fakeRegistry = new Registry();
            fakeRegistry.register(component, css);
            fakeRegistry.save();
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
            Registry.prototype.save.andCallThrough();
            StyleSheet.prototype.write.andCallThrough();
            var fakeRegistry = new Registry();
            var file2 = [{path: 'path3'},{path: 'path4'}];
            StyleSheet.prototype.add.andCallThrough();
            var fakeRegistry = new Registry();
            fakeRegistry.register(component, css);
            fakeRegistry.save();
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
