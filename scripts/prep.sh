#!/bin/bash

if [ "$1" == "tools" ]
then
    apt-get install build-essential libssl-dev

    curl https://raw.githubusercontent.com/creationix/nvm/v0.24.1/install.sh | bash
    source ~/.nvm/nvm.sh

    # export NVM_DIR="~/.nvm"
    # [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

    nvm install stable
    npm install forever -g
else
    source ~/.nvm/nvm.sh

    # export NVM_DIR="~/.nvm"
    # [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

    # Make sure node is ready
    nvm use stable

    # Stop any existing instances
    forever stopall

    # Dump the old
    rm -rf dev-proxy/
    rm .forever/*.log

    # Unpack the new
    tar xf dev-proxy.tar.gz

    # Install modules
    cd dev-proxy
    npm install --production
    cd ..

    # Install / launch
    forever start dev-proxy/lib/app.js
fi
