'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  SaveOutlined,
  EditOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { marked } from 'marked';
import TurndownService from 'turndown';
import MarkdownRenderer from './markdown-renderer';

// No need for ReactQuill - using contentEditable instead

interface RichTextEditorProps {
  content: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  editable?: boolean;
  className?: string;
  minHeight?: number;
}

// Configure Turndown to convert HTML to Markdown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Configure marked to convert Markdown to HTML
marked.setOptions({
  breaks: true,
  gfm: true,
});

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  onSave,
  editable = true,
  className = '',
  minHeight = 500,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [markdownContent, setMarkdownContent] = useState(content);
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<{ range: Range | null }>({ range: null });
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);

  // Convert markdown to HTML when content changes (only when not editing)
  useEffect(() => {
    // Only update if not editing and not currently updating from user input
    // Never update the editor's HTML while user is actively editing
    if (!isEditing && !isUpdatingRef.current && content && content !== markdownContent) {
      setMarkdownContent(content);
      try {
        const html = marked.parse(content);
        setHtmlContent(html as string);
      } catch (error) {
        console.error('Error converting markdown to HTML:', error);
        setHtmlContent(content);
      }
    }
  }, [content, markdownContent, isEditing]);
  
  // Prevent React from updating editor HTML during editing
  // This ensures cursor position is preserved during typing
  useEffect(() => {
    // Only sync HTML when NOT editing - let contentEditable handle itself during editing
    if (!isEditing && editorRef.current && htmlContent) {
      // Only update if HTML actually differs to avoid unnecessary DOM updates
      if (editorRef.current.innerHTML !== htmlContent) {
        isUpdatingRef.current = true;
        editorRef.current.innerHTML = htmlContent;
        isUpdatingRef.current = false;
      }
    }
  }, [htmlContent, isEditing]);

  // Convert markdown to HTML when entering edit mode
  useEffect(() => {
    if (isEditing && editorRef.current) {
      // Only set initial HTML when first entering edit mode
      // After that, let the user's input control the content
      const contentToConvert = markdownContent || content || '';
      
      if (contentToConvert.trim()) {
        try {
          // Convert markdown to HTML
          const html = marked.parse(contentToConvert);
          
          // Set the content in the editor and focus it (only once when entering edit mode)
          if (editorRef.current.innerHTML !== html) {
            isUpdatingRef.current = true;
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.innerHTML = html as string;
                // Focus the editor
                editorRef.current.focus();
                
                // Move cursor to end only on initial load
                const range = document.createRange();
                const selection = window.getSelection();
                if (selection && editorRef.current.childNodes.length > 0) {
                  range.selectNodeContents(editorRef.current);
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
                isUpdatingRef.current = false;
              }
            }, 10);
          } else {
            // Content already set, just ensure focus
            editorRef.current.focus();
          }
        } catch (error) {
          console.error('Error converting markdown to HTML:', error);
          // Fallback: use markdown as plain text
          if (editorRef.current) {
            isUpdatingRef.current = true;
            editorRef.current.innerHTML = contentToConvert;
            editorRef.current.focus();
            isUpdatingRef.current = false;
          }
        }
      } else {
        // Empty editor - just focus it
        if (editorRef.current.innerHTML !== '') {
          isUpdatingRef.current = true;
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.innerHTML = '';
              editorRef.current.focus();
              isUpdatingRef.current = false;
            }
          }, 10);
        } else {
          editorRef.current.focus();
        }
      }
    } else if (!isEditing && editorRef.current) {
      // Clear selection when exiting edit mode
      selectionRef.current.range = null;
    }
    // Only run when isEditing changes, not when content changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // Save cursor position using Range object for better reliability
  const saveCursorPosition = useCallback(() => {
    if (!editorRef.current) return null;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    
    // Check if selection is within editor
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      return null;
    }
    
    // Clone the range to preserve it
    return range.cloneRange();
  }, []);

  // Restore cursor position using Range object
  const restoreCursorPosition = useCallback((savedRange: Range | null) => {
    if (!editorRef.current || !savedRange) return;
    
    const selection = window.getSelection();
    if (!selection) return;
    
    try {
      // Try to restore the saved range directly
      const range = savedRange.cloneRange();
      
      // Check if the range is still valid
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
    } catch (error) {
      // Range is invalid, try to restore by position
      console.debug('Range invalid, attempting position-based restore');
      
      try {
        // Calculate position from saved range
        const preCaretRange = savedRange.cloneRange();
        preCaretRange.selectNodeContents(editorRef.current);
        preCaretRange.setEnd(savedRange.endContainer, savedRange.endOffset);
        const position = preCaretRange.toString().length;
        
        // Restore by walking the DOM
        const range = document.createRange();
        let currentPos = 0;
        let found = false;
        
        const walk = (node: Node) => {
          if (found) return;
          
          if (node.nodeType === Node.TEXT_NODE) {
            const textLength = node.textContent?.length || 0;
            if (currentPos + textLength >= position) {
              range.setStart(node, Math.min(position - currentPos, textLength));
              range.collapse(true);
              found = true;
              return;
            }
            currentPos += textLength;
          } else {
            for (let i = 0; i < node.childNodes.length; i++) {
              walk(node.childNodes[i]);
              if (found) return;
            }
          }
        };
        
        walk(editorRef.current);
        
        if (found) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch (restoreError) {
        console.error('Error restoring cursor position:', restoreError);
      }
    }
  }, []);

  // Debounced update function to prevent re-renders while typing
  const handleEditorChange = useCallback(() => {
    if (!editorRef.current || isUpdatingRef.current) return;
    
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Debounce the update - during typing, we don't modify the DOM
    // so cursor position should be preserved naturally
    updateTimeoutRef.current = setTimeout(() => {
      if (!editorRef.current || isUpdatingRef.current) return;
      
      const html = editorRef.current.innerHTML;
      try {
        // Convert HTML to markdown
        const markdown = turndownService.turndown(html);
        
        // Only update if content actually changed
        if (markdown !== markdownContent) {
          isUpdatingRef.current = true;
          setMarkdownContent(markdown);
          if (onChange) {
            onChange(markdown);
          }
          
          // Don't restore cursor here since we didn't modify the DOM
          // The cursor should remain where the user placed it
          isUpdatingRef.current = false;
        }
      } catch (error) {
        console.error('Error converting HTML to markdown:', error);
        isUpdatingRef.current = false;
      }
    }, 300); // Reduced debounce for more responsive updates
  }, [onChange, markdownContent]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Allow all keys except those that might interfere
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  '); // Insert 2 spaces instead
    }
  }, []);

  // Save selection before toolbar interaction
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current) {
      const anchorNode = selection.anchorNode;
      // Check if selection is within the editor
      if (anchorNode && (editorRef.current.contains(anchorNode) || editorRef.current === anchorNode)) {
        // Clone the range to avoid it becoming invalid
        selectionRef.current.range = selection.getRangeAt(0).cloneRange();
      }
    }
  }, []);

  // Restore selection
  const restoreSelection = useCallback(() => {
    if (selectionRef.current.range && editorRef.current) {
      try {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(selectionRef.current.range);
        }
      } catch (error) {
        // Range might be invalid, try to restore cursor at end
        if (editorRef.current) {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
    }
  }, []);

  // Execute command for formatting
  const executeCommand = useCallback((command: string, value?: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!editorRef.current) return;
    
    // Save current cursor position
    const cursorPos = saveCursorPosition();
    
    // Save current selection before losing focus
    saveSelection();
    
    // Ensure editor is focused
    editorRef.current.focus();
    
    // Restore selection
    restoreSelection();
    
    // Handle special commands
    if (command === 'createLink') {
      const url = prompt('Enter URL:', value || 'https://');
      if (url) {
        // Restore selection again before creating link
        restoreSelection();
        document.execCommand(command, false, url);
      }
    } else if (command === 'formatBlock') {
      // For formatBlock, we need to handle it differently
      if (value) {
        document.execCommand(command, false, value);
      }
    } else {
      // Execute the command
      document.execCommand(command, false, value);
    }
    
    // Trigger immediate update for formatting changes
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    const html = editorRef.current.innerHTML;
    try {
      const markdown = turndownService.turndown(html);
      isUpdatingRef.current = true;
      setMarkdownContent(markdown);
      if (onChange) {
        onChange(markdown);
      }
      
      // Restore cursor after update
      requestAnimationFrame(() => {
        if (cursorPos !== null) {
          restoreCursorPosition(cursorPos);
        }
        isUpdatingRef.current = false;
      });
    } catch (error) {
      console.error('Error converting HTML to markdown:', error);
      isUpdatingRef.current = false;
    }
    
    // Keep focus on editor
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 0);
  }, [onChange, saveSelection, restoreSelection, saveCursorPosition, restoreCursorPosition]);

  const handleSave = () => {
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Get final content
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      try {
        const markdown = turndownService.turndown(html);
        setMarkdownContent(markdown);
        if (onSave) {
          onSave(markdown);
        }
      } catch (error) {
        console.error('Error converting HTML to markdown:', error);
        if (onSave) {
          onSave(markdownContent);
        }
      }
    } else if (onSave) {
      onSave(markdownContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Reset to original content
    setMarkdownContent(content);
    try {
      const html = marked.parse(content);
      setHtmlContent(html as string);
    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
    }
    setIsEditing(false);
  };

  // Toolbar buttons configuration
  const toolbarButtons = [
    {
      key: 'bold',
      icon: <BoldOutlined />,
      tooltip: 'Bold',
      command: 'bold',
    },
    {
      key: 'italic',
      icon: <ItalicOutlined />,
      tooltip: 'Italic',
      command: 'italic',
    },
    {
      key: 'underline',
      icon: <UnderlineOutlined />,
      tooltip: 'Underline',
      command: 'underline',
    },
    {
      key: 'strikethrough',
      icon: <StrikethroughOutlined />,
      tooltip: 'Strikethrough',
      command: 'strikeThrough',
    },
    {
      key: 'ul',
      icon: <UnorderedListOutlined />,
      tooltip: 'Bullet List',
      command: 'insertUnorderedList',
    },
    {
      key: 'ol',
      icon: <OrderedListOutlined />,
      tooltip: 'Numbered List',
      command: 'insertOrderedList',
    },
    {
      key: 'link',
      icon: <LinkOutlined />,
      tooltip: 'Insert Link',
      command: 'createLink',
      value: 'https://',
    },
  ];

  if (!editable) {
    return (
      <div className={className}>
        <MarkdownRenderer content={content} />
      </div>
    );
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 rounded-t-lg flex items-center justify-end">
        <Space>
          {isEditing ? (
            <>
              <Tooltip title="Save Changes">
                <Button
                  type="primary"
                  size="small"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save
                </Button>
              </Tooltip>
              <Tooltip title="Cancel">
                <Button
                  size="small"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Edit Report">
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>

      {/* Editor/Viewer */}
      {isEditing ? (
        <div 
          className="border border-gray-200 rounded-b-lg bg-white rich-text-editor-wrapper"
          style={{ minHeight: `${minHeight}px` }}
        >
          {/* Toolbar */}
          <div className="border-b border-gray-200 bg-gray-50 p-2 flex items-center gap-1 flex-wrap">
            {toolbarButtons.map((btn) => (
              <Tooltip key={btn.key} title={btn.tooltip}>
                <Button
                  type="text"
                  size="small"
                  icon={btn.icon}
                  onMouseDown={(e) => {
                    // Save selection before button click
                    saveSelection();
                    e.preventDefault();
                    // Small delay to ensure selection is saved
                    setTimeout(() => {
                      executeCommand(btn.command, btn.value, e);
                    }, 0);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="hover:bg-gray-200"
                />
              </Tooltip>
            ))}
            <div className="flex-1" />
            <select
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
              onMouseDown={(e) => {
                // Keep editor focused when clicking dropdown
                if (editorRef.current) {
                  editorRef.current.focus();
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  executeCommand('formatBlock', value);
                }
                e.target.value = ''; // Reset dropdown
              }}
              defaultValue=""
            >
              <option value="">Normal</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="blockquote">Quote</option>
            </select>
          </div>
          
          {/* ContentEditable Editor */}
          <div
            ref={editorRef}
            contentEditable={true}
            onInput={(e) => {
              // Handle input immediately without preventing default
              // This preserves natural cursor behavior
              handleEditorChange();
            }}
            onKeyDown={(e) => {
              handleKeyDown(e);
              // Save selection on key events to help preserve cursor position
              if (e.key === 'Backspace' || e.key === 'Delete') {
                // Immediately save selection before deletion
                setTimeout(() => saveSelection(), 0);
              }
            }}
            onMouseUp={saveSelection}
            onClick={(e) => {
              e.stopPropagation();
              saveSelection();
              if (editorRef.current) {
                editorRef.current.focus();
              }
            }}
            onKeyUp={(e) => {
              // Save selection after key up to capture final cursor position
              saveSelection();
            }}
            onPaste={(e) => {
              // Handle paste events
              e.preventDefault();
              e.stopPropagation();
              const text = e.clipboardData.getData('text/plain');
              if (text) {
                document.execCommand('insertText', false, text);
              } else {
                // Try to paste HTML if available
                const html = e.clipboardData.getData('text/html');
                if (html) {
                  document.execCommand('insertHTML', false, html);
                }
              }
              handleEditorChange();
            }}
            className="rich-text-editor-content p-6 outline-none"
            style={{
              minHeight: `${minHeight - 100}px`,
              fontSize: '14px',
              lineHeight: '1.8',
              color: '#333',
              cursor: 'text',
            }}
            suppressContentEditableWarning={true}
            tabIndex={0}
            role="textbox"
            aria-multiline="true"
          />
        </div>
      ) : (
        <div 
          className="border border-gray-200 rounded-b-lg p-6 bg-white"
          style={{ minHeight: `${minHeight}px` }}
        >
          <MarkdownRenderer content={markdownContent} />
        </div>
      )}

      {/* Custom styles for contentEditable editor - Google Docs style */}
      <style jsx global>{`
        .rich-text-editor-wrapper {
          overflow: visible;
          position: relative;
        }
        
        .rich-text-editor-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          min-height: 500px;
          -webkit-user-select: text;
          user-select: text;
          cursor: text;
          position: relative;
          z-index: 1;
        }
        
        .rich-text-editor-content:focus {
          outline: none;
        }
        
        .rich-text-editor-content * {
          max-width: 100%;
        }
        
        .rich-text-editor-content[contenteditable="true"]:empty:before {
          content: 'Start editing your report...';
          color: #999;
          font-style: normal;
          pointer-events: none;
        }
        
        /* Google Docs-like styling */
        .rich-text-editor-content h1 {
          font-size: 24px;
          font-weight: 400;
          line-height: 1.3333;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        
        .rich-text-editor-content h2 {
          font-size: 20px;
          font-weight: 400;
          line-height: 1.4;
          margin-top: 18px;
          margin-bottom: 10px;
        }
        
        .rich-text-editor-content h3 {
          font-size: 16px;
          font-weight: 500;
          line-height: 1.5;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        
        .rich-text-editor-content p {
          margin-bottom: 12px;
        }
        
        .rich-text-editor-content ul,
        .rich-text-editor-content ol {
          padding-left: 30px;
          margin-bottom: 12px;
        }
        
        .rich-text-editor-content li {
          margin-bottom: 4px;
        }
        
        .rich-text-editor-content blockquote {
          border-left: 4px solid #ddd;
          padding-left: 16px;
          margin-left: 0;
          margin-right: 0;
          color: #666;
          font-style: italic;
        }
        
        .rich-text-editor-content a {
          color: #1890ff;
          text-decoration: underline;
        }
        
        .rich-text-editor-content code {
          background: #f5f5f5;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;