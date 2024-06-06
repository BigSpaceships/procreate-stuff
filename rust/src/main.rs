use std::fmt::{self, write, Debug};
use std::fs::File;
use std::io::{BufWriter, Write};
use std::{collections::HashMap, fmt::Display, fs::read_to_string};

#[derive(Debug)]
enum LineType {
    Dict,
    EndDict,
    Key(String),
    String(String),
    Integer(i32),
    Boolean(bool),
}

struct Dictionary {
    name: Option<String>,
    items: Vec<Item>,
    id: u16,
    parent: Option<u16>,
}

struct Key {
    name: String,
    value: KeyValue,
}

enum Item {
    Dict(Dictionary),
    FakeDict(u16),
    Key(Key),
    Value(KeyValue),
}

enum KeyValue {
    String(String),
    Integer(i32),
    Boolean(bool),
}

impl Dictionary {
    fn add_dictionary(&mut self, dictionary: u16) {
        self.items.push(Item::FakeDict(dictionary));
    }

    fn add_key(&mut self, key: Key) {
        self.items.push(Item::Key(key));
    }

    fn add_value(&mut self, value: KeyValue) {
        self.items.push(Item::Value(value));
    }

    fn update_dictionary(&mut self, dictionaries: &mut HashMap<u16, Dictionary>) {
        for i in 0..self.items.len() {
            if let Item::FakeDict(dict_id) = self.items[i] {
                self.items[i] = Item::Dict(dictionaries.remove(&dict_id).unwrap());
            }
        }

        for i in 0..self.items.len() {
            let mut is_dict = false;

            if let Item::Dict(_) = self.items[i] {
                is_dict = true;
            }

            if is_dict {
                let item = self.items.remove(i);

                if let Item::Dict(mut dictionary) = item {
                    dictionary.update_dictionary(dictionaries);

                    self.items.insert(i, Item::Dict(dictionary));
                }
            }
        }
    }

    fn new(next_id: u16) -> Dictionary {
        let id = next_id + 1;

        return Dictionary {
            items: Vec::new(),
            id,
            parent: None,
            name: None,
        };
    }
}

impl Debug for Dictionary {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut list = f.debug_list();

        for i in 0..self.items.len() {
            list.entry(&format!("{}: {:#?}", i, &self.items[i]));
        }
        list.finish()?;

        f.debug_struct(self.name.clone().unwrap_or("Dictionary".to_string()).as_str())
            .field("items", &self.items)
            .field("id", &self.id)
            // .field(
            //     "parent",
            //     &self.parent.map(|id| id.to_string()).unwrap_or("None".to_string())
            // )
            .finish()
    }
}

impl Debug for Item {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Item::Dict(dict) => {
                write!(f, "{:#?}", dict)
            }
            Item::FakeDict(id) => {
                write!(f, "id: {}", id)
            }
            Item::Value(value) => {
                write!(f, "{:?}", value)
            }
            Item::Key(key) => {
                write!(f, "{:?}", key)
            }
        }
    }
}

impl Debug for KeyValue {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            KeyValue::String(string_value) => {
                write!(f, "{}", string_value)
            }
            KeyValue::Integer(int_value) => {
                write!(f, "{}", int_value)
            }
            KeyValue::Boolean(bool_value) => {
                write!(f, "{}", bool_value)
            }
        }
    }
}

impl Debug for Key {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {:?}", self.name, self.value)
    }
}

fn get_type(line: &str) -> Option<LineType> {
    let start_index = line.find('<')?;

    let end_index = line.find('>')?;

    let line_keyword = &line[start_index + 1..end_index];

    let second_index = line[start_index + 1..].find('<').map(|i| i + start_index);

    match line_keyword {
        "dict" => Some(LineType::Dict),
        "/dict" => Some(LineType::EndDict),
        "key" => {
            let name = &line[end_index + 1..second_index? + 1];
            Some(LineType::Key(name.to_string()))
        }
        "string" => {
            let string_value = &line[end_index + 1..second_index? + 1];
            Some(LineType::String(string_value.to_string()))
        }
        "integer" => {
            let string_int = &line[end_index + 1..second_index? + 1];
            let int = string_int.parse::<i32>().ok()?;
            Some(LineType::Integer(int))
        }
        "false/" => Some(LineType::Boolean(false)),
        "true/" => Some(LineType::Boolean(true)),
        "array" => Some(LineType::Dict),
        "/array" => Some(LineType::EndDict),
        _ => {
            // println!("couldn't parse {}", line_keyword);
            None
        }
    }
}

