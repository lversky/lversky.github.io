/* ============================================================
   LZVE.ly — site behaviour
   Theme switching, navigation, reveal animations, live GitHub data.
   ============================================================ */
(function () {
  'use strict';

  var GITHUB_USER = 'lversky';
  var API = 'https://api.github.com';
  var CACHE_KEY = 'lzve.github.cache';
  var CACHE_TTL = 15 * 60 * 1000; /* 15 minutes */

  /* ---------- Theme ---------- */
  var themeToggle = document.getElementById('theme-toggle');
  var order = ['auto', 'light', 'dark'];
  var labels = { auto: 'Theme: system (click for light)', light: 'Theme: light (click for dark)', dark: 'Theme: dark (click for system)' };

  function currentTheme() {
    return document.documentElement.dataset.theme || 'auto';
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try {
      if (theme === 'auto') localStorage.removeItem('theme');
      else localStorage.setItem('theme', theme);
    } catch (e) { /* storage unavailable */ }
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', labels[theme]);
      themeToggle.setAttribute('title', labels[theme]);
    }
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) {
      var dark = theme === 'dark' || (theme === 'auto' && !window.matchMedia('(prefers-color-scheme: light)').matches);
      meta.setAttribute('content', dark ? '#0b0710' : '#fdfaff');
    }
  }

  if (themeToggle) {
    applyTheme(currentTheme());
    themeToggle.addEventListener('click', function () {
      var next = order[(order.indexOf(currentTheme()) + 1) % order.length];
      applyTheme(next);
    });
  }

  /* Follow the OS when in auto mode */
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  var onSchemeChange = function () {
    if (currentTheme() === 'auto') applyTheme('auto');
  };
  if (mq.addEventListener) mq.addEventListener('change', onSchemeChange);
  else if (mq.addListener) mq.addListener(onSchemeChange);

  /* ---------- Header shadow ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('open')) return;
      if (!nav.contains(e.target) && !navToggle.contains(e.target)) closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) closeNav();
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (!('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry, i) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = Number(el.dataset.revealDelay || 0);
          setTimeout(function () { el.classList.add('in'); }, delay);
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      revealEls.forEach(function (el, i) {
        el.dataset.revealDelay = String(Math.min(i % 4, 3) * 70);
        io.observe(el);
      });
    }
  }

  /* ---------- Scroll spy ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a'));
  if (sections.length && navLinks.length) {
    var ticking = false;
    function updateSpy() {
      ticking = false;
      var probe = window.scrollY + window.innerHeight * 0.32;
      var current = null;
      sections.forEach(function (s) {
        if (s.offsetTop <= probe) current = s.id;
      });
      navLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    }
    function requestSpy() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateSpy);
    }
    window.addEventListener('scroll', requestSpy, { passive: true });
    window.addEventListener('resize', requestSpy);
    updateSpy();
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- GitHub data ---------- */
  var statRow = document.getElementById('stat-row');
  var repoGrid = document.getElementById('repo-grid');

  var LANG_COLORS = {
    Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26',
    CSS: '#563d7c', Java: '#b07219', C: '#555555', 'C++': '#f34b7d', Shell: '#89e051',
    'Jupyter Notebook': '#DA5B0B', Rust: '#dea584', Go: '#00ADD8', PHP: '#4F5D95'
  };

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || Date.now() - parsed.at > CACHE_TTL) return null;
      return parsed.data;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: data }));
    } catch (e) { /* ignore quota errors */ }
  }

  function setStat(name, value) {
    if (!statRow) return;
    var el = statRow.querySelector('[data-stat="' + name + '"]');
    if (el && typeof value === 'number') el.textContent = value.toLocaleString();
  }

  function renderStats(user, repos) {
    if (!user) return;
    setStat('repos', typeof user.public_repos === 'number' ? user.public_repos : null);
    setStat('followers', user.followers);
    setStat('following', user.following);

    var stars = 0;
    (repos || []).forEach(function (r) { stars += r.stargazers_count || 0; });
    setStat('stars', stars);
  }

  function repoCard(repo) {
    var card = document.createElement('article');
    card.className = 'repo-card';

    var title = document.createElement('a');
    title.className = 'repo-title';
    title.href = repo.html_url;
    title.target = '_blank';
    title.rel = 'noopener';
    title.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-repo"/></svg>';
    title.appendChild(document.createTextNode(repo.name));

    var desc = document.createElement('p');
    desc.className = 'repo-desc';
    desc.textContent = repo.description || 'No description yet.';

    var foot = document.createElement('div');
    foot.className = 'repo-foot';

    if (repo.language) {
      var lang = document.createElement('span');
      var dot = document.createElement('span');
      dot.className = 'lang-dot';
      dot.style.background = LANG_COLORS[repo.language] || 'var(--accent)';
      lang.appendChild(dot);
      lang.appendChild(document.createTextNode(repo.language));
      foot.appendChild(lang);
    }

    if (typeof repo.stargazers_count === 'number') {
      var star = document.createElement('span');
      star.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-star"/></svg>';
      star.appendChild(document.createTextNode(String(repo.stargazers_count)));
      foot.appendChild(star);
    }

    if (repo.fork) {
      var fork = document.createElement('span');
      fork.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-repo"/></svg>';
      fork.appendChild(document.createTextNode('fork'));
      foot.appendChild(fork);
    }

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(foot);
    return card;
  }

  function renderRepos(repos) {
    if (!repoGrid) return;
    var list = (repos || [])
      .filter(function (r) { return !r.fork && !r.archived && r.name !== GITHUB_USER + '.github.io'; })
      .sort(function (a, b) {
        var byStars = (b.stargazers_count || 0) - (a.stargazers_count || 0);
        if (byStars !== 0) return byStars;
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      })
      .slice(0, 6);

    if (!list.length) {
      repoGrid.innerHTML = '<p class="repo-status">No repositories to show right now.</p>';
      return;
    }

    repoGrid.innerHTML = '';
    var frag = document.createDocumentFragment();
    list.forEach(function (repo) { frag.appendChild(repoCard(repo)); });
    repoGrid.appendChild(frag);
  }

  function loadGitHub() {
    var cached = readCache();
    if (cached) {
      renderStats(cached.user, cached.repos);
      renderRepos(cached.repos);
      return;
    }

    if (!window.fetch) return;

    window.fetch(API + '/users/' + GITHUB_USER)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (user) {
        if (!user) return null;
        return window.fetch(API + '/users/' + GITHUB_USER + '/repos?per_page=100&sort=updated')
          .then(function (res) { return res.ok ? res.json() : []; })
          .then(function (repos) {
            var data = { user: user, repos: repos || [] };
            writeCache(data);
            renderStats(data.user, data.repos);
            renderRepos(data.repos);
            return data;
          });
      })
      .catch(function () {
        if (repoGrid) {
          var status = repoGrid.querySelector('.repo-status');
          if (status) {
            status.textContent = 'Could not reach GitHub right now — browse the profile directly.';
            var link = document.createElement('a');
            link.href = 'https://github.com/' + GITHUB_USER;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = 'github.com/' + GITHUB_USER;
            status.appendChild(document.createTextNode(' '));
            status.appendChild(link);
          }
        }
      });
  }

  if (repoGrid || statRow) loadGitHub();
})();
