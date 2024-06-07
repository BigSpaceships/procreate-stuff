#!/bin/sh

mkdir -p /app/vpython-env

python3 -m venv /app/vpython-env

chmod +x /app/vpython-env/bin/activate
/app/vpython-env/bin/activate

pip install biplist
