"use client";

import { useEffect, useState } from "react";
import grayMatter from "gray-matter";
import { MarkdownContent } from "@/components/MarkdownContent";

function GuideViewer({ fileName }: { fileName: string }) {
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState<{ title?: string }>({});

  useEffect(() => {
    fetch(`/portfolio/content/scrinium-guide/${fileName}.md`)
      .then((res) => res.text())
      .then((text) => {
        const { data, content } = grayMatter(text);
        setMeta(data as { title?: string });
        setContent(content);
      })
      .catch(() => {
        setMeta({ title: "Guide" });
        setContent("");
      });
  }, [fileName]);

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
        {meta.title ?? "Guide"}
      </h1>
      <div className="mt-8">
        <MarkdownContent content={content} />
      </div>
    </article>
  );
}

export default GuideViewer;