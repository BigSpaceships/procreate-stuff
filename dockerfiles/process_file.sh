#!/bin/sh

rm -rf ./temp
mkdir -p temp

unzip -q $1 -d ./temp

/venv/bin/python3 process_plist.py /app/temp/Document.archive

tar -zcvf $1.tar.gz -C ./temp . -X output_tar_exclude.txt
