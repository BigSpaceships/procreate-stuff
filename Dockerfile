FROM rust:slim-buster AS build

RUN USER=root cargo new --bin procreate-decoder
WORKDIR /procreate-decoder

COPY rust/Cargo.lock ./Cargo.lock
COPY rust/Cargo.toml ./Cargo.toml

COPY rust/libs/* .

RUN cargo build --release
RUN rm src/*.rs

COPY rust/src ./src

RUN ls -R ./target/release
RUN rm ./target/release/deps/procreate-decoder*
RUN cargo build --release

FROM debian:buster-slim

WORKDIR /app
# RUN apt update && apt install -y unzip python3 python3-pip
RUN apt update && apt install -y unzip

COPY dockerfiles/* .
COPY --from=build /procreate-decoder/target/release/procreate-decoder .

ADD *.procreate ./files/

# RUN ./setup_python.sh

CMD $(pwd)/process_files.sh
