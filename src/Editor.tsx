import { useRef, useState, useCallback, useEffect } from 'react'
import { Panel, PanelGroup } from "react-resizable-panels";
import { scan_text } from './../pkg/grs_wasm.js'
import { Diagnostic } from './App.tsx';
import { Theme } from './theme.js';
import PrimarySideBar from "./PrimarySideBar";

type Tab = "Source" | "Settings";

export interface Source {
  text: string;
  settings: string;
}

interface EditorProps {
  source: Source;
  theme: Theme;

  onSourceChanged(source: string): void;
  onSettingsChanged(settings: string): void;
}

export default function Editor({ source, theme, onSourceChanged, onSettingsChanged }: EditorProps) {
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  const [tab, setTab] = useState<Tab>("Source");

  const handleSourceEditorMount = useCallback(
    (editor: IStandaloneCodeEditor) => {
      editorRef.current = editor;

      editor.addAction({
        contextMenuGroupId: "navigation",
        contextMenuOrder: 0,
        id: "reveal-node",
        label: "Reveal node",
        precondition: "editorTextFocus",

        run(editor: editor.ICodeEditor): void | Promise<void> {
          const position = editor.getPosition();
          if (position == null) {
            return;
          }
        },
      });
    },
    [],
  );

  const diagnostics = scan_text(source.text);

  return (
    <PanelGroup direction="horizontal" autoSaveId="main">
      <PrimarySideBar onSelectTool={(tool) => setTab(tool)} selected={tab} />

      <Panel id="main" order={0} minSize={10}>
        <PanelGroup id="main" direction="vertical">
          <SourceEditor
            visible={tab === "Source"}
            source={source.text}
            diagnostics={diagnostics}
            theme={theme}
            onChange={onSourceChanged}
            onMount={handleSourceEditorMount}
          />
          <SettingsEditor
            visible={tab === "Settings"}
            source={source.settings}
            theme={theme}
            onChange={onSettingsChanged}
          />
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}


import MonacoEditor, { Monaco, OnMount } from "@monaco-editor/react";
import {
  editor,
  MarkerSeverity,
} from "monaco-editor";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

type MonacoEditorState = {
  monaco: Monaco;
};

function SourceEditor({
  visible,
  source,
  theme,
  diagnostics,
  onChange,
  onMount,
}: {
  visible: boolean;
  source: string;
  diagnostics: Diagnostic[];
  theme: Theme;
  onChange(pythonSource: string): void;
  onMount(editor: IStandaloneCodeEditor): void;
}) {
  const monacoRef = useRef<MonacoEditorState | null>(null);

  // Update the diagnostics in the editor.
  useEffect(() => {
    const editorState = monacoRef.current;
    if (editorState == null) {
      return;
    }
    updateMarkers(editorState.monaco, diagnostics);
  }, [diagnostics]);

  const handleChange = useCallback(
    (value: string | undefined) => {
      onChange(value ?? "");
    },
    [onChange],
  );

  const handleMount: OnMount = useCallback(
    (editor, instance) => {
      updateMarkers(instance, diagnostics);
      monacoRef.current = {
        monaco: instance,
      };
      onMount(editor);
    },

    [diagnostics, onMount],
  );

  return (
    <MonacoEditor
      onMount={handleMount}
      options={{
        fixedOverflowWidgets: true,
        readOnly: false,
        minimap: { enabled: false },
        fontSize: 20,
        roundedSelection: false,
        scrollBeyondLastLine: false,
        contextmenu: true,
        /* Custom */
        unicodeHighlight: {
          ambiguousCharacters: false,
          invisibleCharacters: false,
          nonBasicASCII: false,
        },
        wordWrap: "on",
      }}
      wrapperProps={visible ? {} : { style: { display: "none" } }}
      theme={theme === "light" ? "vs" : "vs-dark"}
      value={source}
      onChange={handleChange}
    />
  );
}

function updateMarkers(monaco: Monaco, diagnostics: Array<Diagnostic>) {
  const editor = monaco.editor;
  const model = editor?.getModels()[0];

  if (!model) {
    return;
  }

  editor.setModelMarkers(
    model,
    "owner",
    diagnostics.map((diagnostic) => {
      const start = model.getPositionAt(diagnostic.start);
      const end = model.getPositionAt(diagnostic.end);
      return (
        {
          startLineNumber: start.lineNumber,
          startColumn: start.column,
          endLineNumber: end.lineNumber,
          endColumn: end.column,
          message: JSON.stringify(diagnostic),
          severity: MarkerSeverity.Error,
        })
    }),
  );
}

function SettingsEditor({
  visible,
  source,
  theme,
  onChange,
}: {
  visible: boolean;
  source: string;
  theme: Theme;
  onChange: (source: string) => void;
}) {
  const handleChange = useCallback(
    (value: string | undefined) => {
      onChange(value ?? "");
    },
    [onChange],
  );

  const handleMount = useCallback((editor: IStandaloneCodeEditor) => {
    const model = editor.getModel();

    if (model == null) {
      return;
    }
  }, []);

  return (
    <MonacoEditor
      options={{
        readOnly: false,
        minimap: { enabled: false },
        fontSize: 20,
        roundedSelection: false,
        scrollBeyondLastLine: false,
        contextmenu: true,
      }}
      onMount={handleMount}
      wrapperProps={visible ? {} : { style: { display: "none" } }}
      language="json"
      value={source}
      theme={theme === "light" ? "vs" : "vs-dark"}
      onChange={handleChange}
    />
  );
}
