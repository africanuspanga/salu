const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- header: solid once the page scrolls ----------
const header = document.querySelector('.site-header');
const onScroll = () => {
  if (header) header.classList.toggle('scrolled', window.scrollY > 24);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ---------- mobile menu ----------
const menuBtn = document.querySelector('.menu-btn');
const nav = document.getElementById('nav');
if (menuBtn && nav) {
  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('span').textContent = open ? 'Close' : 'Menu';
  };
  menuBtn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); menuBtn.focus(); }
  });
}

// ---------- scroll reveal ----------
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// ---------- hero film + sector index ----------
const hero = document.querySelector('.hero');
const video = hero && hero.querySelector('.hero-video');
if (video) {
  const items = [...hero.querySelectorAll('.reel-item')];
  const segs = items.map((el) => ({ el, start: +el.dataset.start, end: +el.dataset.end, bar: el.querySelector('.bar i') }));
  const toggle = hero.querySelector('.reel-toggle');
  const saveData = navigator.connection && navigator.connection.saveData;
  let userPaused = false;
  let loaded = false;

  const pickSource = () => {
    const px = Math.max(window.innerWidth, window.innerHeight) * Math.min(window.devicePixelRatio || 1, 2);
    return px > 1500 ? video.dataset.srcHd : video.dataset.srcSd;
  };
  const load = () => {
    if (loaded) return;
    loaded = true;
    video.src = pickSource();
    video.load();
  };
  const setPaused = (paused) => {
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
  };
  const play = () => { load(); const p = video.play(); if (p) p.catch(() => setPaused(true)); };

  // light the sector currently on screen and fill its progress bar
  const paint = () => {
    const t = video.currentTime || 0;
    segs.forEach((s, i) => {
      const inSeg = t >= s.start && t < s.end;
      const active = inSeg || (i === 0 && t >= segs[segs.length - 1].end); // loop tail shows the first shot again
      s.el.classList.toggle('is-active', active);
      s.el.setAttribute('aria-current', active ? 'true' : 'false');
      const p = inSeg ? (t - s.start) / (s.end - s.start) : 0;
      s.bar.style.setProperty('--p', p.toFixed(3));
    });
  };
  let raf = 0;
  const loop = () => { paint(); raf = requestAnimationFrame(loop); };
  video.addEventListener('play', () => { cancelAnimationFrame(raf); loop(); setPaused(false); });
  video.addEventListener('pause', () => { cancelAnimationFrame(raf); paint(); });
  video.addEventListener('seeked', paint);

  items.forEach((el, i) => el.addEventListener('click', () => {
    load();
    const seek = () => { video.currentTime = segs[i].start + 0.01; paint(); };
    if (video.readyState >= 1) seek(); else video.addEventListener('loadedmetadata', seek, { once: true });
    if (!userPaused && !reduceMotion.matches) play();
  }));

  toggle.addEventListener('click', () => {
    if (video.paused) { userPaused = false; play(); }
    else { userPaused = true; video.pause(); setPaused(true); }
  });

  if (reduceMotion.matches || saveData) {
    setPaused(true);
    segs[0].el.classList.add('is-active');
  } else {
    play();
    // pause while scrolled away, resume on return (unless the visitor paused it)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (userPaused) return;
        if (e.isIntersecting) play(); else video.pause();
      }, { threshold: 0.15 }).observe(hero);
    }
  }
}

// ---------- capability console: tabs on wide screens, stacked cards on small ----------
document.querySelectorAll('[data-console]').forEach((root) => {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const wide = window.matchMedia('(min-width: 961px)');
  const select = (i, focus) => {
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(i === j));
      t.tabIndex = i === j ? 0 : -1;
      panels[j].classList.toggle('active', i === j);
    });
    if (focus) tabs[i].focus();
  };
  const apply = () => {
    root.classList.toggle('is-tabs', wide.matches);
    panels.forEach((p) => {
      if (wide.matches) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', p.id.replace('cap-', 'tab-')); }
      else { p.removeAttribute('role'); p.removeAttribute('aria-labelledby'); }
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); select((i + k + tabs.length) % tabs.length, true); }
      if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
    });
  });
  apply();
  wide.addEventListener('change', apply);
});

// ---------- services page: highlight the section in view ----------
const svcLinks = [...document.querySelectorAll('.svc-nav a')];
if (svcLinks.length && 'IntersectionObserver' in window) {
  const byId = new Map(svcLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      svcLinks.forEach((a) => a.classList.remove('active'));
      const a = byId.get(e.target.id);
      if (!a) return;
      a.classList.add('active');
      // Scroll only the tab strip sideways. scrollIntoView() here also touched the page scroll,
      // which cancelled the visitor's swipe on iOS Safari and some Android browsers.
      const strip = a.closest('ul');
      const left = a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2;
      if (Math.abs(strip.scrollLeft - left) > 2) strip.scrollTo({ left, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  byId.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
}

// ---------- footer year ----------
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

// ---------- project form: posts to /api/contact, which emails sales@salu.co.tz ----------
const form = document.getElementById('quote-form');
if (form) {
  const status = document.getElementById('form-status');
  const btn = form.querySelector('button[type="submit"]');
  const say = (msg, kind) => { status.textContent = msg; status.dataset.state = kind || ''; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    btn.disabled = true;
    say('Sending your request…', 'busy');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || 'send failed');
      form.reset();
      say('Thank you. Your request has reached our sales team and we will get back to you shortly.', 'ok');
    } catch (err) {
      say('Sorry, your request could not be sent. Please email sales@salu.co.tz or call +255 785 670 976.', 'error');
    } finally {
      btn.disabled = false;
    }
  });
}
