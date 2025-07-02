import React, { useState, useRef, useEffect } from 'react';
import axios from '../api/axiosInstance';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const AIChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string; isWaiting?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('ai-chat-messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Filter out any waiting messages that might have been saved
        const cleanedMessages = parsedMessages.filter((msg: any) => !msg.isWaiting);
        setMessages(cleanedMessages);
      } catch (error) {
        console.error('Error loading chat messages from localStorage:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Filter out waiting messages before saving
      const messagesToSave = messages.filter(msg => !msg.isWaiting);
      localStorage.setItem('ai-chat-messages', JSON.stringify(messagesToSave));
    }
  }, [messages]);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Function to detect and extract language from code blocks
  const detectLanguage = (code: string): string => {
    // Simple language detection based on common patterns
    if (code.includes('import ') && (code.includes('from ') || code.includes('React'))) return 'javascript';
    if (code.includes('def ') || (code.includes('import ') && code.includes('python'))) return 'python';
    if (code.includes('public class') || code.includes('import java')) return 'java';
    if (code.includes('#include') || code.includes('int main')) return 'cpp';
    if (code.includes('SELECT') || code.includes('FROM') || code.includes('WHERE')) return 'sql';
    if (code.includes('<html>') || code.includes('<div>') || code.includes('<script>')) return 'html';
    if (code.includes('{') && code.includes('}') && code.includes(':')) return 'json';
    if (code.includes('curl ') || code.includes('npm ') || code.includes('git ')) return 'bash';
    return 'javascript'; // default
  };

  // Enhanced function to format AI response text with code block support
  const formatAIResponse = (text: string) => {
    // Split text by code blocks (triple backticks)
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, partIndex) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // This is a code block
        const codeContent = part.slice(3, -3).trim();
        const lines = codeContent.split('\n');
        const firstLine = lines[0];
        
        // Check if first line contains language specification
        const languageMatch = firstLine.match(/^([a-zA-Z]+)$/);
        let language = 'javascript';
        let code = codeContent;
        
        if (languageMatch) {
          language = languageMatch[1].toLowerCase();
          code = lines.slice(1).join('\n');
        } else {
          // Auto-detect language
          language = detectLanguage(codeContent);
        }

        return (
          <div key={partIndex} className="my-4 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
              <span className="text-sm text-gray-300 font-mono">{language}</span>
              <button
                onClick={() => copyToClipboard(code)}
                className="text-gray-300 hover:text-white transition-colors px-3 py-1 rounded text-sm bg-gray-700 hover:bg-gray-600"
                title="Copy code"
              >
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                Copy
              </button>
            </div>
            <div className="overflow-x-auto">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  background: 'transparent'
                }}
                showLineNumbers={true}
                wrapLines={true}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      } else {
        // Regular text content - process line by line
        const lines = part.split('\n').filter(line => line.trim() !== '');
        
        return lines.map((line, lineIndex) => {
          const trimmedLine = line.trim();
          
          // Handle inline code with single backticks
          if (trimmedLine.includes('`')) {
            const inlineCodeParts = trimmedLine.split(/(`[^`]+`)/g);
            const formattedInlineCode = inlineCodeParts.map((inlinePart, inlineIndex) => {
              if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
                return (
                  <code key={inlineIndex} className="bg-gray-200 text-gray-800 px-2 py-1 rounded font-mono text-sm">
                    {inlinePart.slice(1, -1)}
                  </code>
                );
              }
              return formatInlineText(inlinePart);
            });
            
            return (
              <div key={`${partIndex}-${lineIndex}`} className="mb-3 leading-relaxed">
                {formattedInlineCode}
              </div>
            );
          }
          
          // Handle different types of content
          if (trimmedLine.match(/^\*\*(.+?)\*\*:?/)) {
            // Bold headers (like "What it is:", "Purpose:", etc.)
            const content = trimmedLine.replace(/^\*\*(.+?)\*\*:?/, '$1');
            return (
              <div key={`${partIndex}-${lineIndex}`} className="font-bold text-gray-900 mt-4 mb-2 text-xl">
                {content}
              </div>
            );
          } else if (trimmedLine.startsWith('* ')) {
            // Bullet points
            const content = trimmedLine.substring(2).trim();
            return (
              <div key={`${partIndex}-${lineIndex}`} className="flex items-start mb-2 ml-4">
                <span className="text-blue-500 mr-2 mt-1">•</span>
                <span className="flex-1">{formatInlineText(content)}</span>
              </div>
            );
          } else if (trimmedLine.match(/^\d+\./)) {
            // Numbered lists
            return (
              <div key={`${partIndex}-${lineIndex}`} className="ml-4 mb-2">
                {formatInlineText(trimmedLine)}
              </div>
            );
          } else if (trimmedLine.length > 0) {
            // Regular paragraphs
            return (
              <div key={`${partIndex}-${lineIndex}`} className="mb-3 leading-relaxed">
                {formatInlineText(trimmedLine)}
              </div>
            );
          }
          return null;
        }).filter(Boolean);
      }
    }).flat();
  };

  // Helper function to format inline text (bold, italic, links)
  const formatInlineText = (text: string) => {
    // First handle URLs (including those in brackets like [text](url) and plain URLs)
    const urlRegex = /(https?:\/\/[^\s)]+|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
    const urlParts = text.split(urlRegex);
    
    return urlParts.map((urlPart, urlIndex) => {
      // Check if this part is a markdown link [text](url)
      const markdownLinkMatch = urlPart.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      if (markdownLinkMatch) {
        const [, linkText, url] = markdownLinkMatch;
        return (
          <a
            key={urlIndex}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
          >
            {linkText}
          </a>
        );
      }
      
      // Check if this part is a plain URL
      if (urlPart.match(/^https?:\/\//)) {
        return (
          <a
            key={urlIndex}
            href={urlPart}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors break-all"
          >
            {urlPart}
          </a>
        );
      }
      
      // Handle bold text **text**
      const parts = urlPart.split(/(\*\*[^*]+\*\*)/g);
      
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={`${urlIndex}-${index}`} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
        } else {
          // Handle italic text *text*
          const italicParts = part.split(/(\*[^*]+\*)/g);
          return italicParts.map((italicPart, italicIndex) => {
            if (italicPart.startsWith('*') && italicPart.endsWith('*') && italicPart.length > 2) {
              return <em key={`${urlIndex}-${index}-${italicIndex}`} className="italic font-medium text-gray-700">{italicPart.slice(1, -1)}</em>;
            }
            return italicPart;
          });
        }
      });
    }).flat();
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { sender: 'user' as const, text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    
    // Add a temporary "waiting" message
    const waitingMsg = { sender: 'ai' as const, text: 'AI is thinking...', isWaiting: true };
    setMessages(msgs => [...msgs, waitingMsg]);
    
    try {
      const res = await axios.post('/ai/chat', { message: input });
      // Remove the waiting message and add the actual response
      setMessages(msgs => msgs.slice(0, -1).concat([{ sender: 'ai', text: res.data || 'No response.' }]));
    } catch (err: any) {
      // Remove the waiting message and add the error
      setMessages(msgs => msgs.slice(0, -1).concat([{ sender: 'ai', text: 'Error: Could not get response.' }]));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="fixed z-50 bottom-8 right-8 w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2 border-white"
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Chat"
      >
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h8c1.1 0 2-.9 2-2v-8c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8v6h-8z"/>
          <circle cx="9" cy="12" r="1.5"/>
          <circle cx="15" cy="12" r="1.5"/>
          <path d="M8 15.5c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2"/>
        </svg>
      </button>
      {/* Chat Window */}
      {open && (
        <div className="fixed z-50 bottom-32 right-8 w-[60rem] max-w-[95vw] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white">
            <span className="font-semibold text-xl">Security-Tool Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200 text-3xl">&times;</button>
          </div>
          <div className="flex-1 p-8 overflow-y-auto max-h-[48rem]" style={{ minHeight: 600 }}>
            {messages.length === 0 && <div className="text-gray-400 text-center text-lg">Ask me anything!</div>}
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} ${msg.sender === 'user' ? 'items-center' : 'items-start'}`}>
                {/* AI Avatar (left side for AI messages) */}
                {msg.sender === 'ai' && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h8c1.1 0 2-.9 2-2v-8c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8v6h-8z"/>
                      <circle cx="9" cy="12" r="1.5"/>
                      <circle cx="15" cy="12" r="1.5"/>
                      <path d="M8 15.5c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2"/>
                    </svg>
                  </div>
                )}
                
                <div className={`px-6 py-4 rounded-lg max-w-[85%] ${
                  msg.sender === 'user' 
                    ? 'bg-blue-100 text-blue-900 text-lg' 
                    : msg.isWaiting 
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200 text-lg' 
                      : 'bg-gray-50 text-gray-800 border border-gray-200 shadow-sm'
                }`}>
                  {msg.isWaiting ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="italic">AI is thinking...</span>
                    </div>
                  ) : msg.sender === 'ai' ? (
                    <div className="text-base leading-relaxed">{formatAIResponse(msg.text)}</div>
                  ) : (
                    <div className="text-lg">{msg.text}</div>
                  )}
                </div>

                {/* User Avatar (right side for user messages) */}
                {msg.sender === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ml-3 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendMessage} className="flex border-t border-gray-200">
            <input
              type="text"
              className="flex-1 px-6 py-4 outline-none text-lg"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className="px-8 py-4 bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 text-lg"
              disabled={loading || !input.trim()}
            >
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
