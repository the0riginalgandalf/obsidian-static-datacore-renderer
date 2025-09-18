import { TFile } from "obsidian";
import { DatacoreApi, Literals } from "@blacksmithgu/datacore";
import { BlockInfo, Replacer } from "./types";
import { StartBlockNotFoundError, EndBlockNotFoundError } from "./errors";

export function parseBlock(block: string): BlockInfo {
  const startBlockIndex = block.indexOf("```");
  if (startBlockIndex === -1) {
    throw new StartBlockNotFoundError("Could not find start of block");
  }

  const endBlockIndex = block.lastIndexOf("```");
  if (endBlockIndex === -1 || endBlockIndex === startBlockIndex) {
    throw new EndBlockNotFoundError("Could not find end of block");
  }

  const startBlock = block.substring(startBlockIndex, block.indexOf("\n", startBlockIndex) + 1);
  const language = startBlock.replace("```", "").trim();
  const endBlock = "```";

  const queryStartIndex = block.indexOf(startBlock) + startBlock.length;
  const outputStartIndex = block.indexOf("---");

  const query = block.substring(queryStartIndex, outputStartIndex).trim();
  const output = block.substring(outputStartIndex + 3, endBlockIndex).trim();

  return {
    content: block,
    language,
    query,
    startBlock,
    output,
    endBlock,
  };
}

export function composeBlockContent(block: BlockInfo): string {
  return `${block.startBlock}${block.query}\n---\n${block.output}\n${block.endBlock}`;
}

export async function executeBlock(block: BlockInfo, dc: DatacoreApi, tfile?: TFile): Promise<string> {
  try {
    const result = dc.evaluate(block.query, undefined, tfile?.path);

    // If the result of the evaluation is already a string (from datacorejs), return it directly.
    if (typeof result === 'string') {
      return result;
    }

    // Otherwise, assume it's a Datacore object and format it.
    // The 'core' property is not in the public API, so we have to cast to any to access it.
    // This is necessary to get the settings for Literals.toString.
    const settings = (dc as any).core.settings;
    return Literals.toString(result, settings);
  } catch (error) {
    console.error("Error executing Datacore query:", error);
    return `Error executing query: ${error.message}`;
  }
}

export async function createReplacerFromContent(content: string, dc: DatacoreApi, tfile?: TFile): Promise<Array<Replacer>> {
  const replacers: Replacer[] = [];
  const blockRegex = /```datacore(js)?\n[\s\S]+?---\n[\s\S]*?```/g;
  const blocks = content.match(blockRegex);

  if (!blocks) {
    return [];
  }

  for (const block of blocks) {
    try {
      const parsedBlock = parseBlock(block);
      const newOutput = await executeBlock(parsedBlock, dc, tfile);
      const newBlockInfo = { ...parsedBlock, output: newOutput };
      const newContent = composeBlockContent(newBlockInfo);
      
      replacers.push({
        searchValue: block,
        replaceValue: newContent,
      });
    } catch (e) {
      console.error("Failed to process block:", e);
      // If a block fails, we skip it and continue with the next one.
    }
  }

  return replacers;
}
