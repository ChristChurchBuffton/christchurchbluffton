// Scroll animations via Intersection Observer
(function() {
    var targets = document.querySelectorAll('.animate');
    if (!targets.length) return;
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    targets.forEach(function(el) { observer.observe(el); });
})();

// Load shared components (header, footer, prayer FAB)
(function() {
    function loadComponent(id, file, callback) {
        var el = document.getElementById(id);
        if (!el) return;
        fetch(file)
            .then(function(res) { return res.text(); })
            .then(function(html) {
                el.innerHTML = html;
                el.classList.add('loaded');
                if (callback) callback();
            })
            .catch(function(err) { console.error('[Components] Failed to load ' + file + ':', err); });
    }

    // Returns focusable elements inside a container, in DOM order.
    // Excludes anything with tabindex="-1" (e.g. the hidden honeypot field),
    // which a plain OR'd selector would otherwise still match via its tag type.
    function getFocusable(container) {
        var all = container.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]'
        );
        return Array.prototype.filter.call(all, function(el) { return el.tabIndex !== -1; });
    }

    // Keeps Tab/Shift+Tab cycling within `container` while it's open
    function trapFocus(e, container) {
        if (e.key !== 'Tab') return;
        var focusable = getFocusable(container);
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    // Load header + mobile menu handler
    loadComponent('site-header', 'includes/header.html', function() {
        var hamburger = document.getElementById('hamburger');
        var mobileMenu = document.getElementById('mobileMenu');
        var mobileOverlay = document.getElementById('mobileOverlay');
        var mobileClose = document.getElementById('mobileClose');

        if (!hamburger) return;

        function menuKeydown(e) {
            if (e.key === 'Escape') { closeMenu(); return; }
            trapFocus(e, mobileMenu);
        }

        function openMenu() {
            mobileMenu.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            hamburger.setAttribute('aria-expanded', 'true');
            document.addEventListener('keydown', menuKeydown);
            mobileClose.focus();
        }

        function closeMenu() {
            mobileMenu.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
            hamburger.setAttribute('aria-expanded', 'false');
            document.removeEventListener('keydown', menuKeydown);
            hamburger.focus();
        }

        hamburger.addEventListener('click', openMenu);
        mobileClose.addEventListener('click', closeMenu);
        mobileOverlay.addEventListener('click', closeMenu);

        // Active nav link highlighting
        var path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
        var allLinks = document.querySelectorAll('.nav-links a, .mobile-nav-links a');
        allLinks.forEach(function(link) {
            var href = link.getAttribute('href').replace(/\.html$/, '').replace(/\/$/, '') || '/';
            if (href === path) link.classList.add('active');
        });
    });

    // Load footer + newsletter handler
    loadComponent('site-footer', 'includes/footer.html', function() {
        var form = document.getElementById('newsletterForm');
        if (!form) return;
        if (window.renderTurnstile) renderTurnstile(form.querySelector('.cf-turnstile'));
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var hp = form.querySelector('[name="website_url_confirm"]');
            if (hp && hp.value) return;

            var btn = form.querySelector('.btn-subscribe');
            btn.textContent = 'Sending...';
            btn.disabled = true;

            var token = '';
            try { token = turnstile.getResponse(form.querySelector('.cf-turnstile')); } catch (err) {}

            fetch('/api/stay-updated', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email.value, website_url_confirm: hp ? hp.value : '', turnstileToken: token })
            })
            .then(function(res) {
                if (res.ok) {
                    btn.textContent = 'Subscribed!';
                    form.email.value = '';
                    try { turnstile.reset(form.querySelector('.cf-turnstile')); } catch (err) {}
                    try { gtag('event', 'generate_lead', { form_name: 'newsletter_signup' }); } catch (err) {}
                    setTimeout(function() {
                        btn.textContent = 'Subscribe';
                        btn.disabled = false;
                    }, 3000);
                } else {
                    btn.textContent = 'Subscribe';
                    btn.disabled = false;
                    try { turnstile.reset(form.querySelector('.cf-turnstile')); } catch (err) {}
                    alert('Something went wrong. Please try again.');
                }
            })
            .catch(function() {
                btn.textContent = 'Subscribe';
                btn.disabled = false;
                try { turnstile.reset(form.querySelector('.cf-turnstile')); } catch (err) {}
                alert('Something went wrong. Please try again.');
            });
        });
    });

    // Load prayer FAB + handler
    loadComponent('site-prayer', 'includes/prayer-fab.html', function() {
        var fab = document.getElementById('prayerFab');
        var popup = document.getElementById('prayerPopup');
        var overlay = document.getElementById('prayerOverlay');
        var closeBtn = document.getElementById('prayerClose');
        var form = document.getElementById('prayerForm');

        if (window.renderTurnstile) renderTurnstile(form.querySelector('.cf-turnstile'));

        function prayerKeydown(e) {
            if (e.key === 'Escape') { closePrayer(); return; }
            trapFocus(e, popup);
        }

        function openPrayer() {
            popup.classList.add('active');
            overlay.classList.add('active');
            fab.setAttribute('aria-expanded', 'true');
            document.addEventListener('keydown', prayerKeydown);
            var firstField = document.getElementById('prayerName');
            if (firstField) firstField.focus();
        }
        function closePrayer() {
            popup.classList.remove('active');
            overlay.classList.remove('active');
            fab.setAttribute('aria-expanded', 'false');
            document.removeEventListener('keydown', prayerKeydown);
            fab.focus();

            // Reset back to a fresh fillable form for next time — without this, the success
            // confirmation stayed showing indefinitely (even across close/reopen) until a full
            // page reload, so a visitor couldn't submit a second prayer in the same visit.
            document.getElementById('prayerSuccess').classList.remove('active');
            document.getElementById('prayerFormBody').style.display = '';
            form.reset();
            var btn = form.querySelector('.prayer-submit-btn');
            btn.textContent = 'Submit Prayer';
            btn.disabled = false;
        }

        fab.addEventListener('click', openPrayer);
        closeBtn.addEventListener('click', closePrayer);
        overlay.addEventListener('click', closePrayer);

        // Fade the FAB out while the footer is in view so it never overlaps footer content
        var footerEl = document.getElementById('site-footer');
        if (footerEl && 'IntersectionObserver' in window) {
            var footerObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    fab.classList.toggle('fab-near-footer', entry.isIntersecting);
                });
            }, { threshold: 0 });
            footerObserver.observe(footerEl);
        }


        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var hp = form.querySelector('[name="website_url_confirm"]');
            if (hp && hp.value) return;

            var btn = form.querySelector('.prayer-submit-btn');
            btn.textContent = 'Sending...';
            btn.disabled = true;

            var token = '';
            try { token = turnstile.getResponse(form.querySelector('.cf-turnstile')); } catch (err) {}

            fetch('/api/prayer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.querySelector('[name="name"]').value || 'Anonymous',
                    email: form.querySelector('[name="email"]').value,
                    phone: form.querySelector('[name="phone"]').value,
                    prayer: form.querySelector('[name="prayer"]').value,
                    website_url_confirm: hp ? hp.value : '',
                    turnstileToken: token
                })
            })
            .then(function(res) {
                if (res.ok) {
                    document.getElementById('prayerFormBody').style.display = 'none';
                    document.getElementById('prayerSuccess').classList.add('active');
                    try { turnstile.reset(form.querySelector('.cf-turnstile')); } catch (err) {}
                    try { gtag('event', 'generate_lead', { form_name: 'prayer_request' }); } catch (err) {}
                } else {
                    btn.textContent = 'Submit Prayer';
                    btn.disabled = false;
                    try { turnstile.reset(form.querySelector('.cf-turnstile')); } catch (err) {}
                    alert('Something went wrong. Please try again or email us directly.');
                }
            })
            .catch(function() {
                btn.textContent = 'Submit Prayer';
                btn.disabled = false;
                try { turnstile.reset(form.querySelector('.cf-turnstile')); } catch (err) {}
                alert('Something went wrong. Please try again or email us directly.');
            });
        });
    });
})();
