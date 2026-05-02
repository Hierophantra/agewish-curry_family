'use client'
// components/chronicles/ChronicleBody.tsx
// Renders the chronicle's markdown body using react-markdown.
// D-10: 'use client' required because react-markdown v10 uses client-side rendering hooks.
// D-05: NO rehype-raw — never allow raw HTML from user content (XSS boundary).
// D-11: Receives the markdown source string as a prop; no data fetching here.
import ReactMarkdown from 'react-markdown'

interface ChronicleBodyProps {
  body: string
}

export default function ChronicleBody({ body }: ChronicleBodyProps) {
  return (
    <div className="font-serif text-navy max-w-prose leading-[1.85] text-[1.0625rem] chronicle-body">
      <ReactMarkdown
        components={{
          // Paragraphs — generous spacing for long-form reading
          p: ({ children }) => (
            <p className="mb-5 last:mb-0">{children}</p>
          ),
          // Blockquotes — for direct quotes from relatives
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-gold pl-5 my-6 font-serif italic text-muted">
              {children}
            </blockquote>
          ),
          // Headings — for chapter-like divisions within long chronicles
          h2: ({ children }) => (
            <h2 className="font-serif text-navy text-2xl font-normal mt-10 mb-4 leading-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif text-navy text-xl font-normal mt-8 mb-3 leading-tight">
              {children}
            </h3>
          ),
          // Emphasis — italic (the default for * in markdown) — just ensure font-serif
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          // Strong — bold for emphasis within prose
          strong: ({ children }) => (
            <strong className="font-semibold text-navy">{children}</strong>
          ),
          // Horizontal rule — section divider
          hr: () => (
            <hr className="border-0 border-t border-stone my-10" />
          ),
          // Unordered list
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 mb-5 space-y-1">{children}</ul>
          ),
          // Ordered list
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 mb-5 space-y-1">{children}</ol>
          ),
          // List item
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}
