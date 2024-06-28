use std::io::{Cursor, Read};

use plist::{Dictionary, Value};
use serde::Serialize;
use thiserror::Error;
use zip::ZipArchive;

use crate::ProcreateError;

#[derive(Debug, Serialize)]
pub struct Layer {
    uuid: String,
    width: u64,
    height: u64,
    blend_mode: u64,
    opacity: f64,
    locked: bool,
    hidden: bool,
    name: Option<String>,
    clipped: bool,
}

#[derive(Debug, Serialize)]
pub struct Color {
    r: f32,
    g: f32,
    b: f32,
}

#[derive(Debug, Serialize)]
pub struct Document {
    composite: Layer,

    background_color: Color,
    background_hidden: bool,

    width: u64, 
    height: u64,

    orientation: u64,
    flipped_horizontally: bool,

    layers: Vec<Layer>,
}

#[derive(Debug, Error)]
pub enum PlistParseError {
    #[error("Wrong type: {0}")]
    TypeError(String),
    #[error("No key: {0}")]
    MissingKey(String),
}

impl Layer {
    fn from_dictionary(
        dictionary: &Dictionary,
        objects: &Vec<Value>,
    ) -> Result<Self, PlistParseError> {
        Ok(Layer {
            uuid: objects[dictionary
                .get("UUID")
                .ok_or_else(|| PlistParseError::MissingKey("UUID".to_string()))?
                .as_uid()
                .ok_or_else(|| PlistParseError::TypeError("UUID".to_string()))?
                .get() as usize]
                .as_string()
                .ok_or_else(|| PlistParseError::TypeError("UUID".to_string()))?
                .to_string(),
            width: dictionary
                .get("sizeWidth")
                .ok_or_else(|| PlistParseError::MissingKey("sizeWidth".to_string()))?
                .as_unsigned_integer()
                .ok_or_else(|| PlistParseError::TypeError("sizeWidth".to_string()))?,
            height: dictionary
                .get("sizeHeight")
                .ok_or_else(|| PlistParseError::MissingKey("sizeHeight".to_string()))?
                .as_unsigned_integer()
                .ok_or_else(|| PlistParseError::TypeError("sizeHeight".to_string()))?,
            blend_mode: dictionary
                .get("blend")
                .map(|blend| blend.as_unsigned_integer())
                .flatten()
                .unwrap_or(1),
            opacity: dictionary
                .get("opacity")
                .map(|opacity| opacity.as_real())
                .flatten()
                .unwrap_or(1f64),
            locked: dictionary
                .get("locked")
                .map(|locked| locked.as_boolean())
                .flatten()
                .unwrap_or(false),
            hidden: dictionary
                .get("hidden")
                .map(|hidden| hidden.as_boolean())
                .flatten()
                .unwrap_or(false),
            name: dictionary
                .get("name")
                .map(|name_id| name_id.as_uid().map(|name_id| name_id.get() as usize))
                .flatten()
                .map(|name_id| {
                    if name_id == 0 {
                        None
                    } else {
                        objects[name_id].as_string()
                    }
                })
                .flatten()
                .map(|name| name.to_string()),
            clipped: dictionary
                .get("clipped")
                .map(|clipped| clipped.as_boolean())
                .flatten()
                .unwrap_or(false),
        })
    }
}

