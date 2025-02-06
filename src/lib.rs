use grs::linter::check;
use grs::registry::Rule;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use web_sys::js_sys::Array;

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

    let errors = Array::new();
    for diagnostic in diagnostics {
        let error_range = Array::new();
        if let Some(fix) = diagnostic.fix {
            let _byte_range = fix.range;
            let byte_range = _byte_range.start().._byte_range.end();
            // TODO: Very unefficient
            let char_range = byte_range_to_char_range(text, byte_range);
            let start = JsValue::from(char_range.start);
            let end = JsValue::from(char_range.end);
            error_range.push(&start);
            error_range.push(&end);
        }
        errors.push(&error_range);
    }

    errors
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_range_conversion() {
        let text = "Καλημέρα";
        //          02468
        let byte_range = 0..8;
        let char_range = byte_range_to_char_range(text, byte_range);
        assert_eq!(char_range, 0..4);
    }
}
