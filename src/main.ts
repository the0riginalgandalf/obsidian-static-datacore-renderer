import { Plugin } from "obsidian";
import { Settings, UnsafeApp } from "./types";
import { DEFAULT_SETTINGS, SettingTab } from "./settings";
import { createCommands } from "./commands";
import { Operator } from "./operations";

export default class Main extends Plugin {
  settings: Settings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SettingTab(this.app, this));

    createCommands(this.app as UnsafeApp, this.settings).forEach((command) => {
      this.addCommand(command);
    });

    if (this.settings.updateOnSave) {
      this.registerEvent(
        this.app.workspace.on("editor-change", (editor) => {
          const operator = new Operator(this.app as UnsafeApp);
          operator.updateActiveFile(editor);
        })
      );
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