impl Document {
    pub fn import_plist(archive: &mut ZipArchive<Cursor<&[u8]>>) -> Result<Self, ProcreateError> {
        let mut plist_file = archive.by_name("Document.archive")?;
        let mut buffer = Vec::with_capacity(plist_file.size() as usize);

        plist_file.read_to_end(&mut buffer)?;

        let mut value = plist::Value::from_reader(Cursor::new(buffer))?
            .into_dictionary()
            .ok_or(PlistParseError::TypeError("base".to_string()))?;

        let objects_value = value
            .remove("$objects")
            .ok_or_else(|| PlistParseError::MissingKey("objects".to_string()))?;

        let objects = objects_value
            .as_array()
            .ok_or_else(|| PlistParseError::TypeError("objects".to_string()))?;

        let top_value = value
            .remove("$top")
            .ok_or_else(|| PlistParseError::MissingKey("top".to_string()))?;

        let top = top_value
            .into_dictionary()
            .ok_or_else(|| PlistParseError::TypeError("top".to_string()))?;

        let base_id = top
            .get("root")
            .ok_or_else(|| PlistParseError::MissingKey("root".to_string()))?
            .as_uid()
            .ok_or_else(|| PlistParseError::TypeError("uid".to_string()))?
            .get();

        let base_object = objects[base_id as usize]
            .as_dictionary()
            .ok_or_else(|| PlistParseError::TypeError("base".to_string()))?;

        let composite_id = base_object
            .get("composite")
            .ok_or_else(|| PlistParseError::MissingKey("composite".to_string()))?
            .as_uid()
            .ok_or_else(|| PlistParseError::TypeError("composite".to_string()))?
            .get() as usize;

        let composite = objects[composite_id]
            .as_dictionary()
            .ok_or_else(|| PlistParseError::TypeError("composite".to_string()))?;

        let background_color_id = base_object
            .get("backgroundColor")
            .ok_or_else(|| PlistParseError::MissingKey("backgroundColor".to_string()))?
            .as_uid()
            .ok_or_else(|| PlistParseError::TypeError("backgroundColor".to_string()))?
            .get() as usize;

        let background_color_data = objects[background_color_id]
            .as_data()
            .ok_or_else(|| PlistParseError::TypeError("backgroundColor".to_string()))?
            .chunks_exact(4)
            .map(|bytes| {
                <[u8; 4]>::try_from(bytes)
                    .map(f32::from_le_bytes)
                    .map_err(|_| PlistParseError::TypeError("backgroundColor".to_string()))
            })
            .collect::<Result<Vec<f32>, _>>()?;

        let background_hidden = base_object
            .get("backgroundHidden")
            .ok_or_else(|| PlistParseError::MissingKey("backgroundHidden".to_string()))?
            .as_boolean()
            .ok_or_else(|| PlistParseError::TypeError("backgroundHidden".to_string()))?;

        let orientation = base_object
            .get("orientation")
            .ok_or_else(|| PlistParseError::MissingKey("orientation".to_string()))?
            .as_unsigned_integer()
            .ok_or_else(|| PlistParseError::TypeError("orientation".to_string()))?;

        let flipped_horizontally = base_object
            .get("flippedHorizontally")
            .ok_or_else(|| PlistParseError::MissingKey("flippedHorizontally".to_string()))?
            .as_boolean()
            .ok_or_else(|| PlistParseError::TypeError("flippedHorizontally".to_string()))?;

        let size_id = base_object.get("size").ok_or_else(|| PlistParseError::MissingKey("size".to_string()))?
            .as_uid().ok_or_else(|| PlistParseError::TypeError("size".to_string()))?.get() as usize;

        let size_string = objects[size_id].as_string().ok_or_else(|| PlistParseError::MissingKey("size".to_string()))?;

        let size_array = size_string.trim_start_matches('{').trim_end_matches('}').split(", ").map(|dim| dim.parse::<u64>()).collect::<Result<Vec<u64>,_>>()?;

        let layers_id = base_object
            .get("layers")
            .ok_or_else(|| PlistParseError::MissingKey("layers".to_string()))?
            .as_uid()
            .ok_or_else(|| PlistParseError::TypeError("layers".to_string()))?
            .get() as usize;

        let layer_ids = objects[layers_id]
            .as_dictionary()
            .ok_or_else(|| PlistParseError::TypeError("layers".to_string()))?
            .get("NS.objects")
            .ok_or_else(|| PlistParseError::MissingKey("object layers".to_string()))?
            .as_array()
            .ok_or_else(|| PlistParseError::TypeError("object layers".to_string()))?
            .iter()
            .map(|id| {
                // TODO: figure out how to use errors
                id.as_uid().unwrap().get() as usize
            })
            .collect::<Vec<usize>>();

        let mut layers: Vec<Layer> = Vec::with_capacity(layer_ids.len());

        for layer_id in layer_ids {
            let layer_dictionary = objects[layer_id]
                .as_dictionary()
                .ok_or_else(|| PlistParseError::TypeError(format!("layer id: {}", layer_id)))?;

            layers.push(Layer::from_dictionary(layer_dictionary, &objects)?);
        }

        Ok(Document {
            composite: Layer::from_dictionary(composite, &objects)?,
            background_color: Color {
                r: background_color_data[0],
                g: background_color_data[1],
                b: background_color_data[2],
            },
            background_hidden,
            orientation,
            flipped_horizontally,
            layers,
            width: size_array[0],
            height: size_array[1],
        })
    }
}
