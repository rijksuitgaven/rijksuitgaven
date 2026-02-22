'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import {
  Bold, Italic, List, ListOrdered,
  Link as LinkIcon, Unlink, ImageIcon, User, Undo2, Redo2, Loader2, Trash2,
  Upload, Images, X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface UploadedImage {
  id?: string | null
  url: string
  thumbnailUrl?: string
  filename: string
  originalName?: string
  width?: number
  height?: number
  sizeBytes?: number
}

export interface MediaItem {
  id: string
  url: string
  thumbnailUrl: string
  filename: string
  originalName: string
  width: number | null
  height: number | null
  sizeBytes: number
  altText: string
  createdAt: string
}

interface EmailEditorProps {
  value: string
  onChange: (html: string) => void
  uploadedImages: UploadedImage[]
  onImageUploaded: (img: UploadedImage) => void
  onImageDeleted: (filename: string) => void
  mediaLibrary?: MediaItem[]
  onInsertMedia?: (item: MediaItem) => void
}

export function EmailEditor({
  value,
  onChange,
  uploadedImages,
  onImageUploaded,
  onImageDeleted,
  mediaLibrary = [],
  onInsertMedia,
}: EmailEditorProps) {
  const [uploading, setUploading] = useState(false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // No headings in email body — heading is a separate field
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: {
          style: 'color: #436FA3; text-decoration: none;',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2.5',
        style: 'font-size: 14px; line-height: 22px; color: var(--navy-dark);',
      },
    },
  })

  // Close picker on outside click
  useEffect(() => {
    if (!showMediaPicker) return
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowMediaPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMediaPicker])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    // Reset input so the same file can be re-selected
    e.target.value = ''

    setUploading(true)
    setShowMediaPicker(false)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/v1/team/mail/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Upload mislukt')
        return
      }

      // Insert image into editor
      editor.chain().focus().setImage({ src: data.url }).run()

      // Track uploaded image for management
      onImageUploaded({
        id: data.id,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        filename: data.filename,
        originalName: data.originalName,
        width: data.width,
        height: data.height,
        sizeBytes: data.sizeBytes,
      })
    } catch {
      alert('Upload mislukt — controleer uw verbinding')
    } finally {
      setUploading(false)
    }
  }, [editor, onImageUploaded])

  const handleInsertMedia = useCallback((item: MediaItem) => {
    if (!editor) return
    editor.chain().focus().setImage({ src: item.url }).run()
    setShowMediaPicker(false)
    onInsertMedia?.(item)
  }, [editor, onInsertMedia])

  const handleDeleteImage = useCallback(async (filename: string) => {
    try {
      const res = await fetch(`/api/v1/team/mail/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        onImageDeleted(filename)
      }
    } catch {
      // Silent — image stays in list
    }
  }, [onImageDeleted])

  const addLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Link URL:', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const insertFirstName = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertContent('{{voornaam}}').run()
  }, [editor])

  if (!editor) return null

  return (
    <div>
      <div className="rounded-lg border border-[var(--border)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--pink)] focus-within:border-transparent">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[var(--gray-light)] border-b border-[var(--border)]">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Vetgedrukt"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Cursief"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Opsomming"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Genummerde lijst"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            onClick={addLink}
            active={editor.isActive('link')}
            title="Link toevoegen"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
            active={false}
            disabled={!editor.isActive('link')}
            title="Link verwijderen"
          >
            <Unlink className="w-4 h-4" />
          </ToolbarButton>

          {/* Image button — opens media picker */}
          <div className="relative" ref={pickerRef}>
            <ToolbarButton
              onClick={() => setShowMediaPicker(!showMediaPicker)}
              active={showMediaPicker}
              disabled={uploading}
              title="Afbeelding invoegen"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            </ToolbarButton>

            {/* Media picker popover */}
            {showMediaPicker && (
              <div className="absolute left-0 top-full mt-1 z-50 w-80 bg-white rounded-lg border border-[var(--border)] shadow-lg">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
                  <span className="text-xs font-semibold text-[var(--navy-dark)]">Afbeelding invoegen</span>
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(false)}
                    className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Upload new */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[var(--navy-dark)] hover:bg-[var(--gray-light)] transition-colors border-b border-[var(--border)]"
                >
                  <Upload className="w-4 h-4 text-[var(--pink)]" />
                  Nieuwe afbeelding uploaden
                  <span className="text-xs text-[var(--navy-medium)] ml-auto">max 2MB</span>
                </button>

                {/* Recent media grid */}
                {mediaLibrary.length > 0 ? (
                  <div className="p-2">
                    <div className="flex items-center gap-1 px-1 mb-2">
                      <Images className="w-3 h-3 text-[var(--navy-medium)]" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--navy-medium)]">
                        Mediabibliotheek
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                      {mediaLibrary.slice(0, 20).map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleInsertMedia(item)}
                          className="relative aspect-square rounded border border-[var(--border)] overflow-hidden hover:ring-2 hover:ring-[var(--pink)] transition-all"
                          title={item.originalName}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.thumbnailUrl}
                            alt={item.altText || item.originalName}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-4 text-center">
                    <p className="text-xs text-[var(--navy-medium)]">Nog geen afbeeldingen geüpload</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <ToolbarDivider />

          <ToolbarButton
            onClick={insertFirstName}
            active={false}
            title="Voornaam invoegen — wordt per ontvanger vervangen"
          >
            <User className="w-3.5 h-3.5" />
            <span className="text-xs ml-0.5">Voornaam</span>
          </ToolbarButton>

          <div className="flex-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            active={false}
            disabled={!editor.can().undo()}
            title="Ongedaan maken"
          >
            <Undo2 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            active={false}
            disabled={!editor.can().redo()}
            title="Opnieuw"
          >
            <Redo2 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Uploaded images strip */}
      {uploadedImages.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {uploadedImages.map(img => (
            <div
              key={img.filename}
              className="group relative w-16 h-16 rounded border border-[var(--border)] overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbnailUrl || img.url}
                alt={img.originalName || ''}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDeleteImage(img.filename)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Verwijderen"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-0.5 px-2 py-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-[var(--navy-dark)] text-white'
          : disabled
            ? 'text-[var(--navy-medium)]/40 cursor-not-allowed'
            : 'text-[var(--navy-dark)] hover:bg-white'
      }`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-[var(--border)] mx-1" />
}
