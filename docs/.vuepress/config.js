'use strict';

const { readFileSync } = require('fs');
const markdownItForInline = require('markdown-it-for-inline');
const path = require('path');

const documentsMetaData = require('../dump.json');
const generateSidebar = require('../../src/generate-sidebar.js');
const manifest = require('./public/manifest.json');

const getDocumentFromUrl = url => {
  const [, urlId] = url.match(/paper\.dropbox\.com\/doc\/.+--\S{26}-(\w{21})/) || [];

  return urlId && documentsMetaData.find(doc => doc.id === urlId) || false;
};

module.exports = {
  title: 'Playbook',
  themeConfig: {
    sidebar: generateSidebar(documentsMetaData),
  },
  extendMarkdown: markdown => {
    markdown.use(markdownItForInline, 'internal-link', 'link_open', (tokens, index) => {
      const token = tokens[index];
      const document = getDocumentFromUrl(token.attrGet('href'));

      if (document) {
        const location = path.parse(document.location);

        token.attrSet(
          'href',
          `/${path.parse(location.dir).name}/${location.name}.html`
        );
      }
    });
  },
  chainMarkdown (config) {
    config.plugin('add-metadata')
      .use(markdown => {
        markdown.core.ruler.push('add-metadata', state => {
          state.tokens.unshift({
            'type': 'html_block',
            'content': `
              <metadata
                :id="$page.frontmatter.doc_id"
                :date="$page.frontmatter.last_updated_date"
                :isHomePage="$page.frontmatter.home"
              />
            `,
          });

          return state;
        });
      })
      .before('component');
  },
  dest: './dist',
  head: [
    ['link', { rel: 'icon', href: '/icons/favicon.ico' }],
    ['link', { rel: 'manifest', href: '/manifest.json', crossorigin: 'use-credentials' }],
    ['meta', { name: 'theme-color', content: manifest.theme_color }],
  ],
  plugins: {
    '@vuepress/pwa': {
      serviceWorker: true,
      updatePopup: false,
    }
  },
  evergreen: true,
};
