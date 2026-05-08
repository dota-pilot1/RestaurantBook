"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  type EditorState,
  type ElementFormatType,
  type TextFormatType,
} from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { HorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { CodeHighlightNode, CodeNode, $createCodeNode, registerCodeHighlighting } from "@lexical/code";
import { LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode, type HeadingTagType } from "@lexical/rich-text";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
  $setBlocksType,
} from "@lexical/selection";
import { INSERT_TABLE_COMMAND, TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo,
  Strikethrough,
  Table,
  Underline,
  Undo,
  Youtube,
} from "lucide-react";
import { uploadBoardImage } from "@/shared/api/upload";
import { ImageNode } from "./nodes/ImageNode";
import { YoutubeNode, extractYouTubeId } from "./nodes/YoutubeNode";
import {
  DragDropImagePlugin,
  ImagePlugin,
  INSERT_IMAGE_COMMAND,
  INSERT_YOUTUBE_COMMAND,
  YoutubePlugin,
} from "./plugins/MediaPlugins";
import { TableActionMenuPlugin } from "./plugins/TableActionMenuPlugin";

type RichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
};

const theme = {
  paragraph: "mb-2 text-foreground",
  heading: {
    h1: "mb-3 text-3xl font-bold text-foreground",
    h2: "mb-2 text-xl font-bold text-foreground",
    h3: "mb-2 text-lg font-semibold text-foreground",
  },
  quote: "my-3 border-l-4 border-border pl-4 italic text-muted-foreground",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em] text-primary",
  },
  list: {
    ul: "mb-2 ml-5 list-disc",
    ol: "mb-2 ml-5 list-decimal",
    listitem: "mb-1 text-foreground",
    listitemChecked: "editor-list-item-checked",
    listitemUnchecked: "editor-list-item-unchecked",
    nested: {
      listitem: "list-none",
    },
  },
  link: "text-primary underline hover:brightness-110",
  table: "my-3 w-full table-fixed border-collapse",
  tableCell: "min-w-[80px] border border-border px-3 py-2 align-top text-sm text-foreground",
  tableCellHeader: "min-w-[80px] border border-border px-3 py-2 align-top text-sm font-semibold text-foreground",
  tableScrollableWrapper: "my-3 overflow-x-auto",
  code: "my-2 block overflow-x-auto whitespace-pre rounded-lg border border-border bg-muted p-3 font-mono text-sm text-foreground",
  codeHighlight: {
    atrule: "text-purple-500",
    attr: "text-yellow-600",
    boolean: "text-orange-500",
    builtin: "text-cyan-600",
    cdata: "text-muted-foreground",
    char: "text-green-600",
    class: "text-cyan-600",
    "class-name": "text-cyan-600",
    comment: "text-muted-foreground italic",
    constant: "text-orange-500",
    deleted: "text-red-500",
    doctype: "text-muted-foreground",
    entity: "text-yellow-600",
    function: "text-yellow-600",
    important: "text-red-500",
    inserted: "text-green-600",
    keyword: "font-semibold text-purple-500",
    namespace: "text-muted-foreground",
    number: "text-orange-500",
    operator: "text-muted-foreground",
    prolog: "text-muted-foreground",
    property: "text-blue-500",
    punctuation: "text-muted-foreground",
    regex: "text-red-500",
    selector: "text-green-600",
    string: "text-green-600",
    symbol: "text-orange-500",
    tag: "text-red-500",
    url: "text-blue-500",
    variable: "text-red-400",
  },
};

const FONT_SIZES = ["12px", "13px", "14px", "15px", "16px", "18px", "20px", "24px", "28px", "32px", "40px"];
const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: "기본", value: "inherit" },
  { label: "Sans", value: "Arial, sans-serif" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Mono", value: "Menlo, Consolas, monospace" },
  { label: "Pretendard", value: "Pretendard, sans-serif" },
];
const HIGHLIGHT_COLORS: { label: string; value: string }[] = [
  { label: "노랑", value: "#fef08a" },
  { label: "분홍", value: "#fbcfe8" },
  { label: "초록", value: "#bbf7d0" },
  { label: "파랑", value: "#bfdbfe" },
  { label: "주황", value: "#fed7aa" },
];
const TEXT_COLORS: { label: string; value: string }[] = [
  { label: "기본", value: "inherit" },
  { label: "회색", value: "#6b7280" },
  { label: "빨강", value: "#dc2626" },
  { label: "주황", value: "#ea580c" },
  { label: "노랑", value: "#ca8a04" },
  { label: "초록", value: "#16a34a" },
  { label: "파랑", value: "#2563eb" },
  { label: "보라", value: "#9333ea" },
];

function isValidLexicalJson(value?: string): value is string {
  if (!value) return false;
  try {
    return Boolean(JSON.parse(value)?.root);
  } catch {
    return false;
  }
}

