'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Quote,
  Code,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface FormatAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  isActive?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite sua resposta...',
  className,
  disabled = false
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  // Função para inserir texto na posição do cursor
  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Restaurar foco e posição do cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Função para inserir texto em nova linha
  const insertLine = (text: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const beforeCursor = value.substring(0, start);
    const afterCursor = value.substring(start);
    
    // Adicionar quebra de linha se necessário
    const needsNewLine = beforeCursor.length > 0 && !beforeCursor.endsWith('\n');
    const prefix = needsNewLine ? '\n' + text : text;
    
    const newText = beforeCursor + prefix + afterCursor;
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Atualizar seleção quando o usuário seleciona texto
  const handleSelectionChange = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    setSelectionStart(textarea.selectionStart);
    setSelectionEnd(textarea.selectionEnd);
    setSelectedText(value.substring(textarea.selectionStart, textarea.selectionEnd));
  };

  const formatActions: FormatAction[] = [
    {
      icon: Bold,
      label: 'Negrito',
      action: () => insertText('**', '**')
    },
    {
      icon: Italic,
      label: 'Itálico',
      action: () => insertText('*', '*')
    },
    {
      icon: Underline,
      label: 'Sublinhado',
      action: () => insertText('<u>', '</u>')
    },
    {
      icon: Code,
      label: 'Código',
      action: () => insertText('`', '`')
    },
    {
      icon: Quote,
      label: 'Citação',
      action: () => insertLine('> ')
    },
    {
      icon: List,
      label: 'Lista',
      action: () => insertLine('- ')
    },
    {
      icon: ListOrdered,
      label: 'Lista Numerada',
      action: () => insertLine('1. ')
    },
    {
      icon: Link,
      label: 'Link',
      action: () => {
        const url = prompt('Digite a URL:');
        if (url) {
          const linkText = selectedText || 'link';
          insertText(`[${linkText}](${url})`);
        }
      }
    }
  ];

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Barra de ferramentas */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800">
        {formatActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={action.action}
              disabled={disabled}
              className="h-8 w-8 p-0"
              title={action.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
      
      {/* Área de texto */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[200px] border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        
        {/* Preview de formatação (opcional) */}
        {value && (
          <div className="absolute bottom-2 right-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Aqui poderia abrir um modal de preview
                console.log('Preview:', value);
              }}
              disabled={disabled}
              className="h-6 text-xs"
            >
              Preview
            </Button>
          </div>
        )}
      </div>
      
      {/* Dicas de formatação */}
      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 border-t">
        <div className="flex flex-wrap gap-4">
          <span>**negrito**</span>
          <span>*itálico*</span>
          <span>`código`</span>
          <span>&gt; citação</span>
          <span>- lista</span>
          <span>[link](url)</span>
        </div>
      </div>
    </div>
  );
}

export default RichTextEditor;