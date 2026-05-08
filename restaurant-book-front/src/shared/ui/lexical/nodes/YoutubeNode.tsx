import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { $applyNodeReplacement, DecoratorNode } from "lexical";
import type { ReactElement } from "react";

export type YoutubePayload = {
  videoId: string;
  key?: NodeKey;
};

export type SerializedYoutubeNode = Spread<
  {
    videoId: string;
  },
  SerializedLexicalNode
>;

const EMBED_PREFIX = "https://www.youtube.com/embed/";

function convertYoutubeElement(domNode: Node): DOMConversionOutput | null {
  if (!(domNode instanceof HTMLIFrameElement)) return null;
  const src = domNode.getAttribute("src") ?? "";
  const match = src.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
  if (!match) return null;
  return { node: $createYoutubeNode({ videoId: match[1] }) };
}

export class YoutubeNode extends DecoratorNode<ReactElement> {
  __videoId: string;

  static getType(): string {
    return "youtube";
  }

  static clone(node: YoutubeNode): YoutubeNode {
    return new YoutubeNode(node.__videoId, node.__key);
  }

  static importJSON(serializedNode: SerializedYoutubeNode): YoutubeNode {
    return $createYoutubeNode({ videoId: serializedNode.videoId });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (node: HTMLElement) => {
        const src = node.getAttribute("src") ?? "";
        if (!src.includes("youtube.com/embed/")) return null;
        return { conversion: convertYoutubeElement, priority: 0 };
      },
    };
  }

  constructor(videoId: string, key?: NodeKey) {
    super(key);
    this.__videoId = videoId;
  }

  exportJSON(): SerializedYoutubeNode {
    return {
      type: "youtube",
      version: 1,
      videoId: this.__videoId,
    };
  }

  exportDOM(): DOMExportOutput {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("src", `${EMBED_PREFIX}${this.__videoId}`);
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
    );
    iframe.style.width = "100%";
    iframe.style.aspectRatio = "16 / 9";
    iframe.style.border = "0";
    iframe.style.borderRadius = "8px";

    const wrapper = document.createElement("div");
    wrapper.style.margin = "12px 0";
    wrapper.appendChild(iframe);
    return { element: wrapper };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "my-3";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): ReactElement {
    return (
      <div className="my-3 overflow-hidden rounded-lg border border-border bg-muted">
        <iframe
          src={`${EMBED_PREFIX}${this.__videoId}`}
          title="YouTube video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>
    );
  }
}

export function $createYoutubeNode(payload: YoutubePayload): YoutubeNode {
  return $applyNodeReplacement(new YoutubeNode(payload.videoId, payload.key));
}

export function $isYoutubeNode(node: LexicalNode | null | undefined): node is YoutubeNode {
  return node instanceof YoutubeNode;
}

export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}
