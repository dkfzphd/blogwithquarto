/**
 * app.js
 * Global JavaScript helper for the HTML/CSS/JS Portfolio & Blog.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  initActiveNavLink();
});

/* ==========================================
   1. THEME MANAGEMENT (LIGHT/DARK MODE)
   ========================================== */

function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;

  // Check stored theme or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const defaultTheme = savedTheme || (systemPrefersLight ? 'light' : 'dark');

  // Set initial theme attribute
  document.documentElement.setAttribute('data-theme', defaultTheme);

  // Toggle theme on button click
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

/* ==========================================
   2. MOBILE NAVIGATION MENU
   ========================================== */

function initMobileMenu() {
  const menuToggleBtn = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (!menuToggleBtn || !navLinks) return;

  menuToggleBtn.addEventListener('click', () => {
    menuToggleBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggleBtn.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });
}

/* ==========================================
   3. SET ACTIVE NAV LINK INDICATION
   ========================================== */

function initActiveNavLink() {
  const navLinks = document.querySelectorAll('.nav-links a');
  const currentPath = window.location.pathname;

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    // Simple check if path matches href, accounting for index.html as root
    if (currentPath.endsWith(href) || (href === 'index.html' && (currentPath.endsWith('/') || currentPath === ''))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* ==========================================
   4. DATA FETCH & UTILITIES
   ========================================== */

// Shared function to fetch all indexed blog posts
async function fetchPosts() {
  try {
    // Append a timestamp to prevent the browser from caching the JSON index file
    const response = await fetch('posts.json?t=' + new Date().getTime());
    if (!response.ok) {
      throw new Error('Failed to load posts index');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching blog index:', error);
    return [];
  }
}

// Calculate reading time based on character count
function calculateReadingTime(text) {
  const wordsPerMinute = 200; // Average reading speed for Chinese/English mixed content
  const textLength = text.trim().length;
  if (textLength === 0) return 1;
  
  const minutes = Math.ceil(textLength / wordsPerMinute);
  return minutes || 1;
}

// Format date string to display format
function formatDate(dateString) {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    return dateString;
  }
}

// Parse YAML frontmatter client-side from raw markdown string
function parseMarkdownFile(fileContent) {
  const parts = fileContent.split(/^---$/m);
  
  if (parts.length < 3) {
    return {
      metadata: {},
      body: fileContent
    };
  }
  
  const yamlText = parts[1];
  const bodyText = parts.slice(2).join('---');
  
  const metadata = {};
  const lines = yamlText.split('\n');
  let currentKey = null;
  
  lines.forEach(line => {
    if (!line.strip) {
      line = line.trim();
    }
    if (!line) return;
    
    // Key-value matcher
    const match = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (match) {
      const key = match[1];
      let val = match[2].trim();
      
      // Clean quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      
      if (key === 'categories') {
        if (val.startsWith('[') && val.endsWith(']')) {
          metadata[key] = val.slice(1, -1).split(',').map(c => c.trim().replace(/['"]/g, '')).filter(c => c);
        } else {
          metadata[key] = [];
        }
        currentKey = key;
      } else {
        metadata[key] = val;
        currentKey = key;
      }
    } else {
      // List items under categories
      if (currentKey === 'categories' && line.startsWith('-')) {
        const item = line.slice(1).trim().replace(/['"]/g, '');
        if (item) {
          if (!metadata['categories']) metadata['categories'] = [];
          metadata['categories'].push(item);
        }
      } else if (currentKey === 'description') {
        let val = line.trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        metadata['description'] = ((metadata['description'] || '') + ' ' + val).trim();
      }
    }
  });
  
  return {
    metadata,
    body: bodyText
  };
}
