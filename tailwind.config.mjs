/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  corePlugins: {
    container: false,
  },
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        bg2: 'var(--bg2)',
        bg3: 'var(--bg3)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        accent: 'var(--accent)',
        accent2: 'var(--accent2)',
        gold: 'var(--gold)',
        green: 'var(--green)',
        silver: 'var(--silver)',
        copper: 'var(--copper)',
        iron: 'var(--iron)',
        mithril: 'var(--mithril)',
        adamantium: 'var(--adamantium)',
        ancient: 'var(--ancient)',
        hard: 'var(--hard)',
        text: 'var(--text)',
        text2: 'var(--text2)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
      boxShadow: {
        DEFAULT: 'var(--shadow)',
      },
      gap: {
        section: 'var(--section-gap)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
