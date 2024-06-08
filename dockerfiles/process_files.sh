#!/bin/sh

mkdir temp

mkdir output

files_processed=""

for file in files/* ; do
    sh ./process_file.sh $file

    if [ "$files_processed" == "" ]; then
        files_processed=${file}
    else
        files_processed="${files_processed}, ${file}"
    fi
done

echo "Processed filesystem: $files_processed"
