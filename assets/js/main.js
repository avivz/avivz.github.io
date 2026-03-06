/*
  Annotated Preprint - main.js
  IntersectionObserver for fade-in animations,
  BibTeX toggle, active nav link, margin note positioning, dynamic date.
*/

document.addEventListener('DOMContentLoaded', function() {
  // ===== Dynamic Date =====
  var months = ['January','February','March','April','May','June','July','August',
                'September','October','November','December'];
  var now = new Date();
  var curMonth = months[now.getMonth()] + ' ' + now.getFullYear();
  var prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var prevMonth = months[prev.getMonth()] + ' ' + prev.getFullYear();
  var dateEl = document.getElementById('dynamic-date');
  if (dateEl) {
    dateEl.innerHTML = '<span class="struck">' + prevMonth + '</span>' +
      '<br><span class="handwritten-fix">' + curMonth + '</span>';
  }

  // ===== Scroll Fade-in via IntersectionObserver =====
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-in').forEach(function(el) {
    observer.observe(el);
  });

  // ===== Active Nav Link Highlighting =====
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.section-nav a').forEach(function(link) {
    var href = link.getAttribute('href');
    if (href) {
      var linkPage = href.split('#')[0];
      if (linkPage && linkPage === currentPage) {
        link.classList.add('active');
      }
    }
  });

  // ===== Margin Note Positioning =====
  function positionMarginNotes() {
    var notes = document.querySelectorAll('.margin-note[data-align]');

    // First pass: position each note at its target element
    notes.forEach(function(note) {
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
    requestAnimationFrame(function() {
      var colGroups = {};
      notes.forEach(function(note) {
        if (note.style.position !== 'absolute') return;
        var col = note.closest('.ml, .mr');
        var sectionRow = note.closest('.section-row');
        if (!col || !sectionRow) return;
        var key = (sectionRow.id || 'x') + (col.classList.contains('ml') ? 'L' : 'R');
        if (!colGroups[key]) colGroups[key] = [];
        colGroups[key].push(note);
      });

      Object.keys(colGroups).forEach(function(key) {
        var group = colGroups[key];
        group.sort(function(a, b) {
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
  document.querySelectorAll('.margin-note').forEach(function(el) {
    var deg = (Math.random() * 16 - 8).toFixed(1);
    el.style.transform = 'rotate(' + deg + 'deg)';
  });
  // Insert text: keep centered, no tilt (sits between lines)
  document.querySelectorAll('.insert-text').forEach(function(el) {
    el.style.transform = 'translateX(-50%)';
  });
  // Strikethrough lines: tilt capped so edge displacement ≤ 2px
  document.querySelectorAll('.struck').forEach(function(el) {
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
  document.querySelectorAll('.handwritten-fix').forEach(function(el) {
    var deg = (Math.random() * 24 - 12).toFixed(1);
    el.style.transform = 'rotate(' + deg + 'deg)';
    el.style.display = 'inline-block';
  });

  // Position after images load, and on resize
  window.addEventListener('load', positionMarginNotes);
  window.addEventListener('resize', positionMarginNotes);
  positionMarginNotes();
});

// ===== Camera-Ready / Draft Toggle =====
(function() {
  var btn = document.createElement('button');
  btn.className = 'version-toggle';
  btn.textContent = 'See camera ready version';
  var transitioning = false;

  // Elements that can be clip-path erased (have visible width/content)
  var clipSelectors = [
    '.margin-note',
    '.struck',
    '.handwritten-fix',
    '.insert-text',
    '.highlighter', '.highlighter-green', '.highlighter-pink',
    '.pen-underline',
    'svg[aria-hidden="true"]'
  ];
  // Elements that should fade (zero-width, pseudo-element-based)
  var fadeSelectors = [
    '.caret-mark',
    '.circle-text'
  ];

  function collectAndSort(selectors) {
    var els = [];
    selectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) { els.push(el); });
    });
    els.sort(function(a, b) {
      return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
    });
    return els;
  }

  function eraseToClean() {
    var clipEls = collectAndSort(clipSelectors);
    var fadeEls = collectAndSort(fadeSelectors);
    var allCount = clipEls.length + fadeEls.length;
    var totalDuration = 900;
    var perElement = 300;
    var stagger = allCount > 1 ? totalDuration / allCount : 0;

    // Build a merged list sorted by position for consistent stagger
    var allEls = [];
    clipEls.forEach(function(el) { allEls.push({el: el, mode: 'clip'}); });
    fadeEls.forEach(function(el) { allEls.push({el: el, mode: 'fade'}); });
    allEls.sort(function(a, b) {
      return a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top;
    });

    allEls.forEach(function(item, i) {
      var delay = i * stagger;
      var el = item.el;
      // Cancel any running CSS animation (ink-text-reveal uses clip-path
      // with forwards fill, which overrides inline styles)
      el.style.animation = 'none';
      if (item.mode === 'clip') {
        el.style.transition = 'none';
        el.style.clipPath = 'inset(-2px -2px -2px -2px)';
        el.offsetHeight;
        el.style.transition = 'clip-path ' + perElement + 'ms ease-in ' + delay + 'ms';
        el.style.clipPath = 'inset(-2px -2px -2px 110%)';
      } else {
        el.style.transition = 'none';
        el.style.opacity = '1';
        el.offsetHeight;
        el.style.transition = 'opacity ' + perElement + 'ms ease-in ' + delay + 'ms';
        el.style.opacity = '0';
      }
    });

    var finishTime = totalDuration + perElement + 50;
    setTimeout(function() {
      // Brief crossfade on content to smooth the text reflow
      var mcs = document.querySelectorAll('.mc, .main-content');
      mcs.forEach(function(mc) {
        mc.style.transition = 'none';
        mc.style.opacity = '0';
        mc.offsetHeight;
      });
      document.body.classList.add('camera-ready');
      allEls.forEach(function(item) {
        item.el.style.transition = '';
        item.el.style.clipPath = '';
        item.el.style.opacity = '';
        item.el.style.animation = '';
      });
      requestAnimationFrame(function() {
        mcs.forEach(function(mc) {
          mc.style.transition = 'opacity 250ms ease';
          mc.style.opacity = '1';
        });
        setTimeout(function() {
          mcs.forEach(function(mc) {
            mc.style.transition = '';
            mc.style.opacity = '';
          });
          transitioning = false;
        }, 300);
      });
    }, finishTime);
  }

  function drawBackIn() {
    // Crossfade content while text reflows back
    var mcs = document.querySelectorAll('.mc, .main-content');
    mcs.forEach(function(mc) {
      mc.style.transition = 'none';
      mc.style.opacity = '0';
      mc.offsetHeight;
    });
    document.body.classList.remove('camera-ready');
    requestAnimationFrame(function() {
      mcs.forEach(function(mc) {
        mc.style.transition = 'opacity 250ms ease';
        mc.style.opacity = '1';
      });
      setTimeout(function() {
        mcs.forEach(function(mc) {
          mc.style.transition = '';
          mc.style.opacity = '';
        });
      }, 300);
      var clipEls = collectAndSort(clipSelectors);
      var fadeEls = collectAndSort(fadeSelectors);
      var totalDuration = 900;
      var perElement = 350;

      var allEls = [];
      clipEls.forEach(function(el) { allEls.push({el: el, mode: 'clip'}); });
      fadeEls.forEach(function(el) { allEls.push({el: el, mode: 'fade'}); });
      allEls.sort(function(a, b) {
        return a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top;
      });
      var stagger = allEls.length > 1 ? totalDuration / allEls.length : 0;

      allEls.forEach(function(item, i) {
        var delay = i * stagger;
        var el = item.el;
        el.style.animation = 'none';
        if (item.mode === 'clip') {
          el.style.transition = 'none';
          el.style.clipPath = 'inset(-2px -2px -2px 110%)';
          el.offsetHeight;
          el.style.transition = 'clip-path ' + perElement + 'ms ease-out ' + delay + 'ms';
          el.style.clipPath = 'inset(-2px -2px -2px -2px)';
        } else {
          el.style.transition = 'none';
          el.style.opacity = '0';
          el.offsetHeight;
          el.style.transition = 'opacity ' + perElement + 'ms ease-out ' + delay + 'ms';
          el.style.opacity = '1';
        }
      });

      var finishTime = totalDuration + perElement + 50;
      setTimeout(function() {
        allEls.forEach(function(item) {
          item.el.style.transition = '';
          item.el.style.clipPath = '';
          item.el.style.opacity = '';
          item.el.style.animation = '';
        });
        transitioning = false;
      }, finishTime);
    });
  }

  btn.addEventListener('click', function() {
    if (transitioning) return;
    transitioning = true;
    var goingClean = !document.body.classList.contains('camera-ready');
    if (goingClean) {
      btn.textContent = 'See latest draft version';
      eraseToClean();
    } else {
      btn.textContent = 'See camera ready version';
      drawBackIn();
    }
  });
  document.body.appendChild(btn);
})();

// ===== BibTeX Toggle =====
function toggleBibtex(btn) {
  var pre = btn.closest('.pub-entry').querySelector('.pub-bibtex');
  if (pre) {
    pre.hidden = !pre.hidden;
  }
}
