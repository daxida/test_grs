import { useState, useRef } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import init, { scan_text } from './../pkg/grs_wasm.js'
import Header from "./Header";
import { DEFAULT_PROMPT } from './constants.js';
import { Panel, PanelGroup } from "react-resizable-panels";
import { useTheme } from './theme.js';

export default function App() {
  const initPromise = useRef<null | Promise<void>>(null);
  const [text, setText] = useState(DEFAULT_PROMPT);
  const [theme, setTheme] = useTheme();

  if (initPromise.current == null) {
    initPromise.current = startApp()
      .then(({ text, settings }) => {
        setText(text);
        highlightErrors(text, setText);
      })
      .catch((error) => {
        console.error("Failed to initialize playground.", error);
      });
  }

  return (
    <main className="flex flex-col h-full bg-ayu-background dark:bg-ayu-background-dark text-gray-900 dark:text-white">
      <Header
        theme={theme}
        onChangeTheme={setTheme}
      />

      <div className="flex flex-grow">
        <Editor
          text={text}
          setText={setText}
        />
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

function highlightErrors(text: string, setText: (text: string) => void) {
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
  setText(newText.replace(/\n/g, "<br>"));
};

interface EditorProps {
  text: string;
  setText: (text: string) => void;
}

function Editor({ text, setText }: EditorProps) {
  return (
    <PanelGroup direction="horizontal" autoSaveId="main">

      <Panel id="main" order={0} minSize={10}>
        <PanelGroup id="main" direction="vertical">
          <div
            id="editor"
            className="editor"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => highlightErrors(e.target.innerText, setText)}
            dangerouslySetInnerHTML={{ __html: text || text.replace(/\n/g, "<br>") }}
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
