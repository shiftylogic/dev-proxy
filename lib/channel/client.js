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

var guard = require('sl-guard'),
    tls = require('tls'),
    wrap = require('./wrapper');

module.exports = function startClient(options, cb) {
    guard(options).check();
    guard(options.cert).isInstanceOf(Buffer).check();
    guard(options.key).isInstanceOf(Buffer).check();
    guard(options.ca).isInstanceOf(Buffer).isOptional().check();
    guard(options.port).isNumber().check();
    guard(options.host).isString().isNotEmpty().isOptional().check();
    guard(cb).isFunction().check();

    var caSet = !options.ca ? options.ca : [options.ca],    // If this is a string wrap in array, otherwise leave untouched.
        config = {
            host: options.host || '127.0.0.1',
            port: options.port,
            cert: options.cert,
            key: options.key,
            ca: caSet,
            checkServerIdentity: validateServer
        },
        socket = tls.connect(config, onConnect);

    socket.on('error', function (err) {
        socket.close();
        cb(err);
    });


    function onConnect() {
        if (!socket.authorized) {
            cb(new Error('unauthorized'));
            socket.close();
            return;
        }

        cb(null, wrap(socket));
    }
};


function validateServer(/*serverName, cert*/) {
    // Returning anything but undefined will cause authorization to fail.
}
