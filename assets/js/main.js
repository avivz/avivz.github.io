/*
  Annotated Preprint - main.js
  IntersectionObserver for fade-in animations,
  BibTeX toggle, active nav link, margin note positioning, dynamic date.
*/

document.addEventListener('DOMContentLoaded', function () {
  // ===== Dynamic Date =====
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];
  var now = new Date();
  var curMonth = months[now.getMonth()] + ' ' + now.getFullYear();
  var prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var prevMonth = months[prev.getMonth()] + ' ' + prev.getFullYear();
  var dateEl = document.getElementById('dynamic-date');
  if (dateEl) {
    dateEl.innerHTML = '<span class="struck">' + prevMonth + '</span>' +
      '<span class="handwritten-fix" style="position:absolute; left:50%; transform:translateX(-50%); top:1.3em; white-space:nowrap;">' + curMonth + '</span>';
  }

  // ===== Scroll Fade-in via IntersectionObserver =====
  window._fadeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        window._fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-in').forEach(function (el) {
    window._fadeObserver.observe(el);
  });

  // ===== Active Nav Link Highlighting =====
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.section-nav a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href) {
      var linkPage = href.split('#')[0];
      if (linkPage && linkPage === currentPage) {
        link.classList.add('active');
      }
    }
  });

  // ===== Margin Note Positioning =====
  window.positionMarginNotes = positionMarginNotes;
  function positionMarginNotes() {
    var notes = document.querySelectorAll('.margin-note[data-align]');

    // First pass: position each note at its target element
    notes.forEach(function (note) {
      var target = document.querySelector(note.getAttribute('data-align'));
      if (!target) return;
      var sectionRow = note.closest('.section-row');
      if (!sectionRow) return;
      var rowTop = sectionRow.getBoundingClientRect().top;
      var targetTop = target.getBoundingClientRect().top;
      var offset = parseInt(note.getAttribute('data-offset') || '0', 10);
      var col = note.closest('.ml, .mr');
      note.style.position = 'absolute';
      note.style.top = (targetTop - rowTop + offset) + 'px';
      if (col && col.classList.contains('ml')) {
        note.style.right = '0';
      }
    });

    // Second pass: resolve overlaps within each margin column
    requestAnimationFrame(function () {
      var colGroups = {};
      notes.forEach(function (note) {
        if (note.style.position !== 'absolute') return;
        var col = note.closest('.ml, .mr');
        var sectionRow = note.closest('.section-row');
        if (!col || !sectionRow) return;
        var key = (sectionRow.id || 'x') + (col.classList.contains('ml') ? 'L' : 'R');
        if (!colGroups[key]) colGroups[key] = [];
        colGroups[key].push(note);
      });

      Object.keys(colGroups).forEach(function (key) {
        var group = colGroups[key];
        group.sort(function (a, b) {
          return parseFloat(a.style.top) - parseFloat(b.style.top);
        });
        for (var i = 1; i < group.length; i++) {
          var prevRect = group[i - 1].getBoundingClientRect();
          var curRect = group[i].getBoundingClientRect();
          if (curRect.top < prevRect.bottom + 8) {
            var sectionRow = group[i].closest('.section-row');
            var rowTop = sectionRow.getBoundingClientRect().top;
            group[i].style.top = (prevRect.bottom - rowTop + 8) + 'px';
          }
        }
      });
    });
  }

  // ===== Random Ink Tilts =====
  // Margin notes: ±8 degrees (replaces static rotate classes)
  document.querySelectorAll('.margin-note').forEach(function (el) {
    var deg = (Math.random() * 16 - 8).toFixed(1);
    el.style.transform = 'rotate(' + deg + 'deg)';
  });
  // Insert text: keep centered, no tilt (sits between lines)
  document.querySelectorAll('.insert-text').forEach(function (el) {
    el.style.transform = 'translateX(-50%)';
  });
  // Nudge insert-text away from paper edges
  window.constrainInsertTexts = constrainInsertTexts;
  function constrainInsertTexts() {
    var paperLeft = Math.max(10, (window.innerWidth / 2) - 530);
    var paperRight = Math.min(window.innerWidth - 10, (window.innerWidth / 2) + 530);
    document.querySelectorAll('.insert-text').forEach(function (el) {
      el.style.transform = 'translateX(-50%)';
      var rect = el.getBoundingClientRect();
      if (rect.left < paperLeft) {
        var shift = paperLeft - rect.left + 4;
        el.style.transform = 'translateX(calc(-50% + ' + shift + 'px))';
      } else if (rect.right > paperRight) {
        var shift = rect.right - paperRight + 4;
        el.style.transform = 'translateX(calc(-50% - ' + shift + 'px))';
      }
    });
  }
  // Strikethrough lines: tilt capped so edge displacement ≤ 2px
  document.querySelectorAll('.struck').forEach(function (el) {
    // Skip elements with manually set tilt
    if (el.style.getPropertyValue('--tilt')) return;
    var w = el.offsetWidth || 30;
    // max angle where half-width * tan(angle) ≤ 2px
    var maxDeg = Math.atan(4 / w) * (180 / Math.PI);
    maxDeg = Math.min(maxDeg, 8);
    var deg = (Math.random() * 2 * maxDeg - maxDeg).toFixed(1);
    el.style.setProperty('--tilt', deg + 'deg');
  });
  // Handwritten fix text: ±12 degrees
  document.querySelectorAll('.handwritten-fix').forEach(function (el) {
    var deg = (Math.random() * 24 - 12).toFixed(1);
    el.style.transform = 'rotate(' + deg + 'deg)';
    el.style.display = 'inline-block';
  });

  // Position after images load, and on resize
  window.addEventListener('load', function () { positionMarginNotes(); constrainInsertTexts(); });
  window.addEventListener('resize', function () { positionMarginNotes(); constrainInsertTexts(); });
  positionMarginNotes();
  constrainInsertTexts();
});

