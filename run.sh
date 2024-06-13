#!/bin/bash

$(cd rust && cargo build --target x86_64-unknown-linux-musl)
cp rust/target/x86_64-unknown-linux-musl/debug/lz4-decoder dockerfiles/lz4-decoder

docker run --memory=10gb -it $(docker build -q .)

CONTAINERID=$(docker ps -alq)

mkdir -p output
docker cp $CONTAINERID:/app/temp/Document.txt ./output/Document.txt
docker cp $CONTAINERID:/app/archive.tar.gz ./output/archive.tar.gz
# docker cp $CONTAINERID:/app/temp/formatted-archive.json ./output/formatted-archive.json

mkdir -p output/layer
tar -xvzf ./output/archive.tar.gz -C ./output

rm dockerfiles/lz4-decoder
