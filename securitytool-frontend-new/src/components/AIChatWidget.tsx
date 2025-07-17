import React, { useState, useRef, useEffect } from 'react';
import axios from '../api/axiosInstance';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  isWaiting?: boolean;
  file?: {
    name: string;
    size: number;
    type: string;
  };
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const AIChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper functions for conversation management
  const createNewConversation = (): Conversation => {
    const id = Date.now().toString();
    return {
      id,
      title: `Chat ${conversations.length + 1}`,
      messages: [],
      createdAt: new Date()
    };
  };

  const getActiveConversation = (): Conversation | undefined => {
    return conversations.find(conv => conv.id === activeConversationId);
  };

  const updateActiveConversation = (updater: (conv: Conversation) => Conversation) => {
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === activeConversationId ? updater(conv) : conv
      )
    );
  };

  // Load conversations from localStorage on component mount
  useEffect(() => {
    const createInitialConversation = (): Conversation => {
      const id = Date.now().toString();
      return {
        id,
        title: `Chat 1`,
        messages: [],
        createdAt: new Date()
      };
    };

    const savedConversations = localStorage.getItem('ai-chat-conversations');
    const savedActiveId = localStorage.getItem('ai-chat-active-id');
    
    if (savedConversations) {
      try {
        const parsedConversations: Conversation[] = JSON.parse(savedConversations).map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          messages: conv.messages.filter((msg: any) => !msg.isWaiting) // Filter out waiting messages
        }));
        
        setConversations(parsedConversations);
        
        if (savedActiveId && parsedConversations.some(conv => conv.id === savedActiveId)) {
          setActiveConversationId(savedActiveId);
        } else if (parsedConversations.length > 0) {
          setActiveConversationId(parsedConversations[0].id);
        }
      } catch (error) {
        console.error('Error loading chat conversations from localStorage:', error);
        // Create initial conversation if loading fails
        const initialConv = createInitialConversation();
        setConversations([initialConv]);
        setActiveConversationId(initialConv.id);
      }
    } else {
      // Create initial conversation if none exists
      const initialConv = createInitialConversation();
      setConversations([initialConv]);
      setActiveConversationId(initialConv.id);
    }
  }, []);

  // Save conversations to localStorage whenever conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      // Filter out waiting messages before saving
      const conversationsToSave = conversations.map(conv => ({
        ...conv,
        messages: conv.messages.filter(msg => !msg.isWaiting)
      }));
      localStorage.setItem('ai-chat-conversations', JSON.stringify(conversationsToSave));
    }
  }, [conversations]);

  // Save active conversation ID to localStorage
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem('ai-chat-active-id', activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, conversations, activeConversationId]);

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
    if ((!input.trim() && !selectedFile) || !activeConversationId) return;
    
    const userMsg: Message = { 
      sender: 'user' as const, 
      text: input || (selectedFile ? `Uploaded file: ${selectedFile.name}` : ''),
      file: selectedFile ? {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      } : undefined
    };
    
    // Add user message to active conversation
    updateActiveConversation(conv => ({
      ...conv,
      messages: [...conv.messages, userMsg]
    }));
    
    const messageText = input;
    const fileToUpload = selectedFile;
    
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setLoading(true);
    setFileUploading(true);
    
    // Add a temporary "waiting" message
    const waitingMsg: Message = { sender: 'ai' as const, text: 'AI is analyzing...', isWaiting: true };
    updateActiveConversation(conv => ({
      ...conv,
      messages: [...conv.messages, waitingMsg]
    }));
    
    try {
      let res: any;
      
      if (fileToUpload) {
        // Upload file with message
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('message', messageText || 'Please analyze this file');
        
        res = await axios.post('/ai/chat-with-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Regular text message
        res = await axios.post('/ai/chat', { message: messageText });
      }
      
      // Remove the waiting message and add the actual response
      updateActiveConversation(conv => ({
        ...conv,
        messages: [...conv.messages.slice(0, -1), { sender: 'ai', text: res.data || 'No response.' }]
      }));
    } catch (err: any) {
      // Remove the waiting message and add the error
      const errorMessage = fileToUpload 
        ? 'Error: Could not analyze file. Please try again.'
        : 'Error: Could not get response.';
      
      updateActiveConversation(conv => ({
        ...conv,
        messages: [...conv.messages.slice(0, -1), { sender: 'ai', text: errorMessage }]
      }));
    } finally {
      setLoading(false);
      setFileUploading(false);
    }
  };

  const handleNewConversation = () => {
    const newConv = createNewConversation();
    setConversations(prev => [...prev, newConv]);
    setActiveConversationId(newConv.id);
  };

  const handleCloseConversation = (conversationId: string) => {
    if (conversations.length <= 1) return; // Don't close if it's the only conversation
    
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    
    if (activeConversationId === conversationId) {
      const remainingConversations = conversations.filter(conv => conv.id !== conversationId);
      if (remainingConversations.length > 0) {
        setActiveConversationId(remainingConversations[0].id);
      }
    }
  };

  const handleStartEditTitle = (conversationId: string, currentTitle: string) => {
    setEditingTitleId(conversationId);
    setEditingTitleValue(currentTitle);
  };

  const handleSaveTitle = (conversationId: string) => {
    if (editingTitleValue.trim()) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, title: editingTitleValue.trim() }
            : conv
        )
      );
    }
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const handleCancelEditTitle = () => {
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type (CSV or text files)
      const allowedTypes = [
        'text/csv',
        'text/plain',
        'application/csv',
        'text/comma-separated-values'
      ];
      
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const isValidType = allowedTypes.includes(file.type) || 
                         fileExtension === 'csv' || 
                         fileExtension === 'txt';
      
      if (!isValidType) {
        alert('Please select a CSV or text file only.');
        return;
      }
      
      // Check file size (limit to 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File size must be less than 10MB.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];

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
          {/* Header with tabs */}
          <div className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
            {/* Tab Bar */}
            <div className="flex items-center px-4 pt-2 overflow-x-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center px-3 py-2 mr-1 rounded-t-lg cursor-pointer transition-colors min-w-0 max-w-40 ${
                    activeConversationId === conv.id
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/15'
                  }`}
                  onClick={() => setActiveConversationId(conv.id)}
                >
                  {editingTitleId === conv.id ? (
                    <input
                      type="text"
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onBlur={() => handleSaveTitle(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveTitle(conv.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEditTitle();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white/20 text-white text-sm font-medium px-2 py-1 rounded border-none outline-none flex-1 min-w-0"
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className="truncate text-sm font-medium flex-1 mr-1">
                        {conv.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditTitle(conv.id, conv.title);
                        }}
                        className="w-6 h-6 rounded hover:bg-white/20 flex items-center justify-center transition-colors mr-1"
                        title="Edit conversation name"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </>
                  )}
                  {conversations.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseConversation(conv.id);
                      }}
                      className="w-6 h-6 rounded hover:bg-white/20 flex items-center justify-center transition-colors"
                      title="Close conversation"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {/* Plus button for new conversation */}
              <button
                onClick={handleNewConversation}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors ml-2 flex-shrink-0"
                title="New conversation"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Header Title and Close Button */}
            <div className="flex items-center justify-between px-8 py-4">
              <span className="font-semibold text-xl">Security-Tool Assistant</span>
              <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200 text-3xl">&times;</button>
            </div>
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
                    <div className="text-lg">
                      {msg.file && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <div className="font-medium text-blue-800">{msg.file.name}</div>
                              <div className="text-sm text-blue-600">{formatFileSize(msg.file.size)} • {msg.file.type}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {msg.text}
                    </div>
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
          
          {/* File Upload Area */}
          {selectedFile && (
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">{selectedFile.name}</div>
                    <div className="text-sm text-gray-500">{formatFileSize(selectedFile.size)} • {selectedFile.type}</div>
                  </div>
                </div>
                <button
                  onClick={removeSelectedFile}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove file"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={sendMessage} className="border-t border-gray-200">
            <div className="flex items-center px-6 py-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv,.txt,text/csv,text/plain"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mr-3 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Upload CSV or text file"
                disabled={loading || fileUploading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input
                type="text"
                className="flex-1 px-4 py-3 outline-none text-lg border border-gray-300 rounded-lg focus:border-blue-500 transition-colors"
                placeholder={selectedFile ? "Add a message about your file..." : "Type your message..."}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading || fileUploading}
                autoFocus
              />
              <button
                type="submit"
                className="ml-3 px-6 py-3 bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 text-lg rounded-lg"
                disabled={loading || fileUploading || (!input.trim() && !selectedFile)}
              >
                {loading || fileUploading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
