/* LZVE.ly — small interface behaviors, no dependencies. */
(function () {
  'use strict';

  var GITHUB_USER = 'lversky';
  var API = 'https://api.github.com';
  var CACHE_KEY = 'lzve.github.cache.v2';
  var CACHE_TTL = 15 * 60 * 1000;
  var root = document.documentElement;
  var themeButton = document.getElementById('theme-toggle');
  var themeOrder = ['auto', 'light', 'dark'];
  var themeLabels = { auto: 'Auto', light: 'Light', dark: 'Dark' };

  function getTheme() {
    return root.dataset.theme || 'auto';
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    try {
      if (theme === 'auto') localStorage.removeItem('theme');
      else localStorage.setItem('theme', theme);
    } catch (_) { /* Theme still works for this page view. */ }
    if (themeButton) {
      var label = themeLabels[theme] || 'Auto';
      themeButton.setAttribute('aria-label', 'Color theme: ' + label + '. Activate to change theme.');
      themeButton.title = 'Color theme: ' + label;
      var text = themeButton.querySelector('.theme-label');
      if (text) text.textContent = label;
    }
  }

  if (themeButton) {
    setTheme(getTheme());
    themeButton.addEventListener('click', function () {
      var current = getTheme();
      var next = themeOrder[(themeOrder.indexOf(current) + 1) % themeOrder.length];
      setTheme(next);
    });
  }

  var menuButton = document.getElementById('menu-toggle');
  var nav = document.getElementById('site-nav');

  function closeMenu() {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('is-open');
  }

  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      var isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
      nav.classList.toggle('is-open', !isOpen);
    });
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', function (event) {
      if (nav.classList.contains('is-open') && !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 620) closeMenu();
    });
  }

  var sectionLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  var watchedSections = sectionLinks.map(function (link) {
    return document.querySelector(link.getAttribute('href'));
  }).filter(Boolean);
  if ('IntersectionObserver' in window && watchedSections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-20% 0px -68% 0px' });
    watchedSections.forEach(function (section) { spy.observe(section); });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  var statRow = document.getElementById('stat-row');
  var repoList = document.getElementById('repo-grid');
  var languageColors = {
    Python: '#3572a5', JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26',
    CSS: '#563d7c', Java: '#b07219', C: '#555', 'C++': '#f34b7d', Shell: '#89e051',
    'Jupyter Notebook': '#da5b0b', Rust: '#dea584', Go: '#00add8', PHP: '#4f5d95'
  };

  function readCache() {
    try {
      var item = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (item && item.at && Date.now() - item.at < CACHE_TTL && item.data && item.data.user && Array.isArray(item.data.repos)) return item.data;
    } catch (_) { /* Ignore malformed or unavailable storage. */ }
    return null;
  }

  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: data })); }
    catch (_) { /* A full storage quota should not affect the page. */ }
  }

  function updateStat(name, value) {
    if (!statRow) return;
    var target = statRow.querySelector('[data-stat="' + name + '"]');
    if (target && typeof value === 'number' && Number.isFinite(value)) target.textContent = value.toLocaleString();
  }

  function renderStats(user, repos) {
    if (!user || !Array.isArray(repos)) return;
    updateStat('repos', user.public_repos);
    updateStat('followers', user.followers);
    updateStat('following', user.following);
    updateStat('stars', repos.reduce(function (sum, repo) { return sum + (repo.stargazers_count || 0); }, 0));
  }

  function makeRepoCard(repo) {
    var card = document.createElement('article');
    card.className = 'repo-card';

    var title = document.createElement('a');
    title.className = 'repo-title';
    title.href = repo.html_url;
    title.target = '_blank';
    title.rel = 'noopener noreferrer';
    title.textContent = repo.name || 'Untitled repository';

    var description = document.createElement('p');
    description.className = 'repo-desc';
    description.textContent = repo.description || 'No description added yet.';

    var foot = document.createElement('div');
    foot.className = 'repo-foot';
    if (repo.language) {
      var lang = document.createElement('span');
      var dot = document.createElement('i');
      dot.className = 'lang-dot';
      dot.setAttribute('aria-hidden', 'true');
      dot.style.backgroundColor = languageColors[repo.language] || 'var(--violet)';
      lang.appendChild(dot);
      lang.appendChild(document.createTextNode(repo.language));
      foot.appendChild(lang);
    }
    if (typeof repo.stargazers_count === 'number') {
      var stars = document.createElement('span');
      stars.textContent = '★ ' + repo.stargazers_count;
      foot.appendChild(stars);
    }
    if (repo.fork) {
      var fork = document.createElement('span');
      fork.textContent = 'Fork';
      foot.appendChild(fork);
    }

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(foot);
    return card;
  }

  function renderRepos(repos) {
    if (!repoList) return;
    var selected = (repos || []).filter(function (repo) {
      return !repo.fork && !repo.archived && repo.name !== GITHUB_USER + '.github.io';
    }).sort(function (a, b) {
      var byStars = (b.stargazers_count || 0) - (a.stargazers_count || 0);
      return byStars || new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    }).slice(0, 6);

    repoList.replaceChildren();
    if (!selected.length) {
      var empty = document.createElement('p');
      empty.className = 'repo-status';
      empty.textContent = 'No public repositories to show right now.';
      repoList.appendChild(empty);
      return;
    }
    selected.forEach(function (repo) { repoList.appendChild(makeRepoCard(repo)); });
  }

  function setBusy(isBusy) {
    if (statRow) statRow.setAttribute('aria-busy', String(isBusy));
    if (repoList) repoList.setAttribute('aria-busy', String(isBusy));
  }

  function showRepoError() {
    if (!repoList) return;
    repoList.replaceChildren();
    var message = document.createElement('p');
    message.className = 'repo-status';
    message.appendChild(document.createTextNode('GitHub is taking a moment. '));
    var profile = document.createElement('a');
    profile.href = 'https://github.com/' + GITHUB_USER;
    profile.target = '_blank';
    profile.rel = 'noopener noreferrer';
    profile.textContent = 'Browse the profile instead.';
    message.appendChild(profile);
    repoList.appendChild(message);
  }

  function loadGitHub() {
    var cached = readCache();
    if (cached) {
      renderStats(cached.user, cached.repos);
      renderRepos(cached.repos);
      setBusy(false);
      return;
    }
    if (!window.fetch) {
      showRepoError();
      setBusy(false);
      return;
    }
    Promise.all([
      fetch(API + '/users/' + GITHUB_USER).then(function (response) {
        if (!response.ok) throw new Error('GitHub profile request failed');
        return response.json();
      }),
      fetch(API + '/users/' + GITHUB_USER + '/repos?per_page=100&sort=updated').then(function (response) {
        if (!response.ok) throw new Error('GitHub repositories request failed');
        return response.json();
      })
    ]).then(function (results) {
      var data = { user: results[0], repos: Array.isArray(results[1]) ? results[1] : [] };
      writeCache(data);
      renderStats(data.user, data.repos);
      renderRepos(data.repos);
    }).catch(function () {
      showRepoError();
    }).finally(function () {
      setBusy(false);
    });
  }

  if (statRow || repoList) loadGitHub();
})();
