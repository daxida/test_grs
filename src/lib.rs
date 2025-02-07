use grs::linter::check;
use grs::registry::Rule;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use web_sys::js_sys::{Array, Object, Reflect};

// TODO: Very unefficient
fn byte_range_to_char_range(
    text: &str,
    byte_range: std::ops::Range<usize>,
) -> std::ops::Range<usize> {
    let mut char_start = None;
    let mut char_end = None;

    for (idx, (char_index, _)) in text.char_indices().enumerate() {
        if char_index == byte_range.start {
            char_start = Some(idx);
        }
        if char_index == byte_range.end {
            char_end = Some(idx);
            break;
        }
    }

    match (char_start, char_end) {
        (Some(start), Some(end)) => start..end,
        _ => panic!(),
    }
}

#[wasm_bindgen]
pub fn scan_text(text: &str) -> Array {
    let config = vec![Rule::MissingDoubleAccents];
    let diagnostics = check(text, &config);
    let diagnostics_js = Array::new();

    for diagnostic in diagnostics {
        if let Some(fix) = diagnostic.fix {
            let kind = JsValue::from(diagnostic.kind.to_string());
            let replacement = JsValue::from(fix.replacement);

            let byte_range = fix.range.start()..fix.range.end();
            let char_range = byte_range_to_char_range(text, byte_range);
            let start = JsValue::from(char_range.start);
            let end = JsValue::from(char_range.end);

            let diagnostic_js = Object::new();
            Reflect::set(&diagnostic_js, &JsValue::from("kind"), &kind).unwrap();
            Reflect::set(&diagnostic_js, &JsValue::from("replacement"), &replacement).unwrap();
            Reflect::set(&diagnostic_js, &JsValue::from("start"), &start).unwrap();
            Reflect::set(&diagnostic_js, &JsValue::from("end"), &end).unwrap();

            diagnostics_js.push(&diagnostic_js);
        }
    }

    diagnostics_js
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_range_conversion() {
        assert_eq!(0..4, byte_range_to_char_range("Καλημέρα", 0..8));
    }
}
