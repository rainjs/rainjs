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

    describe('Load CSS', function () {

        beforeEach(function () {
            var head = $('head');
            head.find('link').remove();
        });

        it('must not call the callback if there aren\'t any CSS files',
           ['core/js/client_rendering'],
           function (clientRenderer) {
                clientRenderer._loadCSS.andCallThrough();
                clientRenderer._loadCSS([], function () {
                    expect(true).toBe(false);
                });
           }
        );

        it('must insert the CSS files into the page as link tags',
           ['core/js/client_rendering'],
           function (clientRenderer) {
                var head = $('head'),
                    linksLength = head.find('link').length,
                    cssFiles = [
                        {
                            path: '/example/3.0/css/index.css'
                        },
                        {
                            path: '/example/3.0/css/accordion.css'
                        }
                    ],
                    insertFinished = false;

                runs(function () {
                    clientRenderer._loadCSS.andCallThrough();
                    clientRenderer._loadCSS(cssFiles, function () {
                        insertFinished = true;
                    });
                });

                waitsFor(function () {
                    return insertFinished;
                });

                runs(function () {
                    var newCssFilesLength = head.find('link').length;
                    expect(linksLength + cssFiles.length).toBe(newCssFilesLength);
                });
           }
        );

        it('must not insert the CSS files because they are already there',
           ['core/js/client_rendering'],
           function (clientRenderer) {
                var head = $('head'),
                    linksLength,
                    cssFiles = [
                        {
                            path: '/example/3.0/css/index.css'
                        }
                    ],
                    insertFinished = false;

                head.append('<link href="/example/3.0/css/index.css" />');
                linksLength = head.find('link').length;
                console.log(linksLength);

                runs(function () {
                    clientRenderer._loadCSS.andCallThrough();
                    clientRenderer._loadCSS(cssFiles, function () {
                        insertFinished = true;
                    });
                });

                waitsFor(function () {
                    return insertFinished;
                });

                runs(function () {
                    var newCssFilesLength = head.find('link').length;
                    expect(linksLength).toBe(newCssFilesLength);
                });
           }
        );

        it('must insert only the CSS files that aren\'t already there',
           ['core/js/client_rendering'],
           function (clientRenderer) {
                var head = $('head'),
                    linksLength,
                    cssFiles = [
                        {
                            path: '/example/3.0/css/index.css'
                        },
                        {
                            path: '/example/3.0/css/accordion.css'
                        }
                    ],
                    insertFinished = false;

                head.append('<link href="/example/3.0/css/index.css" />');
                linksLength = head.find('link').length;
                console.log(linksLength, head);

                runs(function () {
                    clientRenderer._loadCSS.andCallThrough();
                    clientRenderer._loadCSS(cssFiles, function () {
                        insertFinished = true;
                    });
                });

                waitsFor(function () {
                    return insertFinished;
                });

                runs(function () {
                    var newCssFilesLength = head.find('link').length;
                    expect(linksLength + 1).toBe(newCssFilesLength);
                });
           }
        );

        it('must add the media attribute to the link tags',
           ['core/js/client_rendering'],
           function (clientRenderer) {
                var head = $('head'),
                    media = 'max-width: 800px',
                    cssFiles = [
                        {
                            path: '/example/3.0/css/index.css',
                            media: media
                        }
                    ],
                    insertFinished = false;

                runs(function () {
                    clientRenderer._loadCSS.andCallThrough();
                    clientRenderer._loadCSS(cssFiles, function () {
                        insertFinished = true;
                    });
                });

                waitsFor(function () {
                    return insertFinished;
                });

                runs(function () {
                    expect(head.find('link[media="' + media + '"]').length).toBe(1);
                });
           }
        );
    });
});