function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerCodeHighlighting(editor), [editor]);
  return null;
}

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [fontSize, setFontSize] = useState("15px");
  const [fontFamily, setFontFamily] = useState("inherit");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    setActiveFormats({
      bold: selection.hasFormat("bold"),
      italic: selection.hasFormat("italic"),
      underline: selection.hasFormat("underline"),
      strikethrough: selection.hasFormat("strikethrough"),
      code: selection.hasFormat("code"),
    });
    setFontSize($getSelectionStyleValueForProperty(selection, "font-size", "15px"));
    setFontFamily($getSelectionStyleValueForProperty(selection, "font-family", "inherit"));
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(updateToolbar);
        return false;
      },
      1,
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(CAN_UNDO_COMMAND, (payload) => {
      setCanUndo(payload);
      return false;
    }, 1);
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(CAN_REDO_COMMAND, (payload) => {
      setCanRedo(payload);
      return false;
    }, 1);
  }, [editor]);

  const applyStyle = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [editor],
  );

  const setBlock = (type: "paragraph" | "quote" | "code" | HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (type === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
      } else if (type === "quote") {
        $setBlocksType(selection, () => $createQuoteNode());
      } else if (type === "code") {
        $setBlocksType(selection, () => $createCodeNode());
      } else {
        $setBlocksType(selection, () => $createHeadingNode(type));
      }
    });
  };

  const format = (type: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  };

  const align = (alignment: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const addLink = () => {
    const url = window.prompt("링크 URL을 입력하세요. 빈 값으로 제거됩니다.");
    if (url === null) return;
    const trimmed = url.trim();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed ? normalizeUrl(trimmed) : null);
  };

  const insertImageFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of imageFiles) {
        if (file.size > 10 * 1024 * 1024) {
          window.alert("이미지 크기는 10MB 이하만 업로드 가능합니다.");
          continue;
        }
        const url = await uploadBoardImage(file);
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
          src: url,
          altText: file.name,
        });
      }
    } catch (error) {
      console.error("Board image upload failed:", error);
      window.alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const addYoutube = () => {
    const url = window.prompt("YouTube URL");
    if (!url) return;
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      window.alert("올바른 YouTube URL을 입력해주세요.");
      return;
    }
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, { videoId });
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/50 px-2 py-1.5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            void insertImageFiles(event.target.files);
          }
        }}
      />

      <ToolbarButton label="실행 취소" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} disabled={!canUndo}>
        <Undo className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="다시 실행" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} disabled={!canRedo}>
        <Redo className="h-3.5 w-3.5" />
      </ToolbarButton>
      <Divider />
      <FontFamilySelect value={fontFamily} onChange={(value) => applyStyle({ "font-family": value })} />
      <FontSizeSelect value={fontSize} onChange={(value) => applyStyle({ "font-size": value })} />
      <Divider />
      <ToolbarButton label="굵게" active={activeFormats.bold} onClick={() => format("bold")}>
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="기울임" active={activeFormats.italic} onClick={() => format("italic")}>
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="밑줄" active={activeFormats.underline} onClick={() => format("underline")}>
        <Underline className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="취소선" active={activeFormats.strikethrough} onClick={() => format("strikethrough")}>
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="인라인 코드" active={activeFormats.code} onClick={() => format("code")}>
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ColorPicker icon={<Baseline className="h-3.5 w-3.5" />} title="글씨 색상" colors={TEXT_COLORS} onPick={(color) => applyStyle({ color })} />
      <ColorPicker icon={<Highlighter className="h-3.5 w-3.5" />} title="형광펜" colors={HIGHLIGHT_COLORS} onPick={(color) => applyStyle({ "background-color": color })} clearValue="transparent" />
      <Divider />
      <ToolbarButton label="문단" onClick={() => setBlock("paragraph")}>
        <Pilcrow className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="제목 1" onClick={() => setBlock("h1")}>
        <Heading1 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="제목 2" onClick={() => setBlock("h2")}>
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="제목 3" onClick={() => setBlock("h3")}>
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton label="글머리 목록" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="번호 목록" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="체크리스트" onClick={() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)}>
        <ListChecks className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="인용" onClick={() => setBlock("quote")}>
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="코드 블록" onClick={() => setBlock("code")}>
        <span className="px-1 font-mono text-[10px] font-semibold">{"{}"}</span>
      </ToolbarButton>
      <Divider />
      <ToolbarButton label="왼쪽 정렬" onClick={() => align("left")}>
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="가운데 정렬" onClick={() => align("center")}>
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="오른쪽 정렬" onClick={() => align("right")}>
        <AlignRight className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="양쪽 정렬" onClick={() => align("justify")}>
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton label="링크" onClick={addLink}>
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="수평선" onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}>
        <Minus className="h-3.5 w-3.5" />
      </ToolbarButton>
      <TableInsertButton />
      <Divider />
      <ToolbarButton label={uploading ? "이미지 업로드 중" : "이미지"} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        <ImageIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="YouTube" onClick={addYoutube}>
        <Youtube className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}

