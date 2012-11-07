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
            content: '.rule1{}'
                },
                path2 : { length: 1,
                    ruleCount: 1,
                    content: '.rule2{}'
                        }
    };
    file = ['path1','path2'];
    rule =  { start : 0, style : {id: 0} };
    });
    describe('register method', function () {
        it('should add to the current styleSheet',['raintime/css/registry','raintime/css/stylesheet',
                                                   'raintime/css/rule_set'],function(Registry,StyleSheet,RuleSet){
            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            StyleSheet.prototype.add.andCallFake(function (rule,css,file) {
                adding++; //mime add
                return true;
            });
            var fakeRegistry = new Registry();
            fakeRegistry.register(component,css);
            var rulez = new RuleSet(css); 
            expect(fakeRegistry.register).toHaveBeenCalledWith(component,css);
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rulez,component,'path1');
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rulez,component,'path2');
            expect(fakeRegistry._currentSheetIndex).toEqual(0);
            expect(adding).toEqual(2);
            expect(fakeRegistry._unsavedSheets.length).toEqual(2);
        });

        it ('should generate another styletag if the actual styletag is full', ['raintime/css/registry','raintime/css/stylesheet',
                                                                             'raintime/css/rule_set'],function(Registry,StyleSheet,RuleSet){
            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            StyleSheet.prototype.add.andCallFake(function (rule,css,file) {
                if(adding === 0){
                    adding++;
                    return false;
                }
                else {
                    return true;
                }
            });
            var fakeRegistry = new Registry();
            fakeRegistry.register(component,css);
            var rulez = new RuleSet(css);
            expect(fakeRegistry.register).toHaveBeenCalledWith(component,css);
            expect(fakeRegistry._currentSheetIndex).toEqual(1);
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rulez,component,'path1');
            expect(StyleSheet.prototype.add).toHaveBeenCalledWith(rulez,component,'path2');
            expect(adding).toEqual(1);
            expect(StyleSheet.prototype.add.calls.length).toEqual(3);
            expect(fakeRegistry._unsavedSheets.length).toEqual(2);
        });
        it ('should generate an error message if the max style tags is reached', ['raintime/css/registry','raintime/css/stylesheet',
                                                                                  'raintime/css/rule_set'],function(Registry,StyleSheet,RuleSet){
            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            Registry.prototype._getRulesWithin.andCallThrough();
            Registry.prototype._collectWhitespace.andCallThrough();
            StyleSheet.prototype.add.andCallFake(function (rule,css,file) {
                    adding++;
                    return false;
            });
            StyleSheet.prototype.getFreeSpace.andReturn(0);
            var fakeRegistry = new Registry();
            var success = fakeRegistry.register(component,css);
            var rulez = new RuleSet(css);
            expect(fakeRegistry.register).toHaveBeenCalledWith(component,css);
            expect(fakeRegistry._currentSheetIndex).toEqual(31);
            expect(success).toBe(false);
        });
        xit ('should make cleanup if it has space', ['raintime/css/registry','raintime/css/stylesheet',
                                                                                  'raintime/css/rule_set'],function(Registry,StyleSheet,RuleSet){
            Registry.prototype.register.andCallThrough();
            Registry.prototype._insert.andCallThrough();
            Registry.prototype._getRulesWithin.andCallThrough();
            Registry.prototype._collectWhitespace.andCallThrough();
            StyleSheet.prototype.add.andCallFake(function (rule,css,file) {
                if (adding === 0) {
                    adding++;
                    return true;
                }
                else {
                    return false;
                }
            });
            StyleSheet.prototype.getFreeSpace.andReturn(1);
            var fakeRegistry = new Registry();
            fakeRegistry.register(component,css);
            var success = fakeRegistry.register(component,css);
            var rulez = new RuleSet(css);
            expect(fakeRegistry.register).toHaveBeenCalledWith(component,css);
            expect(fakeRegistry._currentSheetIndex).toEqual(31);
            expect(success).toBe(true);
        });
        
    });
    describe("unregister method", function(){
        xit("should remove a css",  ['raintime/css/registry','raintime/css/stylesheet',
                                    'raintime/css/rule_set'], function(Registry, StyleSheet, RuleSet){
            var removed = false;
            Registry.prototype.unregister.andCallThrough();
            Registry.prototype._remove.andCallThrough();
            StyleSheet.prototype.remove.andCallFake(function(rule) {
                removed = true;
            });
            
            expect(removed).toBe(true);
        });
    });

});