// ===== Floating TOC =====
(function () {
  var panel = document.createElement('div');
  panel.className = 'floating-toc-panel';

  // Paper-clip button (always visible, acts as toggle)
  var clipBtn = document.createElement('button');
  clipBtn.className = 'toc-clip-btn';
  clipBtn.setAttribute('aria-label', 'Toggle table of contents');
  clipBtn.innerHTML =
    '<svg viewBox="0 0 56 22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M52 17 C54 5 50 1 44 1' +
    ' L12 1 C8 1 5 4 5 7 C5 10 8 13 12 13 L40 13' +
    '"' +
    ' fill="none" stroke="#aaa" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  // Clip is appended to body separately (absolute, scrolls with page)

  // Post-it note
  var postit = document.createElement('div');
  postit.className = 'toc-postit';

  // Collapsible body inside the post-it
  var body = document.createElement('div');
  body.className = 'toc-body';

  var tocItems = [
    { label: 'Abstract', section: '#abstract', href: '#top' },
    { label: '1\u2002Selected Papers', section: '#selected-papers' },
    { label: '2\u2002Contact', section: '#contact' },
    { sep: true },
    { label: 'A\u2002Publications', page: 'publications.html' },
    { label: 'B\u2002Talks', page: 'talks.html' },
    { label: 'C\u2002Reception Hours', page: 'counseling.html' },
    { label: 'D\u2002Notes', page: '/notes/' },
    { label: 'E\u2002Research Projects', page: '/projects/' }
  ];

  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var isIndex = currentPage === 'index.html' || currentPage === '';

  var tocLinks = [];
  tocItems.forEach(function (item) {
    if (item.sep) {
      var sep = document.createElement('div');
      sep.className = 'toc-sep';
      body.appendChild(sep);
      return;
    }
    var a = document.createElement('a');
    if (item.section) {
      var target = item.href || item.section;
      a.href = isIndex ? target : 'index.html' + target;
    } else {
      a.href = item.page;
    }
    a.textContent = item.label;
    if (item.page && item.page.split('#')[0] === currentPage) {
      a.classList.add('active');
    }
    if (item.section && isIndex) {
      a.classList.add('active');
    }
    tocLinks.push(a);
    body.appendChild(a);
  });

  // Camera-ready toggle
  var toggleSep = document.createElement('div');
  toggleSep.className = 'toc-sep';
  body.appendChild(toggleSep);

  var toggleBtn = document.createElement('button');
  toggleBtn.className = 'toc-version-toggle';
  var transitioning = false;

  var saved = localStorage.getItem('camera-ready');
  if (saved === '1') {
    document.body.classList.add('camera-ready');
    toggleBtn.textContent = 'See latest draft version';
  } else {
    toggleBtn.textContent = 'See camera ready version';
  }

  function replayPageAnimations() {
    document.querySelectorAll('.fade-in').forEach(function (el) {
      el.classList.remove('visible');
      el.style.animation = '';
      el.style.clipPath = '';
      el.style.opacity = '';
      el.style.transition = '';
      if (window._fadeObserver) {
        window._fadeObserver.observe(el);
      }
    });
  }

  toggleBtn.addEventListener('click', function () {
    if (transitioning) return;
    transitioning = true;
    var goingClean = !document.body.classList.contains('camera-ready');
    toggleBtn.textContent = goingClean ? 'See latest draft version' : 'See camera ready version';
    localStorage.setItem('camera-ready', goingClean ? '1' : '0');

    document.body.style.transition = 'opacity 200ms ease';
    document.body.style.opacity = '0';

    setTimeout(function () {
      if (goingClean) {
        document.body.classList.add('camera-ready');
      } else {
        document.body.classList.remove('camera-ready');
      }
      replayPageAnimations();
      if (window.positionMarginNotes) window.positionMarginNotes();
      if (window.constrainInsertTexts) window.constrainInsertTexts();

      document.body.style.opacity = '1';
      setTimeout(function () {
        document.body.style.transition = '';
        document.body.style.opacity = '';
        transitioning = false;
      }, 250);
    }, 220);
  });
  body.appendChild(toggleBtn);

  postit.appendChild(body);
  panel.appendChild(postit);

  // Auto-collapse when viewport is too narrow for the panel + content
  var isOpen = false;
  var nudgeInterval;
  function shouldAutoOpen() {
    return window.innerWidth > 900;
  }
  function setOpen(open) {
    isOpen = open;
    panel.classList.toggle('toc-open', isOpen);
    clipBtn.classList.toggle('clip-dimmed', !isOpen);
    if (isOpen && nudgeInterval) {
      clearInterval(nudgeInterval);
      nudgeInterval = null;
      localStorage.setItem('toc-visited', String(Date.now()));
    }
  }
  setOpen(shouldAutoOpen());

  clipBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(!isOpen);
  });
  document.addEventListener('click', function (e) {
    if (isOpen && !panel.contains(e.target)) {
      setOpen(false);
    }
  });
  window.addEventListener('resize', function () {
    if (!shouldAutoOpen() && isOpen) {
      setOpen(false);
    }
  });

  document.body.appendChild(panel);
  document.body.appendChild(clipBtn);

  // Nudge the clip every 10s until TOC is opened this session
  var nudgeInterval;
  function nudge() {
    clipBtn.classList.remove('clip-throb');
    void clipBtn.offsetWidth;
    clipBtn.classList.add('clip-throb');
  }
  var lastVisit = parseInt(localStorage.getItem('toc-visited') || '0', 10);
  var hourAgo = Date.now() - 60 * 60 * 1000;
  if (!lastVisit || lastVisit < hourAgo) {
    nudgeInterval = setInterval(nudge, 10000);
  }

  // ===== Scroll-fade: animate post-it opacity/scale as it scrolls away =====
  var fadeStart = 60;   // scroll px where fade begins
  var fadeEnd = 200;    // scroll px where fully hidden
  var tocWasOpen = isOpen;
  var tocHidden = false;
  function updateTocScroll() {
    var y = window.scrollY;
    if (y <= fadeStart) {
      postit.style.opacity = '';
      postit.style.transform = '';
      postit.style.pointerEvents = '';
      if (tocHidden) {
        tocHidden = false;
        if (tocWasOpen && shouldAutoOpen()) setOpen(true);
      }
    } else if (y >= fadeEnd) {
      postit.style.opacity = '0';
      postit.style.transform = 'rotate(1.2deg) scale(0.92)';
      postit.style.pointerEvents = 'none';
      if (!tocHidden) {
        tocWasOpen = isOpen;
        tocHidden = true;
      }
    } else {
      var t = (y - fadeStart) / (fadeEnd - fadeStart);
      postit.style.opacity = String(1 - t);
      var s = 1 - t * 0.08;
      postit.style.transform = 'rotate(' + (3 - 1.8 * t) + 'deg) scale(' + s + ')';
      postit.style.pointerEvents = 'none';
      if (!tocHidden) {
        tocWasOpen = isOpen;
        tocHidden = true;
      }
    }
  }
  window.addEventListener('scroll', updateTocScroll, { passive: true });
  updateTocScroll();
})();

