import { useState, useEffect } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import init, { scan_text } from './../pkg/grs_wasm.js'
import Header from "./Header";
import { DEFAULT_PROMPT } from './constants.js';
import { Panel, PanelGroup } from "react-resizable-panels";
import { useTheme } from './theme.js';

export default function App() {
  const [text, setText] = useState(DEFAULT_PROMPT);
  const [highlightedText, setHighlightedText] = useState("");
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    async function initializeWasm() {
      await init();
      // Highlight errors after initialization
      highlightErrors(text, setHighlightedText);
    }
    initializeWasm();
  }, [text]);

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
          highlightedText={highlightedText}
          setHighlightedText={setHighlightedText}
        />
      </div>
    </main>
  );
}

function highlightErrors(inputText: string, setHighlightedText: (text: string) => void) {
  const diagnostics = scan_text(inputText);
  diagnostics.sort((a, b) => a.start - b.start);

  let lastIndex = 0;
  let newHighlightedText = "";

  for (const diagnostic of diagnostics) {
    const { start, end, kind } = diagnostic;
    const newEnd = end > 0 && inputText[end - 1] == " " ? end - 1 : end;

    newHighlightedText += inputText.substring(lastIndex, start);
    newHighlightedText += `<span class='underline' title='${kind}'>${inputText.substring(start, newEnd)}</span>`;
    lastIndex = newEnd;
  }

  newHighlightedText += inputText.substring(lastIndex);
  setHighlightedText(newHighlightedText.replace(/\n/g, "<br>"));
};

interface EditorProps {
  text: string;
  setText: (text: string) => void;
  highlightedText: string;
  setHighlightedText: (text: string) => void;
}

function Editor({ text, setText, highlightedText, setHighlightedText }: EditorProps) {
  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const newText = e.target.innerText;
    setText(newText);
    highlightErrors(newText, setHighlightedText);
  };

  return (
    <>
      <PanelGroup direction="horizontal" autoSaveId="main">
        <Panel id="main" order={0} minSize={10}>
          <div
            id="editor"
            className="editor"
            contentEditable
            suppressContentEditableWarning
            onBlur={onBlur}
            dangerouslySetInnerHTML={{ __html: highlightedText || text.replace(/\n/g, "<br>") }}
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
        </Panel>
      </PanelGroup>
    </>
  );
}
