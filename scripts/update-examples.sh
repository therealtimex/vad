#!/usr/bin/env bash

set +x

(
    cd examples/bundler
    npm remove @realtimex/vad-web
    npm i @realtimex/vad-web@latest
    npm run clean
    npm run build
)

(
    cd examples/react-bundler
    npm remove @realtimex/vad-react
    npm i @realtimex/vad-react@latest
    npm run clean
    npm run build
)

(
    cd examples/nextjs
    npm remove @realtimex/vad-react
    npm i @realtimex/vad-react@latest
    npm run build
)

(
    cd examples/script-tags
    latest_version=$(wget -O - https://cdn.jsdelivr.net/npm/@realtimex/vad-web/ \
        | grep -oP "@realtimex/vad-web@\d+\.\d+\.\d+" \
        | head -1 \
        | grep -oP "\d+\.\d+\.\d+"
    )
    sed -i "s/@realtimex\/vad-web@[[:digit:]]\+\.[[:digit:]]\+\.[[:digit:]]\+/@realtimex\/vad-web@$latest_version/g" \
        index.html
)
