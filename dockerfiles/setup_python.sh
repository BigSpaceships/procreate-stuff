#!/bin/sh

mkdir -p venv
python3 -m venv --system-site-packages /venv
/venv/bin/pip install -I biplist pillow
