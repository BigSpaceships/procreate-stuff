#!/bin/sh

rm -rf ./temp
mkdir -p temp

unzip -q $1 -d ./temp

cp $1 ./temp/file.procreate

/venv/bin/python3 process_plist.py /app/temp/Document.archive

for folder in temp/* ; do
    case $folder in 
        "temp/Document.archive") ;;
        "temp/Document.json") ;;
        "temp/video") ;;
        "temp/QuickLook") ;;
        "temp/file.procreate") ;;
        *)
            rm -r $folder/*
            ./lz4-decoder ./temp/file.procreate $folder
            /venv/bin/python3 process_layer.py $folder
            ;;
    esac
done

cp temp/Document.json output/
cp temp/QuickLook/Thumbnail.png output/
cp temp/*.bmp output/

tar -zcvf archive.tar.gz -C ./output .
