import type { TFile } from "obsidian";
import type { DatacoreApi } from "@blacksmithgu/datacore";
import type { BlockInfo, Replacer } from "./types";
import { EndBlockNotFoundError, StartBlockNotFoundError } from "./errors";

const START_BLOCK_REGEX = /\s*%%\s*STATIC_DATACORE_RENDERER:\s*start\s*[\s\S]*?%%\s*/;
const END_BLOCK_REGEX = /\s*%%\s*STATIC_DATACORE_RENDERER:\s*end\s*%%\s*/;
const BLOCK_REGEX = new RegExp(
  START_BLOCK_REGEX.source +
    /(?<output>[\s\S]*?)/.source +
    END_BLOCK_REGEX.source,
  "gm"
);

export async function createReplacerFromContent(
  content: string,
  dc: DatacoreApi,
  tfile?: TFile
): Promise<Array<Replacer>> {
  const blocks = extractBlocks(content);
  const updatedBlocks = await updateBlocks(blocks, dc, tfile);
  const replacer = createReplacer(blocks, updatedBlocks);
  return replacer;
}

export function createReplacer(
  existing: Array<BlockInfo>,
  updated: Array<BlockInfo>
): Array<Replacer> {
  return existing.map((e, i) => ({
    searchValue: e.content,
    replaceValue: updated[i].content,
  }));
}

export async function updateBlocks(
  blocks: Array<BlockInfo>,
  dc: DatacoreApi,
  tfile?: TFile
) {
  return await Promise.all(
    blocks.map((block) => {
      return updateBlock(block, dc, tfile);
    })
  );
}

export async function updateBlock(
  block: BlockInfo,
  dc: DatacoreApi,
  tfile?: TFile
): Promise<BlockInfo> {
  const executionResult = await executeBlock(block, dc, tfile);

  return {
    ...block,
    content: composeBlockContent({
      ...block,
      output: executionResult,
    }),
  };
}

export async function executeBlock(
  block: BlockInfo,
  dc: DatacoreApi,
  tfile?: TFile
): Promise<string> {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const func = new AsyncFunction("dc", "file", block.query);
  const result = await func(dc, tfile);
  return result.toString().trim();
}

export function extractBlock(content: string): Array<string> {
  // NOTE: initialize regex to reset lastIndex
  const regex = new RegExp(BLOCK_REGEX);
  const blocks = content.match(regex) ?? [];
  return blocks.map((block) => block.trim());
}

export function extractBlocks(file: string) {
  const blocks = extractBlock(file);
  return blocks.map((block) => parseBlock(block));
}

export function parseBlock(block: string): BlockInfo {
  const startBlock = extractStartBlock(block);
  const { language, query } = extractMarkdownCodeBlock(startBlock);

  const output = extractOutput(block);

  return {
    content: block,
    startBlock,
    language,
    query,
    output,
    endBlock: extractEndBlock(block),
  };
}

export function extractStartBlock(text: string) {
  const regex = new RegExp(START_BLOCK_REGEX.source, "m");

  const match = text.match(regex);

  if (!match) {
    throw new StartBlockNotFoundError("start block is not found");
  }

  return match[0].trim();
}

export function extractEndBlock(text: string) {
  const regex = new RegExp(END_BLOCK_REGEX.source, "m");

  const match = text.match(regex);

  if (!match) {
    throw new EndBlockNotFoundError("end block is not found");
  }
  return match[0].trim();
}

export function extractMarkdownCodeBlock(text: string) {
  const CODEBLOCK_REGEX = /```(?<language>.+)?\n(?<query>[\s\S]*?)```/m;

  const match = text.match(CODEBLOCK_REGEX);

  if (!match) {
    throw new Error("query block is not found");
  }

  const language = match.groups?.language?.trim() ?? "";
  const query = match.groups?.query?.trim() ?? "";

  return { language, query };
}

export function extractOutput(text: string) {
  // NOTE: initialize regex to reset lastIndex
  const regex = new RegExp(BLOCK_REGEX.source);

  // 正規表現でマッチング
  const match = text.match(regex);

  if (!match || !match.groups) {
    throw new Error("replaced text is not found");
  }
  // マッチが見つかった場合は、トリミングして返す
  return match.groups.output.trim();
}

export function composeBlockContent(blocks: BlockInfo): string {
  const { startBlock, output, endBlock } = blocks;
  return startBlock + "\n\n" + output + "\n\n" + endBlock;
}
