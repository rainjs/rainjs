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

"use strict";

var BaseSession = loadModuleExports('/lib/base_session.js');

describe('Base session with dirty keys functionality', function () {

    var sessionData, component;

    beforeEach(function () {
        sessionData = {
            a: 1,
            b: 2,
            c: 3,
            d: 4
        };
        component = {
            id: 'example'
        };
    });

    it('should set the default data', function () {
        var session = new BaseSession(sessionData, component);
        expect(session._session).toEqual(sessionData);
        expect(session._component).toEqual(component);
        expect(session._updatedKeys).toEqual([]);
        expect(session._removedKeys).toEqual([]);
    });

    it('should get the key value', function () {
        var session = new BaseSession(sessionData, component);

        expect(session.get('a')).toBe(1);
        expect(session._updatedKeys).toEqual([]);
        expect(session._removedKeys).toEqual([]);
    });

    it('should set a new key', function () {
        var session = new BaseSession(sessionData, component);
        session.set('z', 10);

        expect(session._session['z']).toBe(10);
        expect(session._updatedKeys).toEqual(['z']);
        expect(session._removedKeys).toEqual([]);

        session.set('x', 11);
        session.set('z', 12);
        session.set('a', 13);
        expect(session._session['x']).toBe(11);
        expect(session._session['z']).toBe(12);
        expect(session._session['a']).toBe(13);
        expect(session._updatedKeys).toEqual(['z', 'x', 'a']);
        expect(session._removedKeys).toEqual([]);
    });

    it('should remove a key', function () {
        var session = new BaseSession(sessionData, component);
        session.remove('c');
        session.remove('d');
        session.remove('z');

        expect(typeof session._session['c'] === 'undefined').toBe(true);
        expect(typeof session._session['d'] === 'undefined').toBe(true);
        expect(typeof session._session['z'] === 'undefined').toBe(true);
        expect(Object.keys(session._session)).toEqual(['a', 'b']);
        expect(session._updatedKeys).toEqual([]);
        expect(session._removedKeys).toEqual(['c', 'd']);
    });

    it('should remove all keys', function () {
        var session = new BaseSession(sessionData, component);
        session.set('z', 10);
        session.removeAll();

        expect(session._session).toEqual({});
        expect(session._updatedKeys).toEqual([]);
        expect(session._removedKeys).toEqual(['a', 'b', 'c', 'd', 'z']);
    });
});
