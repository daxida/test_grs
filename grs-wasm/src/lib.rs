use grs::diagnostic::{Diagnostic, Fix};
use grs::linter::check;
use grs::registry::Rule;
use serde::{Deserialize, Serialize};
use std::ops::Range;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use web_sys::js_sys::Error;

#[wasm_bindgen(typescript_custom_section)]
const TYPES: &'static str = r#"
export interface Diagnostic {
  kind: string;
  range: {
    start: number;
    end: number;
  };
  fix: string;
};

export interface Token {
  text: string,
  whitespace: string,
  index: number,
  range: {
    start: number,
    end: number,
  }
  punct: boolean,
  greek: boolean,
}"#;

// TODO: Very unefficient
fn byte_range_to_char_range(text: &str, byte_range: Range<usize>) -> Range<usize> {
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

    // Cf. only a multisyllable non accented as input: καλη
    // (in that case we would reach EOF before assigning char_end)
    if char_end.is_none() {
        char_end = Some(text.chars().count());
    }

    match (char_start, char_end) {
        (Some(start), Some(end)) => start..end,
        _ => {
            web_sys::console::log_1(&"Warning: Invalid range, using default 0..0".into());
            0..0
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DiagnosticJs {
    pub kind: String,
    pub range: Range<usize>,
    // Only the replacement at the moment.
    pub fix: Option<String>,
}

fn to_fixjs(fix: &Option<Fix>) -> Option<String> {
    // The trim is hacky...
    fix.as_ref().map(|fix| fix.replacement.trim().to_string())
}

fn pascal_to_snake(s: &str) -> String {
    let mut snake_case = String::new();
    for (i, c) in s.chars().enumerate() {
        if c.is_uppercase() {
            if i != 0 {
                snake_case.push('_');
            }
            snake_case.push(c.to_ascii_lowercase());
        } else {
            snake_case.push(c);
        }
    }
    snake_case
}

impl DiagnosticJs {
    fn new(text: &str, diagnostic: &Diagnostic) -> Self {
        let byte_range = diagnostic.range.start()..diagnostic.range.end();
        let char_range = byte_range_to_char_range(text, byte_range);
        let start = char_range.start;
        let end = char_range.end;

        let pascal_case_rule = format!("{:?}", diagnostic.kind);
        let kind = pascal_to_snake(&pascal_case_rule);

        Self {
            kind,
            range: start..end,
            fix: to_fixjs(&diagnostic.fix),
        }
    }
}

#[wasm_bindgen]
pub fn scan_text(text: &str) -> Result<JsValue, Error> {
    let config = vec![
        Rule::MissingDoubleAccents,
        Rule::MissingAccentCapital,
        Rule::DuplicatedWord,
        Rule::AddFinalN,
        Rule::RemoveFinalN,
        Rule::OutdatedSpelling,
        Rule::MonosyllableAccented,
        Rule::MultisyllableNotAccented,
        Rule::MixedScripts,
        Rule::AmbiguousChar,
    ];

    let diagnostics_js = check(text, &config)
        .iter()
        .map(|diagnostic| DiagnosticJs::new(text, diagnostic))
        .collect::<Vec<_>>();

    serde_wasm_bindgen::to_value(&diagnostics_js).map_err(into_error)
}

#[wasm_bindgen]
pub fn tokenize(text: &str) -> Result<JsValue, Error> {
    let tokens = grs::tokenizer::tokenize(text);
    serde_wasm_bindgen::to_value(&tokens).map_err(into_error)
}

#[wasm_bindgen]
pub fn to_monotonic(text: &str) -> String {
    grac::to_monotonic(text)
}

fn into_error<E: std::fmt::Display>(err: E) -> Error {
    Error::new(&err.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_range_conversion() {
        assert_eq!(0..4, byte_range_to_char_range("Καλημέρα", 0..8));
    }
}
