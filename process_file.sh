#!/bin/sh

unzip -q $1 -d ./temp

plistutil -i ./temp/Document.archive -o ./temp/Document.txt
