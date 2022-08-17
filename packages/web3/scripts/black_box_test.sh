#!/usr/bin/env bash

ORIGARGS=("$@")

. scripts/env.sh

# Exit immediately on error
set -o errexit

helpFunction() {
	echo "Usage: $0 <ganache | geth | infura> <http | ws> <provider-url>"
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

echo "RPC client software: " $BACKEND
echo "RPC client URL: " $MODE

export WEB3_SYSTEM_TEST_PROVIDER="$MODE://localhost:$WEB3_SYSTEM_TEST_PORT"
export WEB3_SYSTEM_TEST_BACKEND=$BACKEND

cd test/black_box
yarn config set registry http://localhost:4873
yarn

if [[ ${BACKEND} == "infura" ]]
then
    if [[ ! ${PROVIDER_URL} ]]
    then
        echo "No Infura provider URL specified"
        exit 1
    else
        WEB3_SYSTEM_TEST_PROVIDER=$WEB3_SYSTEM_TEST_PROVIDER yarn "test:$BACKEND:$MODE"
    fi
else
    yarn "test:$BACKEND:$MODE"
fi