function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function TableInsertButton() {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const insert = (rows: number, columns: number) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: String(rows), columns: String(columns) });
    setOpen(false);
    setHovered(null);
  };

  return (
    <div ref={ref} className="relative">
      <ToolbarButton label="표 삽입" active={open} onClick={() => setOpen((value) => !value)}>
        <Table className="h-3.5 w-3.5" />
      </ToolbarButton>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 rounded-md border border-border bg-popover p-2 shadow-lg">
          <p className="mb-1.5 text-center text-[11px] text-muted-foreground">
            {hovered ? `${hovered.row} x ${hovered.col}` : "행 x 열 선택"}
          </p>
          <div className="flex flex-col gap-0.5">
            {Array.from({ length: 6 }, (_, row) => (
              <div key={row} className="flex gap-0.5">
                {Array.from({ length: 6 }, (_, col) => {
                  const active = hovered && row < hovered.row && col < hovered.col;
                  return (
                    <button
                      key={col}
                      type="button"
                      className={`h-5 w-5 rounded-sm border transition-colors ${
                        active
                          ? "border-primary bg-primary/20"
                          : "border-border bg-background hover:border-primary/50 hover:bg-primary/10"
                      }`}
                      onMouseEnter={() => setHovered({ row: row + 1, col: col + 1 })}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => insert(row + 1, col + 1)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorPicker({
  icon,
  title,
  colors,
  onPick,
  clearValue = "inherit",
}: {
  icon: React.ReactNode;
  title: string;
  colors: { label: string; value: string }[];
  onPick: (color: string) => void;
  clearValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <ToolbarButton label={title} active={open} onClick={() => setOpen((value) => !value)}>
        {icon}
      </ToolbarButton>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 flex items-center gap-1 rounded-md border border-border bg-popover px-2 py-1.5 shadow-lg">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              title={color.label}
              onClick={() => {
                onPick(color.value);
                setOpen(false);
              }}
              className="h-5 w-5 rounded border border-border transition-transform hover:scale-110"
              style={{ backgroundColor: color.value === "inherit" ? "transparent" : color.value }}
            />
          ))}
          <span className="mx-0.5 h-4 w-px bg-border" />
          <button
            type="button"
            title="제거"
            onClick={() => {
              onPick(clearValue);
              setOpen(false);
            }}
            className="relative h-5 w-5 overflow-hidden rounded border border-border bg-background transition-transform hover:scale-110"
          >
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">x</span>
          </button>
        </div>
      )}
    </div>
  );
}

function FontSizeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const current = FONT_SIZES.includes(value) ? value : "15px";
  return (
    <select
      value={current}
      onChange={(event) => onChange(event.target.value)}
      title="글씨 크기"
      className="h-7 rounded-md border border-border bg-background px-1.5 text-xs text-foreground outline-none hover:bg-muted focus:ring-1 focus:ring-primary"
    >
      {FONT_SIZES.map((size) => (
        <option key={size} value={size}>
          {size.replace("px", "")}
        </option>
      ))}
    </select>
  );
}

function FontFamilySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const match = FONT_FAMILIES.find((font) => font.value === value);
  return (
    <select
      value={match ? match.value : "inherit"}
      onChange={(event) => onChange(event.target.value)}
      title="글씨체"
      className="h-7 max-w-[104px] rounded-md border border-border bg-background px-1.5 text-xs text-foreground outline-none hover:bg-muted focus:ring-1 focus:ring-primary"
    >
      {FONT_FAMILIES.map((font) => (
        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
          {font.label}
        </option>
      ))}
    </select>
  );
}

function ToolbarButton({
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 min-w-7 items-center justify-center rounded-md transition-colors ${
        active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } disabled:pointer-events-none disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

function EditablePlugin({ readOnly }: { readOnly: boolean }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);
  return null;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요.",
  minHeight = "240px",
  readOnly = false,
}: RichTextEditorProps) {
  const handleChange = useCallback(
    (editorState: EditorState) => {
      onChange?.(JSON.stringify(editorState.toJSON()));
    },
    [onChange],
  );

  const initialConfig = useMemo(
    () => ({
      namespace: "RestaurantBookBoardEditor",
      theme,
      editable: !readOnly,
      editorState: isValidLexicalJson(value) ? value : undefined,
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        LinkNode,
        HorizontalRuleNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        ImageNode,
        YoutubeNode,
      ],
      onError(error: Error) {
        console.error("Lexical error:", error);
      },
    }),
    // value is only used as the initial editor seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readOnly],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background">
      <LexicalComposer initialConfig={initialConfig}>
        {!readOnly && <Toolbar />}
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="px-4 py-3 text-sm leading-7 text-foreground outline-none"
                style={{ minHeight }}
              />
            }
            placeholder={
              !readOnly ? (
                <div className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground">
                  {placeholder}
                </div>
              ) : null
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        {!readOnly && <HistoryPlugin />}
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <HorizontalRulePlugin />
        <TablePlugin hasHorizontalScroll />
        <CodeHighlightPlugin />
        <ImagePlugin />
        <YoutubePlugin />
        {!readOnly && <DragDropImagePlugin onUpload={uploadBoardImage} />}
        {!readOnly && <TableActionMenuPlugin />}
        <OnChangePlugin onChange={handleChange} />
        <EditablePlugin readOnly={readOnly} />
      </LexicalComposer>
    </div>
  );
}
