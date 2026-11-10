export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: string;
  author_id: string;
  title: string;
  cover_url: string | null;
  content: any; // Tiptap JSON document
  excerpt: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
  read_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleAuthor {
  id: string;
  name: string;
  avatarUrl: string;
  username?: string;
  department?: string;
  university?: string;
  isVerified?: boolean;
}

export interface ArticleComment {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  author_username?: string;
}

export interface ArticleWithAuthor extends Article {
  author?: ArticleAuthor;
  likes_count: number;
  views_count: number;
  comments_count: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export const ARTICLE_CATEGORIES = [
  'General',
  'Academics & Study',
  'Student Life',
  'Campus News',
  'Tech & Innovation',
  'Career & Hustle',
  'Creative & Opinion',
  'Sports & Health'
] as const;

export type ArticleCategory = typeof ARTICLE_CATEGORIES[number];
