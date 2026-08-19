// Shared type definitions for the blog

export interface PostFrontmatter {
  title: string;
  date: string; // YYYY-MM-DD
  tags?: string[];
  cover?: string;
  excerpt?: string;
}

export interface PostMeta extends PostFrontmatter {
  slug: string; // derived from filename
  content: string; // markdown body
  readingTime: number; // minutes
}

export interface SiteConfig {
  site: {
    title: string;
    subtitle: string;
    description: string;
    author: string;
    language: string;
    url: string;
  };
  theme: {
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    fontFamily: 'sans' | 'serif';
    postsPerPage: number;
    layout: 'list' | 'grid';
  };
  personalization: {
    avatar: string;
    background: string;
    backgroundOpacity: number;
    music: {
      enabled: boolean;
      src: string;
      title: string;
      autoplay: boolean;
    };
    social: {
      github: string;
      twitter: string;
      email: string;
    };
    footerText: string;
  };
  comments: {
    provider: 'giscus' | 'none';
    giscus: {
      repo: string;
      repoId: string;
      category: string;
      categoryId: string;
      mapping: 'pathname' | 'url' | 'title';
      theme: 'light' | 'dark' | 'preferred_color_scheme';
    };
  };
  deploy: {
    repository: string;
    branch: string;
    domain: string;
    useSsh: boolean;
    userName: string;
    userEmail: string;
  };
}
