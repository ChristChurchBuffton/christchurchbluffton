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

// Keep a #anchor link landing on its section. The browser jumps to the anchor on the first
// layout, before the web fonts have loaded; when Lora swaps in, the text above the target gets
// taller (90px on Groups) and the page is left stopped short of the section. Re-align once
// the fonts settle, unless the visitor has already started scrolling.
(function() {
    if (!location.hash || !document.fonts) return;
    var target = null;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (err) {}
    if (!target) return;

    var visitorMoved = false;
    function markMoved() { visitorMoved = true; }
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function(evt) {
        window.addEventListener(evt, markMoved, { once: true, passive: true });
    });

    // behavior:'instant' — the site sets html{scroll-behavior:smooth}, which would otherwise
    // animate this correction instead of snapping.
    function align() {
        if (!visitorMoved) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    document.fonts.addEventListener('loadingdone', align);
    window.addEventListener('load', function() { document.fonts.ready.then(align); });
    setTimeout(function() { document.fonts.removeEventListener('loadingdone', align); }, 5000);
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
        if (e.shiftKey && (document.activeElement === first || document.activeElement === container)) {
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
        var copyrightYear = document.getElementById('copyright-year');
        if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

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
                    siteAlert('Something went wrong. Please try again.');
                }
            })
            .catch(function() {
                btn.textContent = 'Subscribe';
                btn.disabled = false;
                try { turnstile.reset(form.querySelector('.cf-turnstile')); } catch (err) {}
                siteAlert('Something went wrong. Please try again.');
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

        // Locks background scroll while the popup is open. overflow:hidden on body alone
        // doesn't reliably stop touch-scrolling behind a fixed-position overlay on iOS
        // Safari — pinning the body to position:fixed (offset by the current scroll
        // position) is the standard cross-browser fix. Scroll position is restored on close.
        var lockedScrollY = 0;
        function lockBodyScroll() {
            lockedScrollY = window.scrollY;
            // Locking the page removes the desktop scrollbar, which would make the page ~15px
            // wider and slide everything sideways. Measure it first and hold its space with
            // padding so nothing moves. (Phones and Macs use overlay scrollbars: 0px, no-op.)
            var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.position = 'fixed';
            document.body.style.top = (-lockedScrollY) + 'px';
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.width = '100%';
            if (scrollbarWidth > 0) {
                document.body.style.boxSizing = 'border-box';
                document.body.style.paddingRight = scrollbarWidth + 'px';
            }
        }
        function unlockBodyScroll() {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
            document.body.style.boxSizing = '';
            document.body.style.paddingRight = '';
            // Explicit behavior:'instant' is required here — this site sets
            // html{scroll-behavior:smooth} globally, which would otherwise turn
            // this restore into a visible animated scroll instead of a snap-back.
            window.scrollTo({ top: lockedScrollY, left: 0, behavior: 'instant' });
        }

        function openPrayer() {
            popup.classList.add('active');
            overlay.classList.add('active');
            fab.setAttribute('aria-expanded', 'true');
            fab.classList.add('fab-popup-open');
            lockBodyScroll();
            document.addEventListener('keydown', prayerKeydown);
            // On touch devices don't focus a field: that pops the on-screen keyboard up over
            // the form before the visitor has chosen anything. Focus the dialog itself instead
            // so keyboard and screen-reader users still land inside it; the keyboard then only
            // appears when the visitor taps a field. Desktop keeps focusing the first field.
            if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
                popup.setAttribute('tabindex', '-1');
                popup.focus({ preventScroll: true });
            } else {
                var firstField = document.getElementById('prayerName');
                if (firstField) firstField.focus();
            }
        }
        function closePrayer() {
            popup.classList.remove('active');
            overlay.classList.remove('active');
            fab.setAttribute('aria-expanded', 'false');
            fab.classList.remove('fab-popup-open');
            unlockBodyScroll();
            document.removeEventListener('keydown', prayerKeydown);
            fab.focus();

            // Reset back to a fresh fillable form for next time — without this, the success
            // confirmation stayed showing indefinitely (even across close/reopen) until a full
            // page reload, so a visitor couldn't submit a second prayer in the same visit.
            document.getElementById('prayerSuccess').classList.remove('active');
            document.getElementById('prayerFormBody').style.display = '';
            form.reset();
            document.getElementById('prayerOtherNeedText').style.display = 'none';
            var btn = form.querySelector('.prayer-submit-btn');
            btn.textContent = 'Submit Request';
            btn.disabled = false;
        }

        fab.addEventListener('click', openPrayer);
        closeBtn.addEventListener('click', closePrayer);
        overlay.addEventListener('click', closePrayer);

        // "Other/Need" reveals a free-text field to briefly describe it — hidden otherwise
        var otherNeedCheck = document.getElementById('prayerOtherNeedCheck');
        var otherNeedText = document.getElementById('prayerOtherNeedText');
        otherNeedCheck.addEventListener('change', function() {
            otherNeedText.style.display = this.checked ? '' : 'none';
            if (!this.checked) otherNeedText.value = '';
        });

        // Fade the FAB out while the footer, or a card block it would otherwise sit on
        // top of (like the contact page's info cards), is in view.
        var footerEl = document.getElementById('site-footer');
        var obstructionEl = document.querySelector('.contact-cards');
        var fabNearFooter = false;
        var fabNearObstruction = false;
        function updateFabVisibility() {
            fab.classList.toggle('fab-near-footer', fabNearFooter || fabNearObstruction);
        }
        if (footerEl && 'IntersectionObserver' in window) {
            var footerObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    fabNearFooter = entry.isIntersecting;
                });
                updateFabVisibility();
            }, { threshold: 0 });
            footerObserver.observe(footerEl);
        }
        if (obstructionEl && 'IntersectionObserver' in window) {
            var obstructionObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    fabNearObstruction = entry.isIntersecting;
                });
                updateFabVisibility();
            }, { threshold: 0 });
            obstructionObserver.observe(obstructionEl);
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

            var careTypes = Array.prototype.slice.call(form.querySelectorAll('[name="careType"]:checked')).map(function(el) { return el.value; });

            fetch('/api/prayer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.querySelector('[name="name"]').value || 'Anonymous',
                    email: form.querySelector('[name="email"]').value,
                    phone: form.querySelector('[name="phone"]').value,
                    prayer: form.querySelector('[name="prayer"]').value,
                    careTypes: careTypes,
                    otherNeedText: form.querySelector('[name="otherNeedText"]').value || '',
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
                    btn.textContent = 'Submit Request';
                    btn.disabled = false;
                    try { turnstile.reset(form.querySelector('.cf-turnstile')); } catch (err) {}
                    siteAlert('Something went wrong. Please try again or email us directly.');
                }
            })
            .catch(function() {
                btn.textContent = 'Submit Request';
                btn.disabled = false;
                try { turnstile.reset(form.querySelector('.cf-turnstile')); } catch (err) {}
                siteAlert('Something went wrong. Please try again or email us directly.');
            });
        });
    });
})();

