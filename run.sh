#!/bin/bash
docker run -it $(docker build -q .)

CONTAINERID=$(docker ps -alq)

docker cp $CONTAINERID:/app/temp/Document.txt ./Document.txt
