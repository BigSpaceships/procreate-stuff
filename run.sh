#!/bin/bash

$(cd rust && ./build-rust.sh)

docker run -it $(docker build -q .)

CONTAINERID=$(docker ps -alq)

mkdir -p output
docker cp $CONTAINERID:/app/temp/Document.xml ./output/Document.xml
docker cp $CONTAINERID:/app/temp/formatted-archive.json ./output/formatted-archive.json
