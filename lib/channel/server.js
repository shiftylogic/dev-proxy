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

module.exports = function startServer(options, cb) {
    guard(options).check();
    guard(options.cert).isInstanceOf(Buffer).check();
    guard(options.key).isInstanceOf(Buffer).check();
    guard(options.ca).isInstanceOf(Buffer).isOptional().check();
    guard(options.bindPort).isNumber().check();
    guard(options.bindAddress).isString().isNotEmpty().isOptional().check();
    guard(cb).isFunction().check();

    var caSet = !options.ca ? options.ca : [options.ca],    // If this is a string wrap in array, otherwise leave untouched.
        config = {
            cert: options.cert,
            key: options.key,
            ca: caSet,
            requestCert: true
        },
        server = tls.createServer(config);

    server.maxConnections = 1;

    server.on('secureConnection', function onNewConnection(socket) {
        if (!socket.authorized) {
            cb(new Error('unauthorized'));
            socket.close();
            return;
        }

        cb(null, wrap(socket));
    });

    server.on('clientError', function onClientError(err, socket) {
        socket.close();
        cb(err);
    });

    server.on('error', function (err) {
        server.close();
        cb(err);
    });

    server.listen(options.bindPort, options.bindAddress);


    return Object.freeze({
        shutdown: function shutdownServer() {
            server.close();
        }
    });
};