fn main() {
    let mut dict_count: u16 = 0;
    if let Ok(file_string) = read_to_string("temp/Document.xml") {
        let mut dictionaries: HashMap<u16, Dictionary> = HashMap::new();

        let mut working_dict = dict_count;

        let mut working_key_name: Option<String> = None;

        let mut i = 0;

        for line in file_string.lines() {
            if let Some(line_type) = get_type(line) {
                match line_type {
                    LineType::Dict => {
                        let mut new_dict = Dictionary::new(dict_count);

                        dict_count = new_dict.id;

                        new_dict.parent = if working_dict == 0 {
                            None
                        } else {
                            Some(working_dict)
                        };

                        if working_key_name.is_some() {
                            new_dict.name = working_key_name;

                            working_key_name = None;
                        }

                        dictionaries.insert(new_dict.id, new_dict);

                        if let Some(dictionary) = dictionaries.get_mut(&working_dict) {
                            dictionary.add_dictionary(dict_count);
                        }

                        working_dict = dict_count;
                    }
                    LineType::EndDict => {
                        if !dictionaries.contains_key(&working_dict) {
                            println!("oopsies on line {}", i);
                        } else if dictionaries.get(&working_dict).unwrap().parent.is_none() {
                            println!("oopsies on line {}", i);
                        } else {
                            working_dict = dictionaries.get(&working_dict).unwrap().parent.unwrap();
                        }
                    }
                    LineType::Key(key_name) => {
                        working_key_name = Some(key_name);
                    }
                    LineType::String(string_value) => {
                        let value = KeyValue::String(string_value);

                        if working_key_name.is_none() {
                            dictionaries
                                .get_mut(&working_dict)
                                .unwrap()
                                .add_value(value);
                        } else {
                            dictionaries.get_mut(&working_dict).unwrap().add_key(Key {
                                name: working_key_name.unwrap(),
                                value,
                            });
                        }

                        working_key_name = None;
                    }
                    LineType::Integer(int_value) => {
                        let value = KeyValue::Integer(int_value);

                        if working_key_name.is_none() {
                            dictionaries
                                .get_mut(&working_dict)
                                .unwrap()
                                .add_value(value)
                        } else {
                            dictionaries.get_mut(&working_dict).unwrap().add_key(Key {
                                name: working_key_name.unwrap(),
                                value,
                            });
                        }

                        working_key_name = None;
                    }
                    LineType::Boolean(bool_value) => {
                        let value = KeyValue::Boolean(bool_value);

                        if working_key_name.is_none() {
                            dictionaries
                                .get_mut(&working_dict)
                                .unwrap()
                                .add_value(value)
                        } else {
                            dictionaries.get_mut(&working_dict).unwrap().add_key(Key {
                                name: working_key_name.unwrap(),
                                value,
                            });
                        }

                        working_key_name = None;
                    }
                }

                i += 1;
            }
        }

        let mut base_dictionary = dictionaries.remove(&1).unwrap();

        base_dictionary.update_dictionary(&mut dictionaries);

        // println!("{:#?}", base_dictionary);
        let mut output_file = File::create("temp/formatted-archive.json").expect("file creation failed");
        // let mut file_writer = BufWriter::new(&output_file);
        
        let formatted_output = format!("{:#?}", base_dictionary);

        output_file.write(formatted_output.as_bytes()).expect("write failed");

        if let Item::Dict(dictionary) = &base_dictionary.items[3] {
            for i in 0..dictionary.items.len() {
                if let Item::Value(value) = &dictionary.items[i] {
                    if let KeyValue::String(str_value) = value {
                        println!("{:?}", str_value);
                    }
                }
            }
        }
    }
}
