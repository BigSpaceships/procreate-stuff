use std::{fs::{self, File}, io::{Read, Write}};

fn main() {
    let filename = "0-0.lz4";
    let mut file = File::open(&filename).expect("no file found");

    let metadata = fs::metadata(&filename).expect("cannot read metadata");

    let mut buffer = vec![0; metadata.len() as usize];

    file.read(&mut buffer).expect("buffer overflow");

    let mut decoder = lz4_flex::frame::FrameDecoder::new(buffer.as_slice());
    let mut dist = Vec::new();

    decoder.read_to_end(&mut dist).expect("could not decode file");

    let mut output_file = fs::OpenOptions::new()
        .create(true)
        .write(true)
        .open("output.chunk").expect("couldn't create output file");

    output_file.write_all(&dist).expect("could not write output file");
}
