#!/bin/bash

# $(cd rust && ./build-rust.sh)

docker run -it $(docker build -q .)

CONTAINERID=$(docker ps -alq)

mkdir -p output
docker cp $CONTAINERID:/app/temp/Document.txt ./output/Document.txt
docker cp $CONTAINERID:/app/archive.tar ./output/archive.tar
# docker cp $CONTAINERID:/app/temp/formatted-archive.json ./output/formatted-archive.json

mkdir -p output/layer
tar -xvf ./output/archive.tar -C ./output/layer
