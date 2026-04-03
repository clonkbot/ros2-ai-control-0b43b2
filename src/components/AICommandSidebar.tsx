import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface AICommandSidebarProps {
  robotId: Id<"robots"> | null;
}

function CodeBlock({ code, type, onExecute }: { code: string; type: string; onExecute: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageColor = () => {
    switch (type) {
      case "yaml": return "text-yellow-400";
      case "python": return "text-blue-400";
      case "bash": return "text-green-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="mt-3 rounded-lg bg-gray-900/80 border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 border-b border-gray-700">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${getLanguageColor()}`}>
          {type}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-[10px] text-gray-400 hover:text-white transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onExecute}
            className="px-2 py-1 text-[10px] bg-green-500/20 text-green-400 rounded border border-green-500/30 hover:bg-green-500/30 transition-all flex items-center gap-1"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Execute
          </button>
        </div>
      </div>
      <pre className="p-3 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

export function AICommandSidebar({ robotId }: AICommandSidebarProps) {
  const commands = useQuery(api.commands.list, robotId ? { robotId } : {});
  const sendCommand = useMutation(api.commands.send);
  const markExecuted = useMutation(api.commands.markExecuted);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [commands]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsTyping(true);
    try {
      await sendCommand({ message: input.trim(), robotId: robotId || undefined });
      setInput("");
    } finally {
      setIsTyping(false);
    }
  };

  const handleExecute = async (commandId: Id<"commands">) => {
    await markExecuted({ id: commandId });
  };

  const suggestions = [
    "Move to position (1.5, 0, -1)",
    "Arm the robot gripper",
    "Start LIDAR scan",
    "Show system diagnostics",
    "Configure navigation stack",
    "Launch Gazebo simulation",
  ];

  // Sort commands by creation time (oldest first for chat display)
  const sortedCommands = commands ? [...commands].reverse() : [];

  return (
    <div className="h-full flex flex-col bg-[#08080c]">
      {/* Header */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 0110 10 10 10 0 01-10 10A10 10 0 012 12 10 10 0 0112 2z" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold">AI Command Interface</h2>
            <p className="text-[10px] text-gray-500">Gemini 3.1 Pro · ROS2 Agent</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {/* Welcome message */}
        {sortedCommands.length === 0 && (
          <div className="text-center py-6 sm:py-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">AI Command Ready</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto mb-4 sm:mb-6">
              Instruct the robot using natural language. I'll generate the ROS2 configurations and code.
            </p>

            {/* Suggestions */}
            <div className="space-y-2">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Try saying:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.slice(0, 3).map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs bg-gray-900/50 border border-gray-700 rounded-lg text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Command history */}
        {sortedCommands.map((command) => (
          <div key={command._id} className="space-y-3">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[85%] px-3 sm:px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl rounded-br-md">
                <p className="text-xs sm:text-sm text-cyan-100">{command.message}</p>
              </div>
            </div>

            {/* AI response */}
            <div className="flex gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex-shrink-0 flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 0110 10 10 10 0 01-10 10A10 10 0 012 12 10 10 0 0112 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-300">{command.response}</p>
                {command.codeSnippet && command.codeType && (
                  <CodeBlock
                    code={command.codeSnippet}
                    type={command.codeType}
                    onExecute={() => handleExecute(command._id)}
                  />
                )}
                {command.executed && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-400">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Executed successfully
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex-shrink-0 flex items-center justify-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 0110 10 10 10 0 01-10 10A10 10 0 012 12 10 10 0 0112 2z" />
              </svg>
            </div>
            <div className="px-3 sm:px-4 py-2 bg-gray-900/50 rounded-2xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-800">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Command the robot..."
            rows={2}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 bg-gray-900/50 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-[10px] text-gray-600 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
