import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders markdown blog content with styled typography */
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-stone max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-stone-900 prose-a:underline prose-strong:text-stone-900 prose-code:rounded prose-code:bg-stone-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-stone-900 prose-pre:text-stone-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
