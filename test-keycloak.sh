#!/bin/bash

AUTH_HOST=keycloak.192.168.49.2.nip.io
AUTH_PORT=443
#AUTH_REALM=master
#AUTH_PROTOCOL=https

# Keycloak OAuth client credentials
OAUTH_CLIENT_ID=mcpweather-client
OAUTH_CLIENT_SECRET=HFLjyBhlfn2WgQZWVBZ5ASItetLL04iW


echo $OAUTH_CLIENT_ID

curl -X POST -k \
  -d "client_id=${OAUTH_CLIENT_ID}" \
  -d "client_secret=${OAUTH_CLIENT_SECRET}" \
  -d "grant_type=client_credentials" \
  "https://${AUTH_HOST}/realms/master/protocol/openid-connect/token"



