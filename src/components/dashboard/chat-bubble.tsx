"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Icons } from "./icons";
import { copyTextToClipboard } from "@/lib/clipboard";
import { normalizeChatReply } from "@/lib/text/normalize";

export interface ChatBubbleProps {
  role: "user" | "ai";
  content: string;
  /** Short timestamp shown under the message. */
  timestamp?: string;
  /** Which quick action produced this reply, if any. */
  source?: string;
}

/**
 * One chat message.
 *
 * Design intent:
 *   - The user's own words sit on the right in the accent colour, so the thread
 *     reads top to bottom without needing an avatar on every line.
 *   - Assistant replies sit on the left with an avatar, because they are
 *     generated and benefit from being attributed.
 *   - The reply body is normalised before rendering, so punctuation and
 *     whitespace are consistent no matter what the model returned.
 *   - The copy control is a real button with a label, so it is reachable by
 *     keyboard and announced by a screen reader.
 */
export function ChatBubble({ role, content, timestamp, source }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  // Normalise once per render. A user message is already clean but goes through
  // the same path so the two sides cannot drift apart visually.
  const body = normalizeChatReply(content, 1200);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(body);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fade-up chat-row"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        flexDirection: isUser ? "row-reverse" : "row",
        position: "relative",
      }}
    >
      {!isUser && <ChatAvatar />}

      <div
        className="chat-bubble"
        style={{
          maxWidth: "84%",
          padding: isUser ? "11px 15px" : "12px 15px 10px",
          borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
          background: isUser ? "var(--ac)" : "var(--bg1)",
          border: isUser ? "none" : "1px solid var(--br)",
          color: isUser ? "#fff" : "var(--tx)",
          boxShadow: isUser ? "none" : "0 8px 24px rgba(0,0,0,0.06)",
          minWidth: 0,
        }}
      >
        {isUser ? (
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              lineHeight: 1.65,
              // Preserve the line breaks the user typed instead of collapsing
              // them, which is what made pasted multi line notes look mangled.
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {body}
          </p>
        ) : (
          <AssistantBody content={body} />
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 7,
            minHeight: 14,
            flexWrap: "wrap",
          }}
        >
          {timestamp && (
            <span
              style={{
                fontSize: 9.5,
                opacity: 0.5,
                fontFamily: "var(--font-mono)",
                marginRight: "auto",
                color: isUser ? "#fff" : "var(--tx3)",
              }}
            >
              {timestamp}
            </span>
          )}
          {!isUser && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy reply"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 6px",
                borderRadius: 5,
                border: "1px solid var(--br)",
                background: "var(--bg2)",
                color: copied ? "var(--gr)" : "var(--tx3)",
                fontSize: 9.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "color .15s, border-color .15s",
              }}
            >
              {copied ? <Icons.Check size={10} /> : <Icons.Copy size={10} />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Avatar shown beside an assistant reply. */
function ChatAvatar() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        flexShrink: 0,
        background: "linear-gradient(135deg, #6366f1, #a78bfa)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 10px rgba(99,102,241,0.28)",
      }}
    >
      <Icons.Chat size={14} style={{ color: "#fff" }} />
    </div>
  );
}

/**
 * Renders an assistant reply.
 *
 * Markdown is enabled for bold, italic, code, and lists, because the model is
 * asked for a tight bullet list. Headings and links are deliberately not
 * styled, since the model is told not to produce them. External links get
 * rel="noreferrer" and an explicit target so a reply cannot navigate the user
 * away from their own board.
 */
function AssistantBody({ content }: { content: string }) {
  const isBulletList = /^\s*[-*]\s+/m.test(content);

  return (
    <div
      style={{
        fontSize: 13.5,
        lineHeight: 1.7,
        color: "var(--tx)",
        overflowWrap: "anywhere",
      }}
    >
      <ReactMarkdown
        components={{
          p: ({ node: _node, ...props }) => (
            <p style={{ margin: "0 0 8px 0" }} {...props} />
          ),
          ul: ({ node: _node, ...props }) => (
            <ul
              style={{
                margin: isBulletList ? "4px 0 2px" : 0,
                paddingLeft: 20,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
              {...props}
            />
          ),
          ol: ({ node: _node, ...props }) => (
            <ol style={{ margin: "4px 0", paddingLeft: 20 }} {...props} />
          ),
          li: ({ node: _node, ...props }) => (
            <li style={{ margin: 0, lineHeight: 1.6 }} {...props} />
          ),
          strong: ({ node: _node, ...props }) => (
            <strong style={{ fontWeight: 700, color: "var(--tx)" }} {...props} />
          ),
          em: ({ node: _node, ...props }) => (
            <em style={{ fontStyle: "italic" }} {...props} />
          ),
          code: ({ node: _node, ...props }) => (
            <code
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--br)",
                padding: "1px 5px",
                borderRadius: 4,
                fontFamily: "var(--font-mono)",
                fontSize: "0.9em",
              }}
              {...props}
            />
          ),
          a: ({ node: _node, ...props }) => (
            <a
              style={{ color: "var(--ac-text)", textDecoration: "underline" }}
              target="_blank"
              rel="noreferrer noopener"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
