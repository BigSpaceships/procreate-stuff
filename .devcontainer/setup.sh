## update and install some things we should probably have
apt-get update
apt-get install -y \
    pkg-config

## Install rustup and common components
curl https://sh.rustup.rs -sSf | sh -s -- -y 

source "$HOME/.cargo/env"

rustup target add x86_64-unknown-linux-musl
