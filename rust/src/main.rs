use std::{
    fs::{self, File}, io::{Cursor, Read, Write}
};

use thiserror::Error;
use zip::{read::ZipFile, ZipArchive};

#[derive(Debug, Error)]
enum ProcreateError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Zip error: {0}")]
    ZipError(#[from] zip::result::ZipError),
    #[error("LZ4 error: {0}")]
    LZ4Error(#[from] lz4_flex::frame::Error),
}

fn main() -> Result<(), ProcreateError> {

    let file = fs::OpenOptions::new().read(true).write(false).open("../Untitled_Artwork.procreate")?;

    let mapping = unsafe { memmap2::Mmap::map(&file)? };
    let mut archive = ZipArchive::new(Cursor::new(&mapping[..]))?;

    let mut zip_file = archive.by_name("20E37536-6F8C-42FA-A407-B938C4D90D78/0~2.lz4")?;

    let mut buffer = Vec::new();
    zip_file.read_to_end(&mut buffer)?;

    let mut decoder = lz4_flex::frame::FrameDecoder::new(buffer.as_slice());

    let mut dist = Vec::new();

    decoder.read_to_end(&mut dist)?;

    let mut output_file = fs::OpenOptions::new()
        .create(true)
        .write(true)
        .open("output.bmp").expect("couldn't create output file");

    // let mut output_file = fs::OpenOptions::new()
    //     .create(true)
    //     .write(true)
    //     .open("output.bmp").expect("couldn't create output file");

    output_file.write_all(&dist).expect("could not write output file");
    
    Ok(())
}
