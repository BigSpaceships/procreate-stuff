#!/bin/sh

rm -rf ./temp
mkdir -p temp

unzip -q $1 -d ./temp

cp $1 ./temp/file.procreate

# /venv/bin/python3 process_plist.py /app/temp/Document.archive

echo "processing layers"
./procreate-decoder ./temp/file.procreate

cp temp/Document.json output/
cp temp/QuickLook/Thumbnail.png output/
cp temp/*.bmp output/

tar -zcvf archive.tar.gz -C ./output .
