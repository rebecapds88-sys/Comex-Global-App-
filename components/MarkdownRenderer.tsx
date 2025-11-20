import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-sm md:prose-base max-w-none text-slate-800 dark:text-slate-200 prose-headings:font-semibold prose-a:text-blue-600 prose-table:border prose-table:border-slate-200 prose-th:bg-slate-100 prose-th:p-2 prose-td:p-2">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline ? (
              <div className="bg-slate-900 text-slate-100 rounded-md p-3 my-2 overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            ) : (
              <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            )
          },
          table({children}) {
             return <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-slate-200 border">{children}</table></div>
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;