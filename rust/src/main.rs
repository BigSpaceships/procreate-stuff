use std::{
    any::Any, env, fs::{self, File}, io::{Cursor, Read, Write}
};

use lz4_flex::frame::FrameDecoder;
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
    #[error("Invalid input file: {0}")]
    InvalidInput(String),
}

fn main() -> Result<(), ProcreateError> {
    let args: Vec<String> = env::args().collect();

    if !args[1].ends_with(".procreate") { // TODO: better input sanitization
        return Err(ProcreateError::InvalidInput(args[1].clone()));
    }

    let procreate_file = fs::OpenOptions::new().read(true).write(false).open(args[1].clone())?;

    let target_layer = args[2].clone();

    let mapping = unsafe { memmap2::Mmap::map(&procreate_file)? };
    let mut archive = ZipArchive::new(Cursor::new(&mapping[..]))?;

    for i in 0..(archive.len().clone()) {
        let mut file = archive.by_index(i)?;

        let file_path = file.name().to_owned();

        if !file_path.contains(".lz4") {
            continue;
        }

        let layer_name = file_path.split('/').collect::<Vec<_>>()[0];

        if !(layer_name.contains(target_layer.as_str()) || target_layer.contains(layer_name)) {
            // println!("{} is not on target layer {}", layer_name, target_layer);
            continue;
        }

        let file_name_with_extension = file_path.split('/').collect::<Vec<_>>()[1];

        let file_name = file_name_with_extension.split('.').collect::<Vec<_>>()[0];

        // println!("layer: {}, file: {}", layer_name, file_name);

        let mut buffer = Vec::new();

        file.read_to_end(&mut buffer)?;

        let mut decoder = FrameDecoder::new(buffer.as_slice());

        let mut dist = Vec::new();

        decoder.read_to_end(&mut dist)?;

        let mut output_file = fs::OpenOptions::new()
            .create(true)
            .write(true)
            .open(format!("temp/{}/{}.output", layer_name, file_name))?;

        output_file.write_all(&dist)?;
    }
    
    Ok(())
}
