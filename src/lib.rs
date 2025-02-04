use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use web_sys::js_sys::Array;

#[wasm_bindgen]
pub fn scan_text(text: &str) -> Array {
    let errors = Array::new();
    let target = "bad";

    for (i, _) in text.match_indices(target) {
        let error_range = Array::new();
        error_range.push(&JsValue::from(i));
        error_range.push(&JsValue::from(i + target.len()));
        errors.push(&error_range);
    }

    errors
}
