build:
  wasm-pack build grs-wasm --target web --out-dir ../pkg

server:
  python3 -m http.server 8080
