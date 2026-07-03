"use client";

import React from "react";

/**
 * 轻量 Markdown 渲染(无第三方依赖),够用于 AI 解析:
 * 支持:# 标题、**加粗**、- / * / 数字列表、`代码`、空行分段。
 */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // 依次处理 **加粗** 与 `代码`
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyBase}-b-${i}`} className="font-semibold text-slate-800 dark:text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={`${keyBase}-c-${i}`}
          className="rounded bg-slate-200/70 px-1 py-0.5 text-[13px] dark:bg-slate-600/60"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    last = m.index + token.length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuf: { ordered: boolean; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!listBuf) return;
    const { ordered, items } = listBuf;
    const cls = "my-2 ml-5 space-y-1";
    blocks.push(
      ordered ? (
        <ol key={key} className={`list-decimal ${cls}`}>
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `${key}-${idx}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={key} className={`list-disc ${cls}`}>
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `${key}-${idx}`)}</li>
          ))}
        </ul>
      )
    );
    listBuf = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const key = `blk-${idx}`;

    // 标题 #, ##, ###
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flushList(`${key}-l`);
      const level = h[1].length;
      const size =
        level <= 1 ? "text-base font-bold" : level === 2 ? "text-[15px] font-semibold" : "text-sm font-semibold";
      blocks.push(
        <div key={key} className={`mt-3 mb-1 ${size} text-slate-800 dark:text-slate-100`}>
          {renderInline(h[2], key)}
        </div>
      );
      return;
    }

    // 有序列表 1. 2.
    const ol = /^\s*(\d+)[.、)]\s+(.*)$/.exec(line);
    if (ol) {
      if (!listBuf || !listBuf.ordered) {
        flushList(`${key}-l`);
        listBuf = { ordered: true, items: [] };
      }
      listBuf.items.push(ol[2]);
      return;
    }

    // 无序列表 - / *
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    if (ul) {
      if (!listBuf || listBuf.ordered) {
        flushList(`${key}-l`);
        listBuf = { ordered: false, items: [] };
      }
      listBuf.items.push(ul[1]);
      return;
    }

    // 空行
    if (line.trim() === "") {
      flushList(`${key}-l`);
      return;
    }

    // 普通段落
    flushList(`${key}-l`);
    blocks.push(
      <p key={key} className="my-1.5 leading-relaxed">
        {renderInline(line, key)}
      </p>
    );
  });

  flushList("blk-final");

  return <div className="text-sm text-slate-600 dark:text-slate-300">{blocks}</div>;
}
