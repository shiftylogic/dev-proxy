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
    net = require('net'),
    channel = require('./channel'),
    message = require('./message');


function initializeProxy(err, endpoint) {
    if (err) {
        throw err;
    }

    var server = net.createServer(),
        lastId = 0,
        clients = {};

    endpoint.on('packet', function (packet) {
        var msg = message.parse(packet);

        switch (msg.type) {
            case message.types.END_CLIENT:
                clients[msg.client].close();
                break;

            case message.types.DATA:
                clients[msg.client].write(msg.data);
                break;
        }
    });

    server.on('connection', function onConnection(client) {
        client.tunnelId = ++lastId;

        clients[client.tunnelId] = client;

        client.on('data', function (data) {
            endpoint.send(
                message.builder()
                    .type(message.types.DATA)
                    .client(client.tunnelId)
                    .data(data)
                    .create()
            );
        });

        client.on('close', function () {
            endpoint.send(
                message.builder()
                    .type(message.types.END_CLIENT)
                    .client(client.tunnelId)
                    .create()
            );

            delete clients[client.tunnelId];
        });

        endpoint.send(
            message.builder()
                .type(message.types.NEW_CLIENT)
                .client(client.tunnelId)
                .create()
        );
    });

    server.listen(7000);
}


module.exports = function startServer() {
    /*eslint-disable no-sync */
    var options = {
            cert: fs.readFileSync('keys/server.crt'),
            key: fs.readFileSync('keys/server.key'),
            ca: fs.readFileSync('keys/rootCA.pem'),
            bindPort: 5000
        };
    /*eslint-enable no-sync */

    return channel.server(options, initializeProxy);
};