// Styled message box used instead of the browser's own alert(), so errors look like the rest of the site.
window.siteAlert = function (message) {
    var style = document.getElementById('site-dlg-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'site-dlg-style';
        style.textContent = '.site-dlg-backdrop{position:fixed;inset:0;background:rgba(30,37,71,.55);z-index:100000;display:flex;align-items:center;justify-content:center;padding:24px}' +
            '.site-dlg-box{background:#fff;border-radius:14px;max-width:420px;width:100%;box-shadow:0 24px 70px rgba(0,0,0,.35);overflow:hidden;font-family:inherit}' +
            '.site-dlg-head{padding:16px 22px;background:#303b6a;color:#fff;font-size:1rem;letter-spacing:.5px}' +
            '.site-dlg-body{padding:20px 22px;font-size:.9375rem;line-height:1.6;color:#333}' +
            '.site-dlg-foot{padding:0 22px 20px;display:flex;justify-content:flex-end}' +
            '.site-dlg-ok{background:#c3a355;color:#fff;border:0;border-radius:8px;padding:10px 26px;font:inherit;font-weight:bold;cursor:pointer}' +
            '.site-dlg-ok:focus-visible{outline:2px solid #303b6a;outline-offset:2px}';
        document.head.appendChild(style);
    }
    var last = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = 'site-dlg-backdrop';
    wrap.setAttribute('role', 'alertdialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'site-dlg-title');
    wrap.innerHTML = '<div class="site-dlg-box"><div class="site-dlg-head" id="site-dlg-title">Something went wrong</div><div class="site-dlg-body"></div><div class="site-dlg-foot"><button type="button" class="site-dlg-ok">OK</button></div></div>';
    wrap.querySelector('.site-dlg-body').textContent = message;
    function close() { wrap.remove(); if (last && last.focus) { try { last.focus(); } catch (e) {} } }
    wrap.querySelector('.site-dlg-ok').addEventListener('click', close);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.body.appendChild(wrap);
    wrap.querySelector('.site-dlg-ok').focus();
};
