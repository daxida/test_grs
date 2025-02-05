use grs::linter::check;
use grs::registry::Rule;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use web_sys::js_sys::Array;

#[wasm_bindgen]
pub fn scan_text(text: &str) -> Array {
    let config = vec![Rule::MissingDoubleAccents];
    let diagnostics = check(text, &config);

    let errors = Array::new();
    for diagnostic in diagnostics {
        let error_range = Array::new();
        if let Some(fix) = diagnostic.fix {
            let range = fix.range;
            error_range.push(&JsValue::from(range.start()));
            error_range.push(&JsValue::from(range.end()));
        }
        errors.push(&error_range);
    }

    errors
}
