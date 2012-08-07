// Copyright © 2012 rainjs
//
// All rights reserved
//
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//    2. Redistributions in binary form must reproduce the above copyright notice, this list of
//       conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//    3. Neither the name of The author nor the names of its contributors may be used to endorse or
//       promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
// SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
// IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

describe('Client Renderer', function () {
    var Mocks, cr;

    beforeEach(function () {
        Mocks = {};
    });

    function setup(ClientRenderer) {
        ClientRenderer.get.andCallFake(function () {
                return new ClientRenderer});

        Mocks.Sockets = jasmine.loadedModules['raintime/messaging/sockets'];
        Mocks.Sockets.getSocket.andReturn({ on: jasmine.createSpy() });

        cr = ClientRenderer.get();
    }

    describe('Load CSS', function () {
        var head;

        beforeEach(function () {
            head = $('head');
            head.find('link').remove();
        });

        it('should not call the callback if there aren\'t any CSS files',
           ['core/js/client_rendering'],
           function (ClientRenderer) {
                setup(ClientRenderer);
                ClientRenderer.prototype._loadCSS.andCallThrough();

                var callback = jasmine.createSpy();

                cr._loadCSS([], callback);

                expect(callback).not.toHaveBeenCalled();
           }
        );

        it('should insert the CSS files into the page as link tags',
           ['core/js/client_rendering'],
           function (ClientRenderer) {
                setup(ClientRenderer);
                ClientRenderer.prototype._loadCSS.andCallThrough();

                var linksLength = head.find('link').length,
                    cssFiles = [{
                            path: '/example/3.0/css/index.css'
                        }, {
                            path: '/example/3.0/css/accordion.css'
                    }],
                    insertFinished = false;

                runs(function () {
                    ClientRenderer.get()._loadCSS(cssFiles,
                            function () { insertFinished = true; });
                });

                waitsFor(function () {
                    return insertFinished;
                }, 'link tags to be inserted in the page head');

                runs(function () {
                    var newCssFilesLength = head.find('link').length;
                    expect(linksLength + cssFiles.length).toEqual(newCssFilesLength);
                });
           }
        );

        it('should not insert the CSS files because they are already there',
           ['core/js/client_rendering'],
           function (ClientRenderer) {
                setup(ClientRenderer);
                ClientRenderer.prototype._loadCSS.andCallThrough();

                var linksLength,
                    cssFiles = [
                        {
                            path: '/example/3.0/css/index.css'
                        }
                    ],
                    insertFinished = false;

                head.append('<link href="/example/3.0/css/index.css">');
                linksLength = head.find('link').length;

                runs(function () {
                    ClientRenderer.get()._loadCSS(cssFiles, function () {
                        insertFinished = true;
                    });
                });

                waitsFor(function () {
                    return insertFinished;
                }, 'link tags to be inserted in the page head');

                runs(function () {
                    var newCssFilesLength = head.find('link').length;
                    expect(linksLength).toEqual(newCssFilesLength);
                });
           }
        );

        it('should insert only the CSS files that aren\'t already there',
           ['core/js/client_rendering'],
           function (ClientRenderer) {
                setup(ClientRenderer);
                ClientRenderer.prototype._loadCSS.andCallThrough();

                var linksLength,
                    cssFiles = [
                        {
                            path: '/example/3.0/css/index.css'
                        },
                        {
                            path: '/example/3.0/css/accordion.css'
                        }
                    ],
                    insertFinished = false;

                head.append('<link href="/example/3.0/css/index.css">');
                linksLength = head.find('link').length;

                runs(function () {
                    ClientRenderer.get()._loadCSS(cssFiles, function () {
                        insertFinished = true;
                    });
                });

                waitsFor(function () {
                    return insertFinished;
                }, 'link tags to be inserted in the page head');

                runs(function () {
                    var newCssFilesLength = head.find('link').length;
                    expect(linksLength + 1).toEqual(newCssFilesLength);
                });
           }
        );

        it('should add the media attribute to the link tags',
           ['core/js/client_rendering'],
           function (ClientRenderer) {
                setup(ClientRenderer);
                ClientRenderer.prototype._loadCSS.andCallThrough();

                var media = 'max-width: 800px',
                    cssFiles = [
                        {
                            path: '/example/3.0/css/index.css',
                            media: media
                        }
                    ],
                    insertFinished = false;

                runs(function () {
                    ClientRenderer.get()._loadCSS(cssFiles, function () {
                        insertFinished = true;
                    });
                });

                waitsFor(function () {
                    return insertFinished;
                }, 'link tags to be inserted in the page head');

                runs(function () {
                    expect(head.find('link[media="' + media + '"]').length).toEqual(1);
                });
           }
        );
    });

    describe('render component', function () {
        var dcmp1, dcmp2;

        beforeEach(function () {
            dcmp1 = {
                instanceId: 'ff44aa',
                containerId: 'ec038f',
                id: 'component',
                version: '1.0'
            };
            dcmp2 = {
                instanceId: 'ff44bb',
                containerId: 'ec038f',
                id: 'component',
                version: '2.6.89'
            };
            dcnt = {
                instanceId: 'ec038f',
                id: 'container',
                version: '1.5.2'
            };
        });

        it('should add an orhpan component to its container\'s orphans list',
                ['core/js/client_rendering'],
                function (ClientRenderer) {

            setup(ClientRenderer);
            ClientRenderer.prototype.renderComponent.andCallThrough();

            cr.renderComponent(dcmp1);

            expect(cr.orphans[dcmp1.containerId].length).toEqual(1);
            expect(cr.orphans[dcmp1.containerId]).toContain(dcmp1);
        });

        it('should add multiple orhpan components to their container\'s orhpans list',
                ['core/js/client_rendering'],
                function (ClientRenderer) {

            setup(ClientRenderer);
            ClientRenderer.prototype.renderComponent.andCallThrough();

            cr.renderComponent(dcmp1);
            cr.renderComponent(dcmp2);

            expect(cr.orphans[dcmp1.containerId].length).toEqual(2);
            expect(cr.orphans[dcmp1.containerId]).toContain(dcmp1);
            expect(cr.orphans[dcmp1.containerId]).toContain(dcmp2);
        });

        it('should render the orhpan components when the container arrives',
                ['core/js/client_rendering'],
                function (ClientRenderer) {

            setup(ClientRenderer);
            ClientRenderer.prototype.renderComponent.andCallThrough();

            this.after(function () {
                $('#' + dcmp1.instanceId
                    + ',#' + dcmp1.instanceId
                    + ',#' + dcnt.instanceId).remove();
            });

            cr.renderComponent(dcmp1);
            cr.renderComponent(dcmp2);

            expect(cr.orphans[dcnt.instanceId].length).toEqual(2);
            expect(cr.orphans[dcnt.instanceId]).toContain(dcmp1);
            expect(cr.orphans[dcnt.instanceId]).toContain(dcmp2);

            var html = [
                '<div id="' + dcmp1.instanceId + '"></div>',
                '<div id="' + dcmp2.instanceId + '"></div>',
                '<div id="' + dcnt.instanceId + '"></div>'
            ];
            $('body').append(html.join('\n'));

            cr.renderComponent(dcnt);

            var f = ClientRenderer.prototype.renderComponent;

            expect(f.argsForCall[3][0]).toEqual(dcmp1);
            expect(f.argsForCall[4][0]).toEqual(dcmp2);

            expect(cr.orphans[dcnt.instanceId]).not.toBeDefined();
        });

    });
});
