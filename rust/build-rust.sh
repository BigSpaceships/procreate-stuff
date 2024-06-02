cargo build --target x86_64-unknown-linux-musl

mkdir -p output
cp ./target/x86_64-unknown-linux-musl/debug/rust ./output/archive-parser
