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

var fs = require('fs'),
    path = require('path'),
    net = require('net'),
    channel = require('./channel'),
    message = require('./message');


function createClient(endpoint, id) {
    var client = net.connect({
        port: 7000,
        host: '127.0.0.1'
    });

    client.on('data', function (httpData) {
        endpoint.send(
            message.builder()
                .type(message.types.DATA)
                .client(id)
                .data(httpData)
                .create()
        );
    });

    client.on('end', function () {
        endpoint.send(
            message.builder()
                .type(message.types.END_CLIENT)
                .client(id)
                .create()
        );
    });

    return client;
}

function initializeProxy(err, endpoint) {
    if (err) {
        throw err;
    }

    var clients = {};

    endpoint.on('packet', function (packet) {
        var msg = message.parse(packet);

        switch (msg.type) {
            case message.types.NEW_CLIENT:
                clients[msg.client] = createClient(endpoint, msg.client);
                break;

            case message.types.END_CLIENT:
                delete clients[msg.client];
                break;

            case message.types.DATA:
                clients[msg.client].write(msg.data);
                break;
        }
    });
}


module.exports = function startClient(host) {
    /*eslint-disable no-sync */
    var rootPath = path.dirname(require.main.filename),
        options = {
            host: host || '127.0.0.1',
            port: 5000,
            cert: fs.readFileSync(path.join(rootPath, '../keys/client.crt')),
            key: fs.readFileSync(path.join(rootPath, '../keys/client.key')),
            ca: fs.readFileSync(path.join(rootPath, '../keys/rootCA.pem'))
        };
    /*eslint-enable no-sync */

    channel.client(options, initializeProxy);
};
