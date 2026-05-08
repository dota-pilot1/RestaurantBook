"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from "lexical";
import { $createImageNode, type ImagePayload } from "../nodes/ImageNode";
import { $createYoutubeNode, type YoutubePayload } from "../nodes/YoutubeNode";

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND");

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<YoutubePayload> =
  createCommand("INSERT_YOUTUBE_COMMAND");

export function ImagePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<ImagePayload>(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        $insertNodes([$createImageNode(payload)]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}

export function YoutubePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<YoutubePayload>(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        $insertNodes([$createYoutubeNode(payload)]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}

export function DragDropImagePlugin({
  onUpload,
}: {
  onUpload: (file: File) => Promise<string>;
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const insertFile = async (file: File, altText: string) => {
      const url = await onUpload(file);
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText });
    };

    const handleDrop = async (event: DragEvent) => {
      const files = event.dataTransfer?.files;
      if (!files?.length) return;

      const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
      if (imageFiles.length === 0) return;

      event.preventDefault();
      for (const file of imageFiles) {
        await insertFile(file, file.name);
      }
    };

    const handleDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) {
        event.preventDefault();
      }
    };

    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        event.preventDefault();
        await insertFile(file, "pasted-image");
      }
    };

    rootElement.addEventListener("drop", handleDrop);
    rootElement.addEventListener("dragover", handleDragOver);
    rootElement.addEventListener("paste", handlePaste);

    return () => {
      rootElement.removeEventListener("drop", handleDrop);
      rootElement.removeEventListener("dragover", handleDragOver);
      rootElement.removeEventListener("paste", handlePaste);
    };
  }, [editor, onUpload]);

  return null;
}
