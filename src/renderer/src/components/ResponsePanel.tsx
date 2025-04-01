import React, { useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Copy, StopCircle, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// Interface for component props
interface ResponsePanelProps {
  response: string;
  streamingChunks: string[];
  isGenerating: boolean;
  onStopGeneration: () => Promise<boolean>;
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({
  response,
  streamingChunks,
  isGenerating,
  onStopGeneration,
}) => {
  // Ref for response container
  const responseContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new chunks arrive
  useEffect(() => {
    if (responseContainerRef.current && isGenerating) {
      responseContainerRef.current.scrollTop =
        responseContainerRef.current.scrollHeight;
    }
  }, [streamingChunks, isGenerating]);

  // Copy response to clipboard
  const handleCopyResponse = () => {
    if (response || streamingChunks.join("")) {
      navigator.clipboard.writeText(
        isGenerating ? streamingChunks.join("") : response
      );
    }
  };

  // Custom renderer for code blocks
  const CodeBlock = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}>
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  // If no response and not generating, show placeholder
  if (!response && !isGenerating && streamingChunks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
        <div className="mb-4">
          <Sparkles className="w-10 h-10" />
        </div>
        <p className="text-center">Здесь будет отображаться ответ от модели.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden">
      {/* Panel header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Ответ</h3>
        {isGenerating && (
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
            <span className="text-xs text-muted-foreground">Генерация...</span>
          </div>
        )}
      </div>

      {/* Response container with markdown rendering */}
      <div
        ref={responseContainerRef}
        className="flex-1 p-3 rounded-md border bg-card overflow-y-auto">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown components={CodeBlock}>
            {isGenerating ? streamingChunks.join("") : response}
          </ReactMarkdown>

          {/* Animated cursor during generation */}
          {isGenerating && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyResponse}
          disabled={!response && streamingChunks.length === 0}>
          <Copy size={14} className="mr-1" />
          Копировать
        </Button>

        {isGenerating ? (
          <Button variant="destructive" size="sm" onClick={onStopGeneration}>
            <StopCircle size={14} className="mr-1" />
            Остановить
          </Button>
        ) : (
          <Button variant="default" size="sm" disabled>
            <Send size={14} className="mr-1" />
            Отправить новый запрос
          </Button>
        )}
      </div>
    </div>
  );
};
