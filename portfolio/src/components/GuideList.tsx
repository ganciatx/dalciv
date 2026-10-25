"use client";

import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import { useMemo, useState } from "react";
import GuideViewer from './GuideViewer';

const TOPICS = [
  "install-and-first-launch",
  "tour",
  "search",
  "views",
  "tags",
  "shortcuts",
  "settings",
  "faq",
];

function GuidePage() {
  const { slug } = useParams();
  return <GuideViewer fileName={slug || 'introduction'} />;
}

export default function App() {
  const [activeTopic, setActiveTopic] = useState(TOPICS[0]);

  const topicMeta = useMemo(
    () =>
      TOPICS.map((slug) => ({
        slug,
        label: slug
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
      })),
    []
  );

  return (
    <BrowserRouter>
      <div className="guide-layout grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
            Table of contents
          </p>
          <nav className="mt-4 space-y-2" aria-label="Guide navigation">
            {topicMeta.map((topic) => (
              <button
                key={topic.slug}
                type="button"
                onClick={() => setActiveTopic(topic.slug)}
                className={[
                  "block w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  activeTopic === topic.slug
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-stone-900",
                ].join(" ")}
              >
                {topic.label}
              </button>
            ))}
          </nav>
        </aside>

        <main>
          <Routes>
            <Route path="/guide/:slug" element={<GuidePage />} />
            <Route path="/" element={<GuideViewer fileName="introduction" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}