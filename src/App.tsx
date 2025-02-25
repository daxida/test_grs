import { useState, useRef, useCallback, useMemo } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import init from './../pkg/grs_wasm.js'
import Header from "./Header";
import { DEFAULT_PROMPT } from './constants.js';
import { useTheme } from './theme.js';
import { default as Editor } from './Editor.tsx';

// This should be exported by grs_wasm
export interface Diagnostic {
  kind: string;
  range: {
    start: number;
    end: number;
  };
  fix: string;
}

// This should be exported by grs_wasm
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
}

export interface Source {
  text: string;
  settings: string;
}

export default function App() {
  console.log("App");
  const initPromise = useRef<null | Promise<void>>(null);
  const [text, setText] = useState<null | string>(null);
  const [settings, setSettings] = useState<null | string>(null);

  const [theme, setTheme] = useTheme();

  if (initPromise.current == null) {
    initPromise.current = startApp()
      .then(({ text, settings }) => {
        setText(text);
        setSettings(settings);
      })
      .catch((error) => {
        console.error("Failed to initialize playground.", error);
      });
  }

  const handleSourceChanged = useCallback(
    (text: string) => {
      setText(text);
    },
    [],
  );

  const handleSettingsChanged = useCallback(
    (settings: string) => {
      setSettings(settings);
    },
    [],
  );

  const source: Source | null = useMemo(() => {
    if (text == null || settings == null) {
      return null;
    }
    return { text, settings };
  }, [text, settings]);

  return (
    <main className="flex flex-col h-full bg-ayu-background dark:bg-ayu-background-dark text-gray-900 dark:text-white">
      <Header
        source={source}
        theme={theme}
        onChangeTheme={setTheme}
        onSourceChanged={handleSourceChanged}
      />

      <div className="flex flex-grow">
        {source != null && (<Editor
          source={source}
          theme={theme}
          onSettingsChanged={handleSettingsChanged}
          onSourceChanged={handleSourceChanged}
        />)}
      </div>
    </main>
  );
}

async function startApp(): Promise<{
  text: string;
  settings: string;
}> {
  await init(); // Init wasm
  return {
    text: DEFAULT_PROMPT,
    settings: "Default settings FILLER"
  };
}

