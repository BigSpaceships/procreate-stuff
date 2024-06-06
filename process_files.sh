#!/bin/sh

mkdir temp

for file in files/* ; do
    sh ./process_file.sh $file
done

echo "Processed filesystem:"

ls -R

tar -cf archive.tar ./temp/20E37536-6F8C-42FA-A407-B938C4D90D78
