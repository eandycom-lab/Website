// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
site: 'https://sysai.sh',
integrations: [mdx(), sitemap()],
fonts: [
{
provider: fontProviders.google(),
name: 'Atkinson Hyperlegible',
cssVariable: '--font-atkinson',
weights: ['400', '700'],
},
],
});
