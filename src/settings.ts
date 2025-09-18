import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { Settings } from "./types";

// Define an interface for the plugin to break the circular dependency.
// The Main class in main.ts implicitly satisfies this interface.
interface IPlugin extends Plugin {
  settings: Settings;
  saveSettings(): Promise<void>;
}

export const DEFAULT_SETTINGS: Settings = {
  source: "",
  updateOnSave: false,
};

export class SettingTab extends PluginSettingTab {
  plugin: IPlugin;

  constructor(app: App, plugin: IPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Static Datacore Renderer Settings" });

    new Setting(containerEl)
      .setName("Datacore Source")
      .setDesc("The Datacore query to find target files for rendering.")
      .addText((text) =>
        text
          .setPlaceholder("e.g., #publish")
          .setValue(this.plugin.settings.source)
          .onChange(async (value) => {
            this.plugin.settings.source = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Update on Save")
      .setDesc("Automatically update the rendered blocks when a file is saved.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.updateOnSave)
          .onChange(async (value) => {
            this.plugin.settings.updateOnSave = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
