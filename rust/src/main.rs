use std::{
    collections::HashMap,
    env,
    fs::{self},
    io::{Cursor, Read},
    num::ParseIntError,
    path::Path,
};

use image::{DynamicImage, GenericImage, ImageFormat, RgbaImage};
use lz4_flex::frame::FrameDecoder;
use thiserror::Error;
use zip::ZipArchive;

mod document;

#[derive(Debug, Error)]
enum ProcreateError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Zip error: {0}")]
    ZipError(#[from] zip::result::ZipError),
    #[error("LZ4 error: {0}")]
    LZ4Error(#[from] lz4_flex::frame::Error),
    #[error("Image erorr: {0}")]
    ImageError(#[from] image::ImageError),
    #[error("Plist error: {0}")]
    PlistError(#[from] plist::Error),
    #[error("Plist parse error: {0}")]
    PlistParseError(#[from] document::PlistParseError),
    #[error("Serde error: {0}")]
    SerdeError(#[from] serde_json::Error),
    #[error("Invalid input file: {0}")]
    InvalidInput(String),
    #[error("buffer was too small")]
    ImageBufferError,
    #[error("could not convert string to int")]
    IntegerParseError(#[from] ParseIntError),
}

#[derive(Debug)]
struct Layer {
    uuid: String,
    chunks: Vec<String>,
}

fn main() -> Result<(), ProcreateError> {
    let args: Vec<String> = env::args().collect();

    let file_name = args
        .get(1)
        .map(|name| name.as_str())
        .unwrap_or("Untitled_Artwork.procreate");

    if !file_name.ends_with(".procreate") {
        // TODO: better input sanitization
        return Err(ProcreateError::InvalidInput(file_name.to_string().clone()));
    }

    let procreate_file = fs::OpenOptions::new()
        .read(true)
        .write(false)
        .open(file_name)?;

    let mapping = unsafe { memmap2::Mmap::map(&procreate_file)? };
    let mut archive = ZipArchive::new(Cursor::new(&mapping[..]))?;

    let doc = document::Document::import_plist(&mut archive)?;

    let mut layers: HashMap<String, Layer> = HashMap::new();

    for i in 0..(archive.len().clone()) {
        let file = archive.by_index(i)?;

        let file_path = file.name().to_owned();

        if !file_path.contains(".lz4") {
            continue;
        }

        let layer_name = file_path.split('/').collect::<Vec<_>>()[0];

        let file_name = file_path.split('/').collect::<Vec<_>>()[1];

        if !layers.contains_key(layer_name) {
            layers.insert(
                layer_name.to_string(),
                Layer {
                    uuid: layer_name.to_string(),
                    chunks: Vec::new(),
                },
            );
        }

        let layer = layers.get_mut(layer_name).unwrap();

        layer.chunks.push(file_name.to_string());
    }

    if !Path::new("temp").exists() {
        fs::create_dir("temp")?;
    }

    let doc_json_file = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .open("temp/Document.json")?;
    serde_json::to_writer_pretty(doc_json_file, &doc)?;

    for layer in layers.values() {
        let mut image = DynamicImage::new_rgba8(2056, 2056);

        for i in 0..layer.chunks.len() {
            let mut chunk_file =
                archive.by_name(format!("{}/{}", layer.uuid, layer.chunks[i]).as_str())?;

            let mut encoded_bytes = Vec::new();

            chunk_file.read_to_end(&mut encoded_bytes)?;

            let mut decoder = FrameDecoder::new(encoded_bytes.as_slice());
            let mut decoded_bytes = Vec::new();

            decoder.read_to_end(&mut decoded_bytes)?;

            let chunk_image = RgbaImage::from_raw(256, 256, decoded_bytes.to_vec())
                .ok_or(ProcreateError::ImageBufferError)?;

            let chunk_name = layer.chunks[i].split('.').collect::<Vec<_>>()[0];

            let x = u32::from_str_radix(chunk_name.split('~').collect::<Vec<_>>()[0], 10)?;
            let y = u32::from_str_radix(chunk_name.split('~').collect::<Vec<_>>()[1], 10)?;

            image.copy_from(&chunk_image, x * 256, y * 256)?;
        }

        match doc.orientation {
            2 => image = image.rotate180(),
            3 => image = image.rotate270(),
            4 => image = image.rotate90(),
            _ => {}
        };

        if doc.flipped_horizontally {
            image = image.fliph();
        }

        image.save_with_format(format!("temp/{}.png", layer.uuid), ImageFormat::Png)?;

        println!("processed layer {}", layer.uuid);
    }

    Ok(())
}
