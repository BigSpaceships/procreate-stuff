#!/bin/bash

# $(cd rust && cargo build --release)
# cp rust/target/release/lz4-decoder dockerfiles/lz4-decoder

image_id=$(docker build -q .)
docker run -it $image_id

container_id=$(docker ps -alq)

mkdir -p output
docker cp $container_id:/app/archive.tar.gz ./output/archive.tar.gz
# docker cp $CONTAINERID:/app/temp/formatted-archive.json ./output/formatted-archive.json

mkdir -p output/layer
tar -xvzf ./output/archive.tar.gz -C ./output

rm dockerfiles/lz4-decoder

docker container rm $container_id
docker image rm $image_id
