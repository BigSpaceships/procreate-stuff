FROM alpine:latest

WORKDIR /app
RUN apk add unzip libplist-util python3 py3-pip

COPY dockerfiles/* .

ADD *.procreate ./files/

RUN ./setup_python.sh

CMD $(pwd)/process_files.sh

