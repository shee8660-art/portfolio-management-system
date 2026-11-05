export interface Socials {
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  [key: string]: string | undefined;
}

export interface Theme {
  primary?: string;
  accent?: string;
  font?: string; // 'system' | 'serif' | 'mono'
  mode?: string; // 'light' | 'dark'
}

export interface Skill {
  id?: string;
  name: string;
  level: number;
  category?: string;
  sort_order?: number;
}

export interface GalleryItem {
  id?: string;
  title: string;
  description?: string;
  image_url: string;
  sort_order?: number;
}

export interface CustomSectionItem {
  title?: string;
  description?: string;
  quote?: string;
  author?: string;
  [key: string]: unknown;
}

export interface CustomSection {
  id?: string;
  type: string; // services | testimonials | contact | custom
  title: string;
  content: { items?: CustomSectionItem[]; text?: string; [key: string]: unknown };
  sort_order?: number;
  visible?: boolean;
}

export interface Profile {
  id: string;
  slug: string;
  name: string;
  title: string;
  bio: string;
  avatar_url: string;
  email: string;
  location: string;
  socials: Socials;
  theme: Theme;
  layout: string; // modern | minimal | bold
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  skills?: Skill[];
  gallery?: GalleryItem[];
  sections?: CustomSection[];
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
