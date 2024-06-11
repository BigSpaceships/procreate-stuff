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
        *)
            /venv/bin/python3 process_layer.py $folder
            ;;
    esac
done

tar -zcf $1.tar.gz -C ./temp . -X output_tar_exclude.txt
