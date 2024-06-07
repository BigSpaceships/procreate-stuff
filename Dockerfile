FROM alpine:latest

WORKDIR /app
RUN apk add unzip libplist-util python3 py3-pip

ADD setup_python.sh ./setup_python.sh
RUN chmod +x $(pwd)/setup_python.sh
#RUN ./setup_python.sh

# ADD rust/output/archive-parser ./archive-parser
ADD process_files.sh ./process_files.sh
ADD process_file.sh ./process_file.sh
ADD *.procreate ./files/

RUN chmod +x $(pwd)/process_files.sh
RUN chmod +x $(pwd)/process_file.sh

# CMD $(pwd)/process_files.sh

