#!/bin/sh

# Create your own root CA
openssl genrsa -aes256 -out rootCA.key 4096
# Self-sign the root CA
openssl req \
    -x509 \
    -new \
    -nodes \
    -subj "/C=US/ST=WA/L=Seattle/O=Root/CN=root.shiftylogic.com" \
    -key rootCA.key \
    -days 1024 \
    -out rootCA.pem


# Create a server certificate
openssl genrsa -out server.key 4096
openssl req \
    -new \
    -subj "/C=US/ST=WA/L=Seattle/O=Root/CN=server.shiftylogic.com" \
    -key server.key \
    -out server.csr \
# And sign the server cert with the root CA key
openssl x509 \
    -req \
    -in server.csr \
    -CA rootCA.pem \
    -CAkey rootCA.key \
    -CAcreateserial \
    -out server.crt \
    -days 500


# Create a client certificate
openssl genrsa -out client.key 4096
openssl req \
    -new \
    -subj "/C=US/ST=WA/L=Seattle/O=Root/CN=client.shiftylogic.com" \
    -key client.key \
    -out client.csr \
# And sign the client cert with the root CA key
openssl x509 \
    -req \
    -in client.csr \
    -CA rootCA.pem \
    -CAkey rootCA.key \
    -CAcreateserial \
    -out client.crt \
    -days 500
