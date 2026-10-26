/* ============================================================
   LZVE.ly — Roblox profile page
   Fetches live data from the public Roblox web APIs.
   ============================================================ */
(function () {
  'use strict';

  var USER_ID = 5031624447;
  var USERNAME = 'hydro_ex3';
  // Set this to your Cloudflare Worker URL after deploying roblox/worker.js
  // Example: 'https://roblox-proxy.your-subdomain.workers.dev/?url='
  // Leave empty to attempt direct fetch (will likely fail due to CORS).
  var DATA_URL = '../roblox/data.json';
  var API = {}; // not used directly anymore; data comes from data.json

  function loadFromData() {
    fetch(DATA_URL)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data) return;
        var user = data.user || {};
        var nameEl = el('rbx-display-name');
        if (nameEl && user.displayName) nameEl.textContent = user.displayName;
        var descEl = el('rbx-description');
        if (descEl) descEl.textContent = user.description || 'No description set.';
        setStat('rbx-joined', fmtDate(user.created));
        setStat('rbx-user-id', user.id);
        var meta = el('rbx-meta');
        if (meta && user.name) {
          meta.innerHTML = '';
          var span = document.createElement('span');
          span.className = 'pill pill-pronouns';
          span.textContent = '@' + user.name;
          meta.appendChild(span);
        }
        var status = el('rbx-status');
        if (status) status.textContent = user.isBanned ? 'Banned' : 'Active';
        if (data.avatar) {
          var avatar = el('rbx-avatar');
          if (avatar) avatar.src = data.avatar;
        }

        var games = data.games || [];
        setStat('rbx-games-count', games.length);
        var grid = el('rbx-games');
        if (grid && games.length) {
          grid.innerHTML = '';
          var frag = document.createDocumentFragment();
          games.forEach(function (game) {
            var card = document.createElement('article');
            card.className = 'repo-card';
            var title = document.createElement('a');
            title.className = 'repo-title';
            title.href = 'https://www.roblox.com/games/' + game.id;
            title.target = '_blank';
            title.rel = 'noopener';
            title.textContent = game.name;
            var desc = document.createElement('p');
            desc.className = 'repo-desc';
            desc.textContent = game.description || 'No description.';
            var foot = document.createElement('div');
            foot.className = 'repo-foot';
            if (typeof game.playing === 'number') {
              var playing = document.createElement('span');
              playing.textContent = game.playing.toLocaleString() + ' playing';
              foot.appendChild(playing);
            }
            if (typeof game.visits === 'number') {
              var visits = document.createElement('span');
              visits.textContent = game.visits.toLocaleString() + ' visits';
              foot.appendChild(visits);
            }
            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(foot);
            frag.appendChild(card);
          });
          grid.appendChild(frag);
        }

        var groups = data.groups || [];
        setStat('rbx-groups-count', groups.length);
        var ggrid = el('rbx-groups');
        if (ggrid && groups.length) {
          ggrid.innerHTML = '';
          groups.forEach(function (entry) {
            var g = entry.group || {};
            var role = entry.role || {};
            var card = document.createElement('a');
            card.className = 'contact-card';
            card.href = 'https://www.roblox.com/groups/' + g.id;
            card.target = '_blank';
            card.rel = 'noopener';
            var icon = document.createElement('span');
            icon.className = 'contact-icon';
            icon.textContent = '👥';
            var text = document.createElement('span');
            text.className = 'contact-text';
            var strong = document.createElement('strong');
            strong.textContent = g.name || 'Unknown group';
            var span = document.createElement('span');
            span.textContent = role.name || 'Member';
            text.appendChild(strong);
            text.appendChild(span);
            var arrow = document.createElement('svg');
            arrow.className = 'icon contact-arrow';
            arrow.setAttribute('aria-hidden', 'true');
            var use = document.createElement('use');
            use.setAttribute('href', '#i-arrow');
            arrow.appendChild(use);
            card.appendChild(icon);
            card.appendChild(text);
            card.appendChild(arrow);
            ggrid.appendChild(card);
          });
        }
      })
      .catch(function () { /* keep static fallback */ });
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return iso; }
  }

  function setStat(id, value) {
    var e = el(id);
    if (e) e.textContent = value;
  }

  /* ---------- Theme (reuse from main.js pattern) ---------- */
  var themeToggle = el('theme-toggle');
  var order = ['auto', 'light', 'dark'];
  var labels = { auto: 'Theme: system (click for light)', light: 'Theme: light (click for dark)', dark: 'Theme: dark (click for system)' };

  function currentTheme() { return document.documentElement.dataset.theme || 'auto'; }
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try {
      if (theme === 'auto') localStorage.removeItem('theme');
      else localStorage.setItem('theme', theme);
    } catch (e) { /* ignore */ }
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', labels[theme]);
      themeToggle.setAttribute('title', labels[theme]);
    }
  }
  if (themeToggle) {
    applyTheme(currentTheme());
    themeToggle.addEventListener('click', function () {
      var next = order[(order.indexOf(currentTheme()) + 1) % order.length];
      applyTheme(next);
    });
  }
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  var onSchemeChange = function () { if (currentTheme() === 'auto') applyTheme('auto'); };
  if (mq.addEventListener) mq.addEventListener('change', onSchemeChange);
  else if (mq.addListener) mq.addListener(onSchemeChange);

  /* ---------- Footer year ---------- */
  var yearEl = el('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (!('IntersectionObserver' in window)) {
      revealEls.forEach(function (e) { e.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var delay = Number(entry.target.dataset.revealDelay || 0);
          setTimeout(function () { entry.target.classList.add('in'); }, delay);
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealEls.forEach(function (e, i) {
        e.dataset.revealDelay = String(Math.min(i % 4, 3) * 70);
        io.observe(e);
      });
    }
  }

  /* ---------- Roblox data ---------- */
  function loadUser() {
    fetch(API.user)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (user) {
        if (!user) return;
        var nameEl = el('rbx-display-name');
        if (nameEl) nameEl.textContent = user.displayName || user.name || 'Roblox user';
        var descEl = el('rbx-description');
        if (descEl) descEl.textContent = user.description || 'No description set.';
        setStat('rbx-joined', fmtDate(user.created));
        setStat('rbx-user-id', user.id);
        var meta = el('rbx-meta');
        if (meta) {
          meta.innerHTML = '';
          var pills = [
            { text: '@' + user.name, cls: 'pill-pronouns' },
            { text: 'Roblox', cls: '' }
          ];
          pills.forEach(function (p) {
            var span = document.createElement('span');
            span.className = 'pill' + (p.cls ? ' ' + p.cls : '');
            span.textContent = p.text;
            meta.appendChild(span);
          });
        }
        var status = el('rbx-status');
        if (status) status.textContent = user.isBanned ? 'Banned' : 'Active';
      })
      .catch(function () {
        var descEl = el('rbx-description');
        if (descEl) descEl.textContent = 'Could not reach Roblox right now.';
      });
  }

  function loadAvatar() {
    fetch(API.avatar)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || !data.data || !data.data[0]) return;
        var img = data.data[0];
        if (img.state === 'Completed' && img.imageUrl) {
          var avatar = el('rbx-avatar');
          if (avatar) avatar.src = img.imageUrl;
        }
      })
      .catch(function () { /* leave placeholder */ });
  }

  function loadGames() {
    var grid = el('rbx-games');
    fetch(API.games)
      .then(function (res) { return res.ok ? res.json() : { data: [] }; })
      .then(function (data) {
        var games = (data.data || []).filter(function (g) { return g.name; });
        setStat('rbx-games-count', games.length);
        if (!grid) return;
        if (!games.length) {
          grid.innerHTML = '<p class="repo-status">No public games yet.</p>';
          return;
        }
        grid.innerHTML = '';
        var frag = document.createDocumentFragment();
        games.forEach(function (game) {
          var card = document.createElement('article');
          card.className = 'repo-card';

          var title = document.createElement('a');
          title.className = 'repo-title';
          title.href = 'https://www.roblox.com/games/' + game.id;
          title.target = '_blank';
          title.rel = 'noopener';
          title.textContent = game.name;

          var desc = document.createElement('p');
          desc.className = 'repo-desc';
          desc.textContent = game.description || 'No description.';

          var foot = document.createElement('div');
          foot.className = 'repo-foot';

          if (typeof game.playing === 'number') {
            var playing = document.createElement('span');
            playing.textContent = game.playing.toLocaleString() + ' playing';
            foot.appendChild(playing);
          }
          if (typeof game.visits === 'number') {
            var visits = document.createElement('span');
            visits.textContent = game.visits.toLocaleString() + ' visits';
            foot.appendChild(visits);
          }
          if (game.created) {
            var created = document.createElement('span');
            created.textContent = 'Created ' + fmtDate(game.created);
            foot.appendChild(created);
          }

          card.appendChild(title);
          card.appendChild(desc);
          card.appendChild(foot);
          frag.appendChild(card);
        });
        grid.appendChild(frag);
      })
      .catch(function () {
        if (grid) grid.innerHTML = '<p class="repo-status">Could not reach Roblox right now.</p>';
      });
  }

  function loadGroups() {
    var grid = el('rbx-groups');
    fetch(API.groups)
      .then(function (res) { return res.ok ? res.json() : { data: [] }; })
      .then(function (data) {
        var groups = data.data || [];
        setStat('rbx-groups-count', groups.length);
        if (!grid) return;
        if (!groups.length) {
          grid.innerHTML = '<p class="repo-status">No groups.</p>';
          return;
        }
        grid.innerHTML = '';
        groups.forEach(function (entry) {
          var g = entry.group || {};
          var role = entry.role || {};
          var card = document.createElement('a');
          card.className = 'contact-card';
          card.href = 'https://www.roblox.com/groups/' + g.id;
          card.target = '_blank';
          card.rel = 'noopener';

          var icon = document.createElement('span');
          icon.className = 'contact-icon';
          icon.textContent = '👥';

          var text = document.createElement('span');
          text.className = 'contact-text';
          var strong = document.createElement('strong');
          strong.textContent = g.name || 'Unknown group';
          var span = document.createElement('span');
          span.textContent = role.name || 'Member';
          text.appendChild(strong);
          text.appendChild(span);

          var arrow = document.createElement('svg');
          arrow.className = 'icon contact-arrow';
          arrow.setAttribute('aria-hidden', 'true');
          var use = document.createElement('use');
          use.setAttribute('href', '#i-arrow');
          arrow.appendChild(use);

          card.appendChild(icon);
          card.appendChild(text);
          card.appendChild(arrow);
          grid.appendChild(card);
        });
      })
      .catch(function () {
        if (grid) grid.innerHTML = '<p class="repo-status">Could not reach Roblox right now.</p>';
      });
  }

  /* ---------- Boot ---------- */
  loadFromData();
})();
