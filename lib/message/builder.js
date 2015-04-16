/*

The MIT License (MIT)

Copyright (c) 2015 Robert Anderson.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

'use strict';

var guard = require('sl-guard');

module.exports = function createBuilder() {
    var type, client, data,
        self = {
            type: setType,
            client: setClient,
            data: setData,
            create: create
        };

    return self;


    function setType(t) {
        guard(t).isNumber().check();

        type = t;

        return self;
    }

    function setClient(cli) {
        guard(cli).isNumber().check();

        client = cli;

        return self;
    }

    function setData(d) {
        guard(d).isInstanceOf(Buffer).isOptional().check();

        data = d;

        return self;
    }

    function create() {
        var len = 8,
            buffer;

        if (Buffer.isBuffer(data)) {
            len += data.length;
        }

        buffer = new Buffer(len);
        buffer.writeUInt32LE(type, 0);
        buffer.writeUInt32LE(client, 4);

        if (Buffer.isBuffer(data)) {
            data.copy(buffer, 8);
        }

        return buffer;
    }
};
