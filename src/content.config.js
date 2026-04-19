import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    permalink: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    categories: z.array(z.string()).default([])
  })
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    description: z.string().optional()
  })
});

export const collections = {
  posts,
  pages
};
