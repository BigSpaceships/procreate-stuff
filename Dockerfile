FROM alpine:latest

WORKDIR /app
RUN apk add unzip libplist-util python3 py3-pip 
RUN apk add py3-lzo lzfse --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing/

COPY dockerfiles/* .

ADD *.procreate ./files/

RUN ./setup_python.sh

CMD $(pwd)/process_files.sh
