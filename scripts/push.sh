#!/bin/sh

# Create a scratch directory
DEPLOY_TMP=`mktemp -d /tmp/dev-proxy-XXXXXX` || exit 1

# Copy the necessary assets
mkdir -p $DEPLOY_TMP/dev-proxy/keys
cp -R lib $DEPLOY_TMP/dev-proxy/
cp package.json $DEPLOY_TMP/dev-proxy/
cp keys/server.crt $DEPLOY_TMP/dev-proxy/keys/
cp keys/server.key $DEPLOY_TMP/dev-proxy/keys/
cp keys/rootCA.pem $DEPLOY_TMP/dev-proxy/keys/

# Package up the server
pushd $DEPLOY_TMP
tar -czf dev-proxy.tar.gz dev-proxy/
popd

# Push to the server (via SSH)
scp $DEPLOY_TMP/dev-proxy.tar.gz root@$1:/root/dev-proxy.tar.gz
scp scripts/prep.sh root@$1:/root/prep.sh

# Clean up
rm -rf $DEPLOY_TMP
