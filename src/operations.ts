import { Editor, TFile } from "obsidian";
import { Replacer, UnsafeApp } from "./types";
import { createReplacerFromContent } from "./renderer";
import { getDatacoreAPI } from "./utils";
import { DatacoreApi } from "@blacksmithgu/datacore";

export class Operator {
  app: UnsafeApp;
  dc: DatacoreApi;

  constructor(app: UnsafeApp) {
    this.app = app;
    const dc = getDatacoreAPI(app);
    if (!dc) {
      throw new Error(
        "Datacore API not found. Make sure the Datacore plugin is enabled."
      );
    }
    this.dc = dc;
  }

  private getActiveTFile(): TFile {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      throw new Error("No active file");
    }
    return activeFile;
  }

  async updateActiveFile(editor: Editor) {
    const cursor = editor.getCursor();
    const content = editor.getValue();
    const tfile = this.getActiveTFile();
    const replacers = await createReplacerFromContent(content, this.dc, tfile);

    if (replacers.length === 0) {
      return;
    }

    const updatedContent = this.updateContent(content, replacers);

    // If the content has not changed, do not update the editor, to prevent an infinite loop.
    if (content === updatedContent) {
      return;
    }

    editor.setValue(updatedContent);
    editor.setCursor(cursor);
  }

  updateFromSource(source: string) {
    const targetTfiles = this.retrieveTfilesFromSource(source);

    targetTfiles.forEach(async (tfile) => {
      await this.updateDatacoreBlocks(tfile);
    });
  }

  private retrieveTfilesFromSource(source: string): Array<TFile> {
    const pages = this.dc.query(source);
    if (!pages) {
      return [];
    }
    const paths = pages.map((p: any) => p.file.path);
    const tfiles = paths
      .map((path: string) => this.app.vault.getFileByPath(path))
      .filter((tfile: TFile | null): tfile is TFile => tfile !== null);
    return tfiles;
  }

  private async updateDatacoreBlocks(tfile: TFile) {
    const content = await this.app.vault.cachedRead(tfile);
    const replacers = await createReplacerFromContent(content, this.dc, tfile);
    if (replacers.length === 0) {
      return;
    }
    const updatedContent = this.updateContent(content, replacers);
    await this.app.vault.modify(tfile, updatedContent);
  }

  private updateContent(content: string, replacers: Replacer[]): string {
    return replacers.reduce(
      (acc, { searchValue, replaceValue }) => acc.replace(searchValue, replaceValue),
      content
    );
  }
}
