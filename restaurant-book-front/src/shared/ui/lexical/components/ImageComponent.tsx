"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  type NodeKey,
} from "lexical";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { $isImageNode, type ImageAlignment } from "../nodes/ImageNode";

type Props = {
  src: string;
  altText: string;
  width: number;
  height: number;
  alignment: ImageAlignment;
  nodeKey: NodeKey;
  editable: boolean;
};

export function ImageComponent({
  src,
  altText,
  width,
  height,
  alignment,
  nodeKey,
  editable,
}: Props) {
  const [editor] = useLexicalComposerContext();
  const imageRef = useRef<HTMLImageElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);

  useEffect(() => {
    if (!editable) return;
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          if (imageRef.current && imageRef.current.contains(event.target as Node)) {
            if (!event.shiftKey) clearSelection();
            setSelected(true);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        () => {
          if (!isSelected) return false;
          editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) node.remove();
          });
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        () => {
          if (!isSelected) return false;
          editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) node.remove();
          });
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [clearSelection, editable, editor, isSelected, nodeKey, setSelected]);

  useEffect(() => {
    if (!editable && isSelected) clearSelection();
  }, [clearSelection, editable, isSelected]);

  const handleResizeStart = useCallback(
    (event: React.MouseEvent) => {
      if (!editable) return;
      event.preventDefault();
      event.stopPropagation();
      setIsResizing(true);

      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = currentWidth || imageRef.current?.naturalWidth || 320;
      const startHeight = currentHeight || imageRef.current?.naturalHeight || 220;
      const aspectRatio = startWidth / startHeight;

      let latestWidth = startWidth;
      let latestHeight = startHeight;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const nextWidth = Math.max(80, startWidth + deltaX);
        const nextHeight = moveEvent.shiftKey
          ? Math.max(80, startHeight + (moveEvent.clientY - startY))
          : nextWidth / aspectRatio;

        latestWidth = Math.round(nextWidth);
        latestHeight = Math.round(nextHeight);
        setCurrentWidth(latestWidth);
        setCurrentHeight(latestHeight);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            node.setWidthAndHeight(latestWidth, latestHeight);
          }
        });
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [currentHeight, currentWidth, editable, editor, nodeKey],
  );

  const handleAlignment = useCallback(
    (next: ImageAlignment) => {
      if (!editable) return;
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) node.setAlignment(next);
      });
    },
    [editable, editor, nodeKey],
  );

  const outerStyle: React.CSSProperties = {
    textAlign: alignment,
    width: "100%",
    margin: "12px 0",
  };

  const innerStyle: React.CSSProperties = {
    display: "inline-block",
    position: "relative",
  };
  if (alignment === "left") {
    innerStyle.float = "left";
    innerStyle.marginRight = "12px";
  } else if (alignment === "right") {
    innerStyle.float = "right";
    innerStyle.marginLeft = "12px";
  }

  const showSelectionChrome = editable && isSelected;

  return (
    <div style={outerStyle}>
      <div style={innerStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={src}
          alt={altText}
          width={currentWidth || undefined}
          height={currentHeight || undefined}
          className={`max-h-[520px] max-w-full rounded-lg border border-border object-contain ${
            showSelectionChrome ? "ring-2 ring-primary" : ""
          } ${isResizing ? "select-none" : ""}`}
          draggable={false}
        />

        {showSelectionChrome && (
          <div
            className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize rounded-tl bg-primary"
            onMouseDown={handleResizeStart}
            title="드래그로 크기 조절, Shift는 비율 무시"
          />
        )}

        {showSelectionChrome && (
          <div className="absolute -top-9 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-md border border-border bg-popover px-1 py-0.5 shadow-md">
            <AlignButton active={alignment === "left"} onClick={() => handleAlignment("left")} title="왼쪽 정렬">
              <AlignLeft className="h-3.5 w-3.5" />
            </AlignButton>
            <AlignButton active={alignment === "center"} onClick={() => handleAlignment("center")} title="가운데 정렬">
              <AlignCenter className="h-3.5 w-3.5" />
            </AlignButton>
            <AlignButton active={alignment === "right"} onClick={() => handleAlignment("right")} title="오른쪽 정렬">
              <AlignRight className="h-3.5 w-3.5" />
            </AlignButton>
          </div>
        )}
      </div>
    </div>
  );
}

function AlignButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1 transition-colors ${
        active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
