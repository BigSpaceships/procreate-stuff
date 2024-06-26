FROM rust:slim-buster AS build

RUN USER=root cargo new --bin procreate-decoder
WORKDIR /procreate-decoder

COPY ./rust/Cargo.lock ./Cargo.lock
COPY ./rust/Cargo.toml ./Cargo.toml

COPY ./rust/libs ./libs

RUN cargo build --release
RUN rm src/*.rs

# copy your source tree
COPY ./rust/src ./src

# build for release
RUN touch ./src/main.rs
RUN cargo build --release

FROM debian:buster-slim

WORKDIR /app
RUN apt update && apt install -y unzip

COPY dockerfiles/* .
COPY --from=build /procreate-decoder/target/release/procreate-decoder .

ADD *.procreate ./files/

# RUN ./setup_python.sh

CMD $(pwd)/process_files.sh
