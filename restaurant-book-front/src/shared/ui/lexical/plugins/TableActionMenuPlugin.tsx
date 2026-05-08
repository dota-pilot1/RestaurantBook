"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
} from "@lexical/table";
import { MoreHorizontal } from "lucide-react";

const CELL_COLORS = [
  { label: "없음", value: "" },
  { label: "노랑", value: "#fef9c3" },
  { label: "초록", value: "#dcfce7" },
  { label: "파랑", value: "#dbeafe" },
  { label: "분홍", value: "#fce7f3" },
  { label: "주황", value: "#ffedd5" },
  { label: "회색", value: "#f3f4f6" },
];

export function TableActionMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateAnchor = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        setAnchorRect(null);
        setOpen(false);
        return;
      }

      const node = selection.anchor.getNode();
      const cellNode = $getTableCellNodeFromLexicalNode(node);
      if (!cellNode || !$isTableCellNode(cellNode)) {
        setAnchorRect(null);
        setOpen(false);
        return;
      }

      const cellDom = editor.getElementByKey(cellNode.getKey());
      setAnchorRect(cellDom?.getBoundingClientRect() ?? null);
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateAnchor();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, updateAnchor]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const run = (fn: () => void) => {
    editor.update(fn);
    setOpen(false);
  };

  const setCellBg = (color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const cellNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
      if (cellNode && $isTableCellNode(cellNode)) {
        cellNode.setBackgroundColor(color);
      }
    });
    setOpen(false);
  };

  const deleteTable = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const cellNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
      if (!cellNode) return;
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
      tableNode.remove();
    });
    setOpen(false);
    setAnchorRect(null);
  };

  if (!anchorRect) return null;

  return createPortal(
    <>
      <button
        type="button"
        style={{
          position: "fixed",
          top: anchorRect.top + 2,
          left: anchorRect.right - 22,
          zIndex: 100,
        }}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="flex h-4 w-4 items-center justify-center rounded bg-primary/70 text-primary-foreground shadow-sm hover:bg-primary"
      >
        <MoreHorizontal className="h-3 w-3" />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: anchorRect.bottom - 2,
            left: anchorRect.right - 176,
            zIndex: 100,
          }}
          className="w-44 overflow-hidden rounded-md border border-border bg-popover py-1 text-sm shadow-lg"
        >
          <MenuSection label="행" />
          <MenuItem onClick={() => run(() => $insertTableRowAtSelection(false))}>위에 행 추가</MenuItem>
          <MenuItem onClick={() => run(() => $insertTableRowAtSelection(true))}>아래 행 추가</MenuItem>
          <MenuItem onClick={() => run(() => $deleteTableRowAtSelection())} danger>
            행 삭제
          </MenuItem>

          <MenuDivider />
          <MenuSection label="열" />
          <MenuItem onClick={() => run(() => $insertTableColumnAtSelection(false))}>왼쪽에 열 추가</MenuItem>
          <MenuItem onClick={() => run(() => $insertTableColumnAtSelection(true))}>오른쪽에 열 추가</MenuItem>
          <MenuItem onClick={() => run(() => $deleteTableColumnAtSelection())} danger>
            열 삭제
          </MenuItem>

          <MenuDivider />
          <MenuSection label="셀 배경색" />
          <div className="flex flex-wrap gap-1 px-3 py-1.5">
            {CELL_COLORS.map((color) => (
              <button
                key={color.label}
                type="button"
                title={color.label}
                onClick={() => setCellBg(color.value)}
                className="h-5 w-5 rounded border border-border transition-transform hover:scale-110"
                style={{
                  backgroundColor: color.value || "transparent",
                  backgroundImage: color.value
                    ? undefined
                    : "linear-gradient(to bottom right, transparent calc(50% - 0.5px), #ef4444 calc(50% - 0.5px), #ef4444 calc(50% + 0.5px), transparent calc(50% + 0.5px))",
                }}
              />
            ))}
          </div>

          <MenuDivider />
          <MenuItem onClick={deleteTable} danger>
            표 전체 삭제
          </MenuItem>
        </div>
      )}
    </>,
    document.body,
  );
}

function MenuSection({ label }: { label: string }) {
  return (
    <p className="px-3 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
  );
}

function MenuDivider() {
  return <div className="my-1 h-px bg-border" />;
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
        danger ? "text-destructive hover:bg-destructive/10" : "text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
