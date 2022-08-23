#!/usr/bin/env bash

ORIGARGS=("$@")

. scripts/env.sh

helpFunction() {
	echo "Usage: $0 <ganache | geth | infura> <http | ws>"
	exit 1 # Exit script after printing help
}

BACKEND=${ORIGARGS[0]}
MODE=${ORIGARGS[1]}
PROVIDER_URL=${ORIGARGS[2]}

SUPPORTED_BACKENDS=("ganache" "geth" "infura")
SUPPORTED_MODE=("http" "ws")

if [[ ! " ${SUPPORTED_BACKENDS[*]} " =~ " ${BACKEND} " ]]; then
	helpFunction
fi

if [[ ! " ${SUPPORTED_MODE[*]} " =~ " ${MODE} " ]]; then
	helpFunction
fi

echo "RPC client Provider: " $BACKEND
echo "RPC client Protocol: " $MODE

export WEB3_SYSTEM_TEST_PROVIDER="$MODE://localhost:$WEB3_SYSTEM_TEST_PORT"
export WEB3_SYSTEM_TEST_BACKEND=$BACKEND

cd test/black_box
yarn --update-checksums
yarn

# Without this tests will fail with:
# FetchError: request to http://localhost:8545/ failed, reason: connect ECONNREFUSED 127.0.0.1:854
# However if ${BACKEND} == "geth" || ${BACKEND} == "infura"
# This wait-port will cause the tests to hang and never finish
if [[ ${BACKEND} == "ganche" ]]
then
    npx wait-port -t 60000 $WEB3_SYSTEM_TEST_PORT
fi

if [[ ${BACKEND} == "infura" ]]
then
    if [ ! $INFURA_HTTP ] || [ ! $INFURA_WSS ]
    then
        echo "No Infura provider URL specified"
        exit 1
    elif [ $MODE == "http" ]
    then
        WEB3_SYSTEM_TEST_PROVIDER=$INFURA_HTTP yarn "test:$BACKEND:$MODE"
    else
        WEB3_SYSTEM_TEST_PROVIDER=$INFURA_WSS yarn "test:$BACKEND:$MODE"
    fi
else
    yarn "test:$BACKEND:$MODE"
fi
