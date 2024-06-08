FROM alpine:latest

WORKDIR /app
RUN apk add unzip libplist-util python3 py3-pip

COPY setup_python.sh .
COPY process_plist.py .
# ADD rust/output/archive-parser ./archive-parser
ADD process_files.sh ./process_files.sh
ADD process_file.sh ./process_file.sh
ADD *.procreate ./files/

RUN chmod +x $(pwd)/process_files.sh
RUN chmod +x $(pwd)/process_file.sh

RUN ./setup_python.sh

CMD $(pwd)/process_files.sh

