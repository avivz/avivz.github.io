/*
	Editorial by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
	Rewritten in vanilla JS (no jQuery/Skel dependencies)
*/

(function() {

	var breakpoints = {
		xlarge:         '(max-width: 1680px)',
		large:          '(max-width: 1280px)',
		medium:         '(max-width: 980px)',
		small:          '(max-width: 736px)',
		xsmall:         '(max-width: 480px)'
	};

	function isActive(bp) {
		return window.matchMedia(breakpoints[bp]).matches;
	}

	// Disable animations/transitions until the page has loaded.
	document.body.classList.add('is-loading');

	window.addEventListener('load', function() {
		setTimeout(function() {
			document.body.classList.remove('is-loading');
		}, 100);
	});

	// Disable animations/transitions when resizing.
	var resizeTimeout;

	window.addEventListener('resize', function() {
		document.body.classList.add('is-resizing');
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(function() {
			document.body.classList.remove('is-resizing');
		}, 100);
	});

	// Sidebar.
	var sidebar = document.getElementById('sidebar');
	var sidebarInner = sidebar ? sidebar.querySelector('.inner') : null;

	if (sidebar) {

		// Set inactive class based on breakpoint.
		function checkSidebarBreakpoint() {
			if (isActive('large')) {
				sidebar.classList.add('inactive');
			} else {
				sidebar.classList.remove('inactive');
			}
		}

		checkSidebarBreakpoint();
		window.matchMedia(breakpoints.large).addListener(checkSidebarBreakpoint);

		// Toggle button.
		var toggle = document.createElement('a');
		toggle.href = '#sidebar';
		toggle.className = 'toggle';
		toggle.textContent = 'Toggle';
		sidebar.appendChild(toggle);

		toggle.addEventListener('click', function(event) {
			event.preventDefault();
			event.stopPropagation();
			sidebar.classList.toggle('inactive');
		});

		// Link clicks: on mobile (<=large), close sidebar then navigate.
		sidebar.addEventListener('click', function(event) {
			if (!isActive('large'))
				return;

			var a = event.target.closest('a');
			if (!a || a === toggle)
				return;

			var href = a.getAttribute('href');
			var target = a.getAttribute('target');

			event.preventDefault();
			event.stopPropagation();

			if (!href || href === '#' || href === '')
				return;

			sidebar.classList.add('inactive');

			setTimeout(function() {
				if (target === '_blank')
					window.open(href);
				else
					window.location.href = href;
			}, 500);
		});

		// Prevent events inside the sidebar from closing it.
		sidebar.addEventListener('click', function(event) {
			if (!isActive('large'))
				return;
			event.stopPropagation();
		});

		['touchend', 'touchstart', 'touchmove'].forEach(function(evt) {
			sidebar.addEventListener(evt, function(event) {
				if (!isActive('large'))
					return;
				event.stopPropagation();
			});
		});

		// Hide sidebar on body click/tap.
		document.body.addEventListener('click', function(event) {
			if (!isActive('large'))
				return;
			sidebar.classList.add('inactive');
		});

		document.body.addEventListener('touchend', function(event) {
			if (!isActive('large'))
				return;
			sidebar.classList.add('inactive');
		});

		// Scroll lock.
		if (sidebarInner) {
			window.addEventListener('load', function() {
				var sh, wh;
				var locked = false;

				if (window.scrollY === 1)
					window.scrollTo(0, 0);

				function onScroll() {
					if (isActive('large')) {
						locked = false;
						sidebarInner.style.position = '';
						sidebarInner.style.top = '';
						return;
					}

					var x = Math.max(sh - wh, 0);
					var y = Math.max(0, window.scrollY - x);

					if (locked) {
						if (y <= 0) {
							locked = false;
							sidebarInner.style.position = '';
							sidebarInner.style.top = '';
						} else {
							sidebarInner.style.top = (-1 * x) + 'px';
						}
					} else {
						if (y > 0) {
							locked = true;
							sidebarInner.style.position = 'fixed';
							sidebarInner.style.top = (-1 * x) + 'px';
						}
					}
				}

				function onResize() {
					wh = window.innerHeight;
					sh = sidebarInner.offsetHeight + 30;
					onScroll();
				}

				window.addEventListener('scroll', onScroll);
				window.addEventListener('resize', onResize);
				onResize();
			});
		}
	}

	// Menu openers.
	var menu = document.getElementById('menu');

	if (menu) {
		var openers = menu.querySelectorAll('ul .opener');

		openers.forEach(function(opener) {
			opener.addEventListener('click', function(event) {
				event.preventDefault();

				openers.forEach(function(other) {
					if (other !== opener)
						other.classList.remove('active');
				});

				opener.classList.toggle('active');

				// Trigger resize for sidebar scroll lock recalculation.
				window.dispatchEvent(new Event('resize'));
			});
		});
	}

})();