// ===== Scroll-to-Top Button =====
(function () {
  var btn = document.createElement('button');
  btn.className = 'scroll-to-top';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML =
    '<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M14,24 C14,22 14.5,16 14,10 C13.5,7 14,5 14,4" ' +
    'stroke="#c0392b" stroke-width="2" stroke-linecap="round" fill="none"/>' +
    '<path d="M7,12 C9,9 11,6 14,4 C17,6 19,9 21,12" ' +
    'stroke="#c0392b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
    '</svg>';

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  var showThreshold = 300;
  function updateScrollBtn() {
    var y = window.scrollY;
    btn.classList.toggle('visible', y > showThreshold);
    // Slow wobbly bob and tilt tied to scroll position
    var bob = Math.sin(y * 0.008) * 4;
    var tilt = Math.sin(y * 0.006 + 1) * 5;
    btn.style.transform = 'translateY(' + bob + 'px) rotate(' + tilt + 'deg)';
  }
  window.addEventListener('scroll', updateScrollBtn, { passive: true });
  updateScrollBtn();

  document.body.appendChild(btn);
})();

// ===== BibTeX Toggle =====
function toggleBibtex(btn) {
  var pre = btn.closest('.pub-entry').querySelector('.pub-bibtex');
  if (pre) {
    pre.hidden = !pre.hidden;
  }
}
