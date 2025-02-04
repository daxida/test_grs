use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn check_spelling(word: &str) -> bool {
    let dictionary = vec!["γεια", "σου", "καλημέρα", "κόσμε", "ελληνικά"]; // Example dictionary
    dictionary.contains(&word)
}

#[wasm_bindgen]
pub fn log_message(message: &str) {
    web_sys::console::log_1(&message.into());
}
