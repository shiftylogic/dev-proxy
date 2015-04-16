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
    events = require('events');

var HEADER_SIGNATURE = 0x1EAD10AD;

module.exports = function setupConnection(socket) {
    var emitter = new events.EventEmitter(),
        state = { emitter: emitter, socket: socket, incoming: 0 };

    socket.on('data', process.bind(null, state));

    socket.on('close', function () {
        emitter.emit('disconnect');
    });

    emitter.end = function () {
        socket.end();
    };

    emitter.send = sendPacket.bind(null, socket);

    return emitter;
};

function process(state, data) {
    if (state.incoming === 0) {
        parseHeader(state, data);
    } else {
        gather(state, data);
    }
}

function parseHeader(state, data) {
    if (data.length === 0) {
        state.incoming = 0;
        return;
    }

    var mark = data.readUInt32LE(0);

    if (mark !== HEADER_SIGNATURE) {
        state.emitter.emit('error', new Error('Invalid packet header'));
        state.socket.destroy();
        return;
    }

    state.incoming = data.readUInt32LE(4);
    state.buffer = new Buffer(state.incoming);
    state.offset = 0;

    gather(state, data.slice(8));
}

function gather(state, data) {
    if (data.length < state.incoming) {
        state.incoming -= data.length;
        data.copy(state.buffer, state.offset);
        state.offset += data.length;
    } else {
        data.copy(state.buffer, state.offset, 0, state.incoming);
        state.emitter.emit('packet', state.buffer);

        parseHeader(state, data.slice(state.incoming));
    }
}

function sendPacket(socket, packet) {
    guard(packet).isInstanceOf(Buffer).check();

    var header = new Buffer(8);
    header.writeUInt32LE(HEADER_SIGNATURE, 0);
    header.writeUInt32LE(packet.length, 4);
    socket.write(header);
    socket.write(packet);
}
