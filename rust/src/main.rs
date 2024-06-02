use std::fs::{self, read_to_string};

fn main() {
    if let Ok(file_string) = read_to_string("temp/Document.txt") {
        for line in file_string.lines() {

        }
    }
}
