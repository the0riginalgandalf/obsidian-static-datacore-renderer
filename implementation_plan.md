# Implementation Plan

[Overview]
The goal is to create a new Obsidian plugin, `static-datacore-renderer`, that finds custom-defined content blocks, executes the Datacore query within them, and replaces the block's content with the static Markdown output, making it suitable for publishing.

This project involves building a complete Obsidian plugin from scratch, mirroring the robust architecture of the `datacore-publisher` plugin. The plugin will depend on the Datacore plugin for its query engine. It will provide users with commands to insert and update these blocks, as well as an optional "update on save" feature for a seamless workflow. The core logic will be centered around parsing file content for specially formatted blocks, executing the queries found within, and injecting the static results back into the document.

[Types]
This section describes the core data structures and type definitions for the plugin.

- **`UnsafeApp`**: An extended version of the Obsidian `App` type to provide access to internal, undocumented APIs for commands and plugins.
  ```typescript
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
  ```

- **`BlockInfo`**: A structured representation of a parsed content block.
  ```typescript
  export type BlockInfo = {
    content: string;      // The entire original block string
    language: string;     // The language of the code block (e.g., "dataview")
    query: string;        // The Datacore query to be executed
    startBlock: string;   // The starting marker of the block
    output: string;       // The previous output content within the block
    endBlock: string;     // The ending marker of the block
  };
  ```

- **`Replacer`**: An object defining a search-and-replace operation.
  ```typescript
  export type Replacer = {
    searchValue: string;  // The original block content
    replaceValue: string; // The new block content with updated output
  };
  ```

- **`Settings`**: The interface for the plugin's configuration.
  ```typescript
  export interface Settings {
    source: string;       // The Datacore query to find target files
    updateOnSave: boolean; // Flag to enable/disable automatic updates on save
  }
  ```

[Files]
This section details the file structure for the new `static-datacore-renderer` plugin.

- **New Files to be Created:**
  - `static-datacore-renderer/manifest.json`: The plugin manifest file containing metadata like name, version, and author.
  - `static-datacore-renderer/package.json`: The Node.js package file for managing dependencies and scripts.
  - `static-datacore-renderer/tsconfig.json`: The TypeScript configuration file.
  - `static-datacore-renderer/src/main.ts`: The main entry point for the plugin.
  - `static-datacore-renderer/src/settings.ts`: Handles plugin settings and the settings UI tab.
  - `static-datacore-renderer/src/commands.ts`: Defines the commands exposed by the plugin.
  - `static-datacore-renderer/src/operations.ts`: Contains the `Operator` class for orchestrating file updates.
  - `static-datacore-renderer/src/renderer.ts`: Core logic for parsing, executing, and rendering the content blocks.
  - `static-datacore-renderer/src/utils.ts`: Utility functions, including the one to get the Datacore API.
  - `static-datacore-renderer/src/types.ts`: Contains all custom type definitions.
  - `static-datacore-renderer/src/errors.ts`: Defines custom error classes for parsing.

- **Existing Files to be Modified:**
  - None. This is a new plugin in a new directory.

[Functions]
This section describes the key functions to be implemented.

- **New Functions:**
  - `createCommands(app: UnsafeApp, settings: Settings): Command[]` in `src/commands.ts`: Creates and returns the list of plugin commands.
  - `createReplacerFromContent(content: string, dc: DatacoreApi, tfile?: TFile): Promise<Array<Replacer>>` in `src/renderer.ts`: The main orchestration function for the rendering process.
  - `executeBlock(block: BlockInfo, dc: DatacoreApi, tfile?: TFile): Promise<string>` in `src/renderer.ts`: Executes the Datacore query from a block using `eval`.
  - `parseBlock(block: string): BlockInfo` in `src/renderer.ts`: Parses a raw block string into a `BlockInfo` object.
  - `composeBlockContent(blocks: BlockInfo): string` in `src/renderer.ts`: Reassembles a block string from a `BlockInfo` object and new output.
  - `getDatacoreAPI(app: App): DatacoreApi | undefined` in `src/utils.ts`: Safely retrieves the Datacore plugin's API.

[Classes]
This section describes the classes to be implemented.

- **New Classes:**
  - `Main extends Plugin` in `src/main.ts`: The main plugin class, handles the `onload` and `onunload` lifecycle hooks.
  - `SettingTab extends PluginSettingTab` in `src/settings.ts`: The class that builds the plugin's settings UI.
  - `Operator` in `src/operations.ts`: The core engine that uses the Datacore API to find and update files. Key methods will be `updateActiveFile(editor: Editor)` and `updateFromSource(source: string)`.
  - `StartBlockNotFoundError extends Error` in `src/errors.ts`: Custom error for parsing.
  - `EndBlockNotFoundError extends Error` in `src/errors.ts`: Custom error for parsing.

[Dependencies]
This section describes the external dependencies.

- **New Packages:**
  - `obsidian`: The core Obsidian API for plugin development.
  - `@blacksmithgu/datacore`: The type definitions and API for the Datacore plugin.
  - `typescript`, `@types/node`: Standard TypeScript development dependencies.

[Testing]
This section describes the testing approach.

A testing strategy will focus on unit tests for the pure logic in `renderer.ts`. Test files will be created to validate the block parsing (`parseBlock`), content extraction, and block composition (`composeBlockContent`) functions with various valid and invalid inputs. Mocking the Datacore API will be necessary to test the `executeBlock` function without a live Obsidian environment.

[Implementation Order]
This section describes the logical sequence for implementation.

1.  **Project Setup**: Create the directory structure and initialize `package.json`, `tsconfig.json`, and `manifest.json`.
2.  **Types and Errors**: Implement all type definitions in `src/types.ts` and custom errors in `src/errors.ts`.
3.  **Core Rendering Logic**: Implement the parsing, execution, and composition functions in `src/renderer.ts`. This is the core of the plugin and can be developed in isolation.
4.  **Utilities**: Implement the `getDatacoreAPI` function in `src/utils.ts`.
5.  **Operations Layer**: Implement the `Operator` class in `src/operations.ts`, integrating the rendering logic with the Datacore API.
6.  **Settings**: Implement the settings interface and UI tab in `src/settings.ts`.
7.  **Commands**: Implement the user-facing commands in `src/commands.ts`.
8.  **Main Plugin File**: Implement the `Main` class in `src/main.ts`, tying together settings, commands, and the "update on save" functionality.
9.  **Build and Test**: Configure the build process and perform manual testing in Obsidian.
