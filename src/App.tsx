import { useState, useRef, useCallback, useMemo } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import init, { scan_text } from './../pkg/grs_wasm.js'
import Header from "./Header";
import { DEFAULT_PROMPT } from './constants.js';
import { Panel, PanelGroup } from "react-resizable-panels";
import { useTheme } from './theme.js';

export interface Source {
  text: string;
  settings: string;
}

export default function App() {
  const initPromise = useRef<null | Promise<void>>(null);
  const [text, setText] = useState<null | string>(null);
  const [settings, setSettings] = useState<null | string>(null);

  const [theme, setTheme] = useTheme();

  if (initPromise.current == null) {
    initPromise.current = startApp()
      .then(({ text, settings }) => {
        setText(highlightErrors(text));
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

  // console.log("Text is " + text);
  // console.log("Settings are " + settings);

  return (
    <main className="flex flex-col h-full bg-ayu-background dark:bg-ayu-background-dark text-gray-900 dark:text-white">
      <Header
        theme={theme}
        onChangeTheme={setTheme}
      />

      <div className="flex flex-grow">
        {source != null && (<Editor
          source={source}
          setText={setText}
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
    settings: "Unused at the moment. TODO: fixme"
  };
}

function highlightErrors(text: string) {
  const diagnostics = scan_text(text);
  diagnostics.sort((a, b) => a.start - b.start);

  let lastIndex = 0;
  let newText = "";

  for (const { start, end, kind } of diagnostics) {
    const newEnd = end > 0 && text[end - 1] == " " ? end - 1 : end;
    newText += text.substring(lastIndex, start);
    newText += `<span class='underline' title='${kind}'>${text.substring(start, newEnd)}</span>`;
    lastIndex = newEnd;
  }

  newText += text.substring(lastIndex);
  return newText.replace(/\n/g, "<br>");
};

interface EditorProps {
  source: Source;
  setText: (text: string) => void;

  onSourceChanged(source: string): void;
  onSettingsChanged(settings: string): void;
}

function Editor({ source, setText, onSourceChanged, onSettingsChanged }: EditorProps) {
  // Does nothing: just testing
  onSourceChanged("")
  onSettingsChanged("")

  return (
    <PanelGroup direction="horizontal" autoSaveId="main">

      <Panel id="main" order={0} minSize={10}>
        <PanelGroup id="main" direction="vertical">
          <div
            id="editor"
            className="editor"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setText(highlightErrors(e.target.innerText))}
            dangerouslySetInnerHTML={{ __html: source.text || source.text.replace(/\n/g, "<br>") }}
          />
          <Panel
            id="diagnostics"
            minSize={3}
            order={1}
          >
            <div
              id="editor"
              className="editor"
              contentEditable
              suppressContentEditableWarning
            />
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
