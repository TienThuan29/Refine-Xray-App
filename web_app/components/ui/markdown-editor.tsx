'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, 
  Space, 
  Divider,
  Tooltip,
  Input 
} from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  CodeOutlined,
  SaveOutlined,
  EditOutlined,
} from '@ant-design/icons';
import MarkdownRenderer from './markdown-renderer';

const { TextArea } = Input;

interface MarkdownEditorProps {
  content: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  editable?: boolean;
  className?: string;
  showToolbar?: boolean;
  minHeight?: number;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  onSave,
  editable = true,
  className = '',
  showToolbar = true,
  minHeight = 400,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const textareaRef = useRef<any>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  // Helper to get the actual textarea element from Ant Design's TextArea
  const getTextareaElement = (): HTMLTextAreaElement | null => {
    if (!textareaRef.current) return null;
    // Ant Design TextArea exposes the actual textarea through resizableTextArea.textArea
    return textareaRef.current.resizableTextArea?.textArea || 
           textareaRef.current.input || 
           textareaRef.current;
  };

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  // Store selection when textarea loses focus or on selection change
  const handleSelectionChange = () => {
    const textarea = getTextareaElement();
    if (textarea) {
      selectionRef.current = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      };
    }
  };

  // Get current selection, prioritizing stored selection (set before button click)
  const getSelection = () => {
    // Always use stored selection if available (captured before button click)
    if (selectionRef.current) {
      return selectionRef.current;
    }
    // Otherwise try to get current selection from textarea
    const textarea = getTextareaElement();
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      return { start, end };
    }
    // Fallback to end of content
    return { start: editedContent.length, end: editedContent.length };
  };

  const insertText = (before: string, after: string = '', e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const textarea = getTextareaElement();
    if (!textarea) return;

    // Get selection (stored from button mousedown, or current from textarea)
    const { start, end } = getSelection();
    const selectedText = editedContent.substring(start, end);
    const newText = before + selectedText + after;
    
    const newContent = 
      editedContent.substring(0, start) + 
      newText + 
      editedContent.substring(end);
    
    setEditedContent(newContent);
    
    // Update selection reference for cursor position after insert
    const cursorPos = start + before.length + selectedText.length;
    
    // Clear stored selection so next time we use textarea's current selection
    selectionRef.current = null;
    
    // Set cursor position after state update
    setTimeout(() => {
      const textareaEl = getTextareaElement();
      if (textareaEl) {
        textareaEl.focus();
        textareaEl.setSelectionRange(cursorPos, cursorPos);
      }
      if (onChange) {
        onChange(newContent);
      }
    }, 10);
  };

  const insertAtLineStart = (prefix: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const textarea = getTextareaElement();
    if (!textarea) return;

    // Get selection (stored from button mousedown, or current from textarea)
    const { start } = getSelection();
    const lines = editedContent.split('\n');
    let currentLine = 0;
    let charCount = 0;

    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= start) {
        currentLine = i;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }

    // Check if prefix already exists
    const line = lines[currentLine];
    if (line.startsWith(prefix)) {
      // Remove prefix if it already exists
      lines[currentLine] = line.substring(prefix.length);
      const newContent = lines.join('\n');
      setEditedContent(newContent);
      const newPos = start - prefix.length;
      
      // Clear stored selection so next time we use textarea's current selection
      selectionRef.current = null;
      
      setTimeout(() => {
        const textareaEl = getTextareaElement();
        if (textareaEl) {
          textareaEl.focus();
          textareaEl.setSelectionRange(newPos, newPos);
        }
        if (onChange) {
          onChange(newContent);
        }
      }, 10);
    } else {
      // Add prefix
      lines[currentLine] = prefix + lines[currentLine];
      const newContent = lines.join('\n');
      setEditedContent(newContent);
      const newPos = start + prefix.length;
      
      // Clear stored selection so next time we use textarea's current selection
      selectionRef.current = null;
      
      setTimeout(() => {
        const textareaEl = getTextareaElement();
        if (textareaEl) {
          textareaEl.focus();
          textareaEl.setSelectionRange(newPos, newPos);
        }
        if (onChange) {
          onChange(newContent);
        }
      }, 10);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const toolbarButtons = [
    {
      key: 'bold',
      icon: <BoldOutlined />,
      tooltip: 'Bold (Ctrl+B)',
      onClick: (e: React.MouseEvent) => insertText('**', '**', e),
    },
    {
      key: 'italic',
      icon: <ItalicOutlined />,
      tooltip: 'Italic (Ctrl+I)',
      onClick: (e: React.MouseEvent) => insertText('*', '*', e),
    },
    {
      key: 'strikethrough',
      icon: <StrikethroughOutlined />,
      tooltip: 'Strikethrough',
      onClick: (e: React.MouseEvent) => insertText('~~', '~~', e),
    },
    { key: 'divider1', type: 'divider' as const },
    {
      key: 'h1',
      icon: <span className="font-bold">H1</span>,
      tooltip: 'Heading 1',
      onClick: (e: React.MouseEvent) => insertAtLineStart('# ', e),
    },
    {
      key: 'h2',
      icon: <span className="font-bold text-sm">H2</span>,
      tooltip: 'Heading 2',
      onClick: (e: React.MouseEvent) => insertAtLineStart('## ', e),
    },
    {
      key: 'h3',
      icon: <span className="font-bold text-xs">H3</span>,
      tooltip: 'Heading 3',
      onClick: (e: React.MouseEvent) => insertAtLineStart('### ', e),
    },
    { key: 'divider2', type: 'divider' as const },
    {
      key: 'ul',
      icon: <UnorderedListOutlined />,
      tooltip: 'Unordered List',
      onClick: (e: React.MouseEvent) => insertAtLineStart('- ', e),
    },
    {
      key: 'ol',
      icon: <OrderedListOutlined />,
      tooltip: 'Ordered List',
      onClick: (e: React.MouseEvent) => insertAtLineStart('1. ', e),
    },
    { key: 'divider3', type: 'divider' as const },
    {
      key: 'link',
      icon: <LinkOutlined />,
      tooltip: 'Insert Link',
      onClick: (e: React.MouseEvent) => insertText('[', '](url)', e),
    },
    {
      key: 'code',
      icon: <CodeOutlined />,
      tooltip: 'Code Block',
      onClick: (e: React.MouseEvent) => insertText('```\n', '\n```', e),
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
    <div className={`markdown-editor ${className}`}>
      {showToolbar && (
        <div className="border-b border-gray-200 bg-gray-50 p-2 rounded-t-lg">
          <Space size="small" wrap>
            {isEditing ? (
              <>
                {toolbarButtons.map((btn) => {
                  if (btn.type === 'divider') {
                    return <Divider key={btn.key} type="vertical" style={{ height: '20px' }} />;
                  }
                  return (
                    <Tooltip key={btn.key} title={btn.tooltip}>
                      <Button
                        type="text"
                        size="small"
                        icon={btn.icon}
                        onMouseDown={(e) => {
                          // Capture selection BEFORE button interaction causes blur
                          e.preventDefault(); // Prevent default to keep focus on textarea briefly
                          handleSelectionChange();
                          // Use setTimeout to allow selection to be captured
                          setTimeout(() => {
                            btn.onClick(e);
                          }, 0);
                        }}
                        onClick={(e) => {
                          // Prevent default click behavior
                          e.preventDefault();
                        }}
                        className="hover:bg-gray-200"
                      />
                    </Tooltip>
                  );
                })}
                <Divider type="vertical" style={{ height: '20px' }} />
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
              <>
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
              </>
            )}
          </Space>
        </div>
      )}

      {isEditing ? (
        <TextArea
          ref={textareaRef}
          value={editedContent}
          onChange={(e) => {
            setEditedContent(e.target.value);
            if (onChange) {
              onChange(e.target.value);
            }
          }}
          onSelect={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onClick={handleSelectionChange}
          style={{
            minHeight: `${minHeight}px`,
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
          className="rounded-b-lg border-t-0"
          placeholder="Edit your report content in Markdown format..."
        />
      ) : (
        <div className="border border-gray-200 rounded-b-lg p-4 bg-white min-h-[400px]">
          <MarkdownRenderer content={editedContent} />
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
