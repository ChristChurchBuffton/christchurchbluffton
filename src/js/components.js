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
            });
    }

    // Load header + mobile menu handler
    loadComponent('site-header', 'includes/header.html', function() {
        var hamburger = document.getElementById('hamburger');
        var mobileMenu = document.getElementById('mobileMenu');
        var mobileOverlay = document.getElementById('mobileOverlay');
        var mobileClose = document.getElementById('mobileClose');

        if (!hamburger) return;

        function openMenu() {
            mobileMenu.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeMenu() {
            mobileMenu.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        hamburger.addEventListener('click', openMenu);
        mobileClose.addEventListener('click', closeMenu);
        mobileOverlay.addEventListener('click', closeMenu);

        // Close on Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) closeMenu();
        });

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
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var hp = form.querySelector('[name="website_url_confirm"]');
            if (hp && hp.value) return;

            var btn = form.querySelector('.btn-subscribe');
            btn.textContent = 'Sending...';
            btn.disabled = true;

            fetch('/api/stay-updated', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email.value })
            })
            .then(function(res) {
                if (res.ok) {
                    btn.textContent = 'Subscribed!';
                    form.email.value = '';
                    setTimeout(function() {
                        btn.textContent = 'Subscribe';
                        btn.disabled = false;
                    }, 3000);
                } else {
                    btn.textContent = 'Subscribe';
                    btn.disabled = false;
                    alert('Something went wrong. Please try again.');
                }
            })
            .catch(function() {
                btn.textContent = 'Subscribe';
                btn.disabled = false;
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

        function openPrayer() {
            popup.classList.add('active');
            overlay.classList.add('active');
        }
        function closePrayer() {
            popup.classList.remove('active');
            overlay.classList.remove('active');
        }

        fab.addEventListener('click', openPrayer);
        closeBtn.addEventListener('click', closePrayer);
        overlay.addEventListener('click', closePrayer);


        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var hp = form.querySelector('[name="website_url_confirm"]');
            if (hp && hp.value) return;

            var btn = form.querySelector('.prayer-submit-btn');
            btn.textContent = 'Sending...';
            btn.disabled = true;

            fetch('/api/prayer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.querySelector('[name="name"]').value || 'Anonymous',
                    prayer: form.querySelector('[name="prayer"]').value
                })
            })
            .then(function(res) {
                if (res.ok) {
                    document.getElementById('prayerFormBody').style.display = 'none';
                    document.getElementById('prayerSuccess').classList.add('active');
                } else {
                    btn.textContent = 'Submit Prayer';
                    btn.disabled = false;
                    alert('Something went wrong. Please try again or email us directly.');
                }
            })
            .catch(function() {
                btn.textContent = 'Submit Prayer';
                btn.disabled = false;
                alert('Something went wrong. Please try again or email us directly.');
            });
        });
    });
})();
