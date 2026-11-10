import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  ArrowLeft,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  ImageIcon,
  Undo,
  Redo,
  Upload,
  X,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchArticleById,
  createArticle,
  updateArticle,
  uploadArticleImage
} from '../../services/articles';
import { emitAppToast } from '../../services/supabase';
import { ARTICLE_CATEGORIES, Article, ArticleCategory } from '../../types/articles';

interface ArticleEditorScreenProps {
  onBack?: () => void;
  showToast?: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

export const ArticleEditorScreen: React.FC<ArticleEditorScreenProps> = ({
  onBack,
  showToast = (msg, type) => emitAppToast(msg, type || 'info')
}) => {
  const navigate = useNavigate();
  const { id: routeArticleId } = useParams<{ id?: string }>();
  const { currentUser } = useAuth();

  const [articleId, setArticleId] = useState<string | null>(routeArticleId || null);
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('General');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  // Loading and Autosave state
  const [isLoadingArticle, setIsLoadingArticle] = useState(Boolean(routeArticleId));
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingEditorImage, setIsUploadingEditorImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // References to keep latest state for autosave
  const stateRef = useRef({
    articleId,
    title,
    coverUrl,
    category,
    tagsInput,
    status,
    publishedAt
  });

  useEffect(() => {
    stateRef.current = {
      articleId,
      title,
      coverUrl,
      category,
      tagsInput,
      status,
      publishedAt
    };
  }, [articleId, title, coverUrl, category, tagsInput, status, publishedAt]);

  // Setup Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3]
        }
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: false
      }),
      Placeholder.configure({
        placeholder: 'Write your story here... Share thoughts, study notes, or campus events.'
      })
    ],
    content: '',
    onUpdate: () => {
      triggerAutosave();
    }
  });

  // Calculate word count
  const wordCount = editor ? editor.getText().trim().split(/\s+/).filter(Boolean).length : 0;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Perform save (create or update)
  const performSave = useCallback(
    async (overrideStatus?: 'draft' | 'published', overridePublishedAt?: string | null): Promise<Article | null> => {
      if (!currentUser) return null;

      const current = stateRef.current;
      const targetStatus = overrideStatus || current.status;
      const targetPublishedAt = overridePublishedAt !== undefined ? overridePublishedAt : current.publishedAt;

      const rawText = editor ? editor.getText().trim() : '';
      const excerpt = rawText.slice(0, 160).trim();
      const currentWords = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
      const currentReadMinutes = Math.max(1, Math.ceil(currentWords / 200));
      const parsedTags = current.tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const jsonContent = editor ? editor.getJSON() : {};

      setSaveState('saving');

      try {
        if (current.articleId) {
          const updated = await updateArticle(current.articleId, currentUser.id, {
            title: current.title,
            cover_url: current.coverUrl,
            content: jsonContent,
            excerpt,
            category: current.category,
            tags: parsedTags,
            status: targetStatus,
            read_minutes: currentReadMinutes,
            published_at: targetPublishedAt
          });
          setSaveState('saved');
          return updated;
        } else {
          // First autosave creates the row
          const created = await createArticle({
            author_id: currentUser.id,
            title: current.title,
            cover_url: current.coverUrl,
            content: jsonContent,
            excerpt,
            category: current.category,
            tags: parsedTags,
            status: targetStatus,
            read_minutes: currentReadMinutes,
            published_at: targetPublishedAt
          });
          setArticleId(created.id);
          window.history.replaceState(null, '', `/write/${created.id}`);
          setSaveState('saved');
          return created;
        }
      } catch (err) {
        console.warn('[Autosave Notice]:', err);
        setSaveState('error');
        return null;
      }
    },
    [currentUser, editor]
  );

  // Trigger 2-second debounced autosave
  const triggerAutosave = useCallback(() => {
    if (!currentUser) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      performSave();
    }, 2000);
  }, [currentUser, performSave]);

  // Load article if editing existing ID
  useEffect(() => {
    let isMounted = true;
    if (!routeArticleId || !currentUser) {
      setIsLoadingArticle(false);
      return;
    }

    setIsLoadingArticle(true);
    fetchArticleById(routeArticleId, currentUser.id)
      .then((art) => {
        if (!isMounted) return;
        if (art) {
          setTitle(art.title || '');
          setCoverUrl(art.cover_url || null);
          setCategory(art.category || 'General');
          setTagsInput((art.tags || []).join(', '));
          setStatus(art.status);
          setPublishedAt(art.published_at);
          setArticleId(art.id);

          if (editor && art.content) {
            editor.commands.setContent(art.content);
          }
        } else {
          showToast('Article not found. Creating a new draft.', 'info');
        }
      })
      .catch((err) => {
        console.warn('Load article error:', err);
        showToast('Unable to load article draft.', 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoadingArticle(false);
      });

    return () => {
      isMounted = false;
    };
  }, [routeArticleId, currentUser, editor, showToast]);

  // Sync editor content once editor is ready if editing
  useEffect(() => {
    if (editor && routeArticleId && currentUser && !editor.isDestroyed) {
      fetchArticleById(routeArticleId, currentUser.id).then((art) => {
        if (art && art.content && editor.isEmpty) {
          editor.commands.setContent(art.content);
        }
      });
    }
  }, [editor, routeArticleId, currentUser]);

  // Cleanup autosave on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  // Handle Cover Image Upload
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    try {
      setIsUploadingCover(true);
      const url = await uploadArticleImage(currentUser.id, file);
      setCoverUrl(url);
      showToast('Cover image uploaded!', 'success');
      triggerAutosave();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload cover image. Please try again.', 'error');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Handle Editor Image Upload
  const handleEditorImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !editor) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    try {
      setIsUploadingEditorImage(true);
      const url = await uploadArticleImage(currentUser.id, file);
      editor.chain().focus().setImage({ src: url }).run();
      showToast('Image inserted!', 'success');
      triggerAutosave();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload image. Please try again.', 'error');
    } finally {
      setIsUploadingEditorImage(false);
      if (editorImageInputRef.current) {
        editorImageInputRef.current.value = '';
      }
    }
  };

  // Handle Publish / Update
  const handlePublish = async () => {
    if (!currentUser) {
      showToast('Please sign in to publish articles.', 'error');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showToast('Please enter a title for your article.', 'error');
      return;
    }

    // Publish requires a title and at least 50 words of body text
    if (wordCount < 50) {
      showToast('Add a little more to your article before publishing.', 'info');
      return;
    }

    setIsPublishing(true);

    try {
      const nowIso = new Date().toISOString();
      const updated = await performSave('published', publishedAt || nowIso);
      if (updated) {
        setStatus('published');
        setPublishedAt(updated.published_at || nowIso);
        showToast(
          status === 'published' ? 'Article updated successfully!' : 'Your article is now published on Campus Foundry!',
          'success'
        );
      }
    } catch (err: any) {
      showToast('Unable to publish article right now. Please try again.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Unpublish
  const handleUnpublish = async () => {
    if (!currentUser) return;
    setIsPublishing(true);
    try {
      const updated = await performSave('draft', null);
      if (updated) {
        setStatus('draft');
        setPublishedAt(null);
        showToast('Article moved back to drafts.', 'info');
      }
    } catch {
      showToast('Unable to unpublish article. Please try again.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (isLoadingArticle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-neutral-950 text-white">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-xs text-neutral-400">Loading your draft...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans relative pb-20">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverSelect}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={editorImageInputRef}
        onChange={handleEditorImageSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-orange-400" />
          </button>

          {/* Autosave Status Badge */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveState === 'saving' && (
              <span className="flex items-center gap-1 text-orange-400 font-medium animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Saving…</span>
              </span>
            )}
            {saveState === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>Saved</span>
              </span>
            )}
            {saveState === 'error' && (
              <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                <AlertCircle className="w-3 h-3" />
                <span>Saved locally</span>
              </span>
            )}
            {saveState === 'idle' && (
              <span className="text-neutral-500 text-[11px]">
                {status === 'published' ? 'Published' : 'Draft'}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Unpublish option */}
          {status === 'published' && (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isPublishing}
              className="text-xs px-2.5 py-1 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              Unpublish
            </button>
          )}

          {/* My Articles quick link */}
          <button
            type="button"
            onClick={() => navigate('/my-articles')}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden xs:inline">My Articles</span>
          </button>

          {/* Publish / Update Button */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isPublishing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{status === 'published' ? 'Update' : 'Publish'}</span>
          </button>
        </div>
      </header>

      {/* Editor Main Canvas */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* Cover Image Picker */}
        <div className="relative group rounded-2xl overflow-hidden bg-neutral-900/60 border border-neutral-800/80">
          {coverUrl ? (
            <div className="relative h-48 sm:h-64 w-full">
              <img
                src={coverUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900/90 text-white text-xs font-bold border border-neutral-700 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Change Cover
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCoverUrl(null);
                    triggerAutosave();
                  }}
                  className="p-1.5 rounded-xl bg-rose-500/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                  title="Remove Cover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
              className="w-full py-8 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-orange-400 border-2 border-dashed border-neutral-800 hover:border-orange-500/50 rounded-2xl transition-all cursor-pointer bg-neutral-900/30"
            >
              {isUploadingCover ? (
                <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
              <span className="text-xs font-semibold">
                {isUploadingCover ? 'Uploading cover...' : '+ Add Cover Image'}
              </span>
            </button>
          )}
        </div>

        {/* Title Input */}
        <textarea
          rows={1}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            triggerAutosave();
          }}
          placeholder="Title"
          className="w-full text-2xl sm:text-3xl font-black bg-transparent text-white placeholder-neutral-600 outline-none resize-none border-b border-neutral-800/60 pb-2 focus:border-orange-500/80 transition-colors leading-tight"
          onInput={(e) => {
            // Auto expand height
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
        />

        {/* Metadata Controls (Category, Tags, Word Count) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/60 text-xs">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Category:</span>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                triggerAutosave();
              }}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-2.5 py-1 outline-none focus:border-orange-500 transition-colors"
            >
              {ARTICLE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Input */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Tags:</span>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => {
                setTagsInput(e.target.value);
                triggerAutosave();
              }}
              placeholder="comma-separated tags..."
              className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-2.5 py-1 outline-none focus:border-orange-500 placeholder-neutral-500 transition-colors"
            />
          </div>

          {/* Word count & Reading time indicator */}
          <div className="flex items-center gap-3 text-neutral-400 self-end sm:self-auto font-mono text-[11px]">
            <span>{wordCount} words</span>
            <span className="flex items-center gap-1 text-orange-400">
              <Clock className="w-3 h-3" />
              <span>{readMinutes} min read</span>
            </span>
          </div>
        </div>

        {/* Tiptap Rich Text Content Area */}
        <div className="flex-1 min-h-[350px] relative text-neutral-100 text-sm leading-relaxed pb-16">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Sticky Formatting Toolbar above Keyboard */}
      {editor && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 px-3 py-2 flex items-center justify-between max-w-3xl mx-auto shadow-2xl">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {/* Bold */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                editor.isActive('bold')
                  ? 'bg-orange-500 text-neutral-950 font-bold'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                editor.isActive('italic')
                  ? 'bg-orange-500 text-neutral-950 font-bold'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>

            {/* Heading 2 */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                editor.isActive('heading', { level: 2 })
                  ? 'bg-orange-500 text-neutral-950 font-bold'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>

            {/* Heading 3 */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                editor.isActive('heading', { level: 3 })
                  ? 'bg-orange-500 text-neutral-950 font-bold'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            {/* Quote */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                editor.isActive('blockquote')
                  ? 'bg-orange-500 text-neutral-950 font-bold'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>

            {/* Bullet List */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                editor.isActive('bulletList')
                  ? 'bg-orange-500 text-neutral-950 font-bold'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
              title="Bullet list"
            >
              <List className="w-4 h-4" />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                editor.isActive('orderedList')
                  ? 'bg-orange-500 text-neutral-950 font-bold'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
              title="Numbered list"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            {/* Insert Image */}
            <button
              type="button"
              onClick={() => editorImageInputRef.current?.click()}
              disabled={isUploadingEditorImage}
              className="p-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              title="Insert Image"
            >
              {isUploadingEditorImage ? (
                <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
              ) : (
                <ImageIcon className="w-4 h-4 text-orange-400" />
              )}
            </button>

            {/* Divider */}
            <div className="w-[1px] h-5 bg-neutral-800 mx-1 shrink-0" />

            {/* Undo */}
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>

            {/* Redo */}
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded-lg text-neutral-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
