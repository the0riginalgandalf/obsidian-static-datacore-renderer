import { type App } from "obsidian";

export type UnsafeApp = App & {
  commands: {
    commands: { [commandId: string]: unknown };
    executeCommandById(commandId: string): boolean;
  };
  plugins: {
    plugins: {
      [pluginId: string]: {
        api: unknown;
      };
    };
  };
};

export type BlockInfo = {
  content: string;
  language: string;
  query: string;
  startBlock: string;
  output: string;
  endBlock: string;
};

export type Replacer = {
  searchValue: string;
  replaceValue: string;
};

export interface Settings {
  source: string;
  updateOnSave: boolean;
}
