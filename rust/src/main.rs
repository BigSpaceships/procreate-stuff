use std::{collections::HashMap, fs::read_to_string};

#[derive(Debug)]
enum LineType {
    Dict,
    EndDict,
    Key(String),
    String(String),
    Integer(i32),
    Boolean(bool),
}

#[derive(Debug)]
struct Dictionary {
    items: Vec<Item>,
    id: u16,
    parent: Option<u16>,
}

#[derive(Debug)]
struct Key {
    name: String,
    value: KeyValue,
}

#[derive(Debug)]
enum Item {
    FakeDict(u16),
    Key(Key),
    Value(KeyValue),
}

#[derive(Debug)]
enum KeyValue {
    String(String),
    Integer(i32),
    Boolean(bool),
    Dictionary(u16),
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

    fn new(next_id: u16) -> Dictionary {
        let id = next_id + 1;

        return Dictionary {
            items: Vec::new(),
            id,
            parent: None,
        };
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
    if let Ok(file_string) = read_to_string("temp/Document.txt") {
        let mut i = 0;

        let mut dictionaries: HashMap<u16, Dictionary> = HashMap::new();

        let mut working_dict = dict_count;

        let mut working_key_name: Option<String> = None;

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

                        dictionaries.insert(new_dict.id, new_dict);

                        if let Some(dictionary) = dictionaries.get_mut(&working_dict) {
                            dictionary.add_dictionary(dict_count);
                        }

                        working_dict = dict_count;
                    }
                    LineType::EndDict => {
                        working_dict = dictionaries.get(&working_dict).unwrap().parent.unwrap();
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
            }

            i += 1;
        }
    }
}
