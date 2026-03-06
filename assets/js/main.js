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
    dateEl.innerHTML = '<span class="struck">' + prevMonth + '<br></span>' +
      '<span class="handwritten-fix">' + curMonth + '</span>';
  }

  // ===== Scroll Fade-in via IntersectionObserver =====
  window._fadeObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        window._fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-in').forEach(function(el) {
    window._fadeObserver.observe(el);
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
  window.positionMarginNotes = positionMarginNotes;
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

  function replayPageAnimations() {
    // Reset all fade-in elements and re-observe them
    document.querySelectorAll('.fade-in').forEach(function(el) {
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

  btn.addEventListener('click', function() {
    if (transitioning) return;
    transitioning = true;
    var goingClean = !document.body.classList.contains('camera-ready');
    btn.textContent = goingClean ? 'See latest draft version' : 'See camera ready version';

    // Fade out the page
    document.body.style.transition = 'opacity 200ms ease';
    document.body.style.opacity = '0';

    setTimeout(function() {
      // Toggle state while hidden
      if (goingClean) {
        document.body.classList.add('camera-ready');
      } else {
        document.body.classList.remove('camera-ready');
      }
      // Reset animations so they replay on the new state
      replayPageAnimations();
      // Reposition margin notes after layout change
      if (window.positionMarginNotes) window.positionMarginNotes();

      // Fade back in
      document.body.style.opacity = '1';
      setTimeout(function() {
        document.body.style.transition = '';
        document.body.style.opacity = '';
        transitioning = false;
      }, 250);
    }, 220);
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
