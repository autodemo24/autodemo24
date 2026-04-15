'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 180 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-[#003580] underline' },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2',
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML() && value !== (editor.isEmpty ? '' : editor.getHTML())) {
      editor.commands.setContent(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-lg" style={{ minHeight: minHeight + 40 }} />
    );
  }

  function toolbarBtn(active: boolean, onClick: () => void, title: string, children: React.ReactNode) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`px-2 py-1 text-sm rounded border ${
          active ? 'bg-[#003580] text-white border-[#003580]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        {children}
      </button>
    );
  }

  function addLink() {
    const prev = editor!.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del link', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor!.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {toolbarBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Grassetto', <strong>B</strong>)}
        {toolbarBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Corsivo', <em>I</em>)}
        {toolbarBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Elenco puntato', '• Lista')}
        {toolbarBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Elenco numerato', '1. Lista')}
        {toolbarBtn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Titolo', 'H2')}
        {toolbarBtn(editor.isActive('link'), addLink, 'Link', 'Link')}
        {toolbarBtn(false, () => editor.chain().focus().undo().run(), 'Annulla', '↶')}
        {toolbarBtn(false, () => editor.chain().focus().redo().run(), 'Ripeti', '↷')}
      </div>
      {placeholder && editor.isEmpty && (
        <div className="absolute pointer-events-none text-gray-400 px-3 py-2 text-sm">{placeholder}</div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
