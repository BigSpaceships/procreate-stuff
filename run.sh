#!/bin/bash

$(cd rust && ./build-rust.sh)

docker run -it $(docker build -q .)

CONTAINERID=$(docker ps -alq)

docker cp $CONTAINERID:/app/temp/Document.txt ./output/Document.txt
