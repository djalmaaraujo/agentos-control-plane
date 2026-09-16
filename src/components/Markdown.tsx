import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Assistant text is markdown. react-markdown escapes raw HTML by default (no
// rehype-raw), so this is XSS-safe. Styling is scoped to .md below.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="md text-[14px] leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
