#!/bin/sh

mkdir temp

for file in files/* ; do
    sh ./process_file.sh $file
done

echo "Processed filesystem:"
