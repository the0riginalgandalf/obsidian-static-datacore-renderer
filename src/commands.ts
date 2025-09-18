import { Command, Editor } from "obsidian";
import { Settings, UnsafeApp } from "./types";
import { Operator } from "./operations";

export function createCommands(app: UnsafeApp, settings: Settings): Command[] {
  const operator = new Operator(app);

  const commands: Command[] = [
    {
      id: "update-active-file",
      name: "Update Active File",
      editorCallback: (editor: Editor) => {
        operator.updateActiveFile(editor);
      },
    },
    {
      id: "update-all-files",
      name: "Update All Files",
      callback: () => {
        operator.updateFromSource(settings.source);
      },
    },
  ];

  return commands;
}
