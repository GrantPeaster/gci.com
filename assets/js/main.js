/* ============================================================
   GEORGIA CIVIL — Shared site script
   Injects header + footer, runs hero carousel & mobile nav.
   ============================================================ */

const MONO = `<svg class="mono" viewBox="0 0 100 100" role="img" aria-label="Georgia Civil">
  <rect x="0" y="0" width="100" height="100" rx="1.5" fill="currentColor"/>
  <text x="49" y="53" text-anchor="middle" dominant-baseline="central"
    font-family="'Times New Roman',Times,serif" font-weight="700" font-size="80"
    letter-spacing="-7" fill="var(--mono-letter,#fff)">gc</text>
  <path d="M24 47 L24 60 L33.5 53.5 Z" fill="currentColor"/>
</svg>`;

const LINKEDIN = `<svg class="linkedin" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05C20.2 8.65 21 10.9 21 14v7h-4v-6.2c0-1.48-.03-3.4-2.07-3.4-2.07 0-2.39 1.62-2.39 3.29V21H9z"/>
</svg>`;

const NAV = [
  { id: 'about',            label: 'About GCI',        href: 'about.html' },
  { id: 'land-planning',    label: 'Land Planning',    href: 'land-planning.html' },
  { id: 'land-surveying',   label: 'Land Surveying',   href: 'land-surveying.html' },
  { id: 'civil-engineering',label: 'Civil Engineering',href: 'civil-engineering.html' },
  { id: 'project-spotlight',label: 'Project Spotlight', href: 'project-spotlight.html' },
  { id: 'contact',          label: 'Contact Us',       href: 'contact.html' },
];

function buildHeader(current) {
  const links = NAV.map(n =>
    `<a href="${n.href}"${n.id === current ? ' aria-current="page"' : ''}>${n.label}</a>`
  ).join('');
  return `
  <header class="header">
    <div class="wrap">
      <a class="brand-mark" href="index.html" aria-label="Georgia Civil home">
        <img class="brand-logo" src="assets/img/logo.png" alt="Georgia Civil" width="200" height="200">
      </a>
      <nav class="nav" id="primary-nav" aria-label="Primary">${links}</nav>
      <button class="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="primary-nav">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>`;
}

const CARD_LINKS = {
  'land-planning':     { href: 'card-land-planning.html',     label: 'Capability Card' },
  'land-surveying':    { href: 'card-land-surveying.html',    label: 'Capability Card' },
  'civil-engineering': { href: 'card-civil-engineering.html', label: 'Capability Card' },
};

// Related services per page — excludes current page
const RELATED = {
  'land-planning':     [{ label: 'Land Surveying', href: 'land-surveying.html' }, { label: 'Civil Engineering', href: 'civil-engineering.html' }],
  'land-surveying':    [{ label: 'Land Planning',  href: 'land-planning.html'  }, { label: 'Civil Engineering', href: 'civil-engineering.html' }],
  'civil-engineering': [{ label: 'Land Planning',  href: 'land-planning.html'  }, { label: 'Land Surveying',   href: 'land-surveying.html'   }],
};

function buildFooter(current) {
  const card = CARD_LINKS[current];
  const cardLink = card
    ? `<a href="${card.href}" style="font-family:var(--utility);text-transform:uppercase;letter-spacing:.139em;font-size:.72rem;color:#fff">${card.label} &rarr;</a>`
    : '';

  // Related services row — only on discipline pages
  const related = RELATED[current];
  const relatedRow = related ? `
      <div class="f-related">
        <span class="f-related-label">Related Services</span>
        ${related.map(r => `<a href="${r.href}">${r.label}</a>`).join('')}
      </div>` : '';

  return `
  <footer class="footer">
    <div class="wrap">
      <a href="index.html" class="footer-logo" aria-label="Georgia Civil home"><img src="assets/img/logo.png" alt="Georgia Civil" width="200" height="200"></a>
      <div class="f-right">
        ${cardLink}
        <a href="documents.html" style="font-family:var(--utility);text-transform:uppercase;letter-spacing:.139em;font-size:.72rem;color:#fff">Registrations &amp; Documents</a>
        <a href="contact.html" style="font-family:var(--utility);text-transform:uppercase;letter-spacing:.139em;font-size:.72rem;color:#fff">Contact Us</a>
        <a href="https://www.linkedin.com/company/georgia-civil-inc-/" target="_blank" rel="noopener" aria-label="GCI on LinkedIn">${LINKEDIN}</a>
      </div>
      ${relatedRow}
      <div class="legal">
        <span>&copy; ${new Date().getFullYear()} Georgia Civil, Inc. &middot; Civil Engineering &middot; Land Planning &middot; Land Surveying &middot; Madison, GA</span>
        <span>Built on Better Planning.</span>
      </div>
    </div>
  </footer>`;
}

function mountChrome() {
  const current = document.body.getAttribute('data-page') || '';
  const h = document.querySelector('[data-header]');
  const f = document.querySelector('[data-footer]');
  if (h) h.outerHTML = buildHeader(current);
  if (f) f.outerHTML = buildFooter(current);

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
}

function heroCarousel() {
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const nameEl = document.querySelector('.hero-project');
  if (slides.length < 2) return;
  let i = 0;
  const show = (n) => {
    slides.forEach((s, k) => s.classList.toggle('active', k === n));
    if (nameEl) nameEl.textContent = slides[n].dataset.project || '';
  };
  show(0);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  setInterval(() => { i = (i + 1) % slides.length; show(i); }, 5000);
}

function formHandler() {
  const forms = document.querySelectorAll('form[data-contact]');
  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const clearErr = () => { const x = form.querySelector('.err'); if (x) x.remove(); };
      const showErr = (el, msg) => {
        clearErr();
        const p = document.createElement('p'); p.className = 'err'; p.textContent = msg;
        (el ? el.parentElement : form).appendChild(p); if (el) el.focus();
      };
      const email = form.querySelector('[type=email]');
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
        return showErr(email, 'Enter a valid email address so we can reply.');
      }
      const fileInput = form.querySelector('input[type=file]');
      if (fileInput && fileInput.files.length) {
        const f = fileInput.files[0];
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (!['pdf', 'doc', 'docx'].includes(ext)) {
          return showErr(fileInput, 'Please attach a PDF or Word document (.pdf, .doc, .docx).');
        }
        if (f.size > 5 * 1024 * 1024) {
          return showErr(fileInput, 'Please keep the résumé under 5 MB.');
        }
      }
      clearErr();
      const btn = form.querySelector('button[type=submit]');
      const label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      try {
        const hasFile = !!form.querySelector('input[type=file]');
        let res;
        if (hasFile) {
          res = await fetch(form.action, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: new FormData(form),
          });
        } else {
          const data = Object.fromEntries(new FormData(form).entries());
          res = await fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
          });
        }
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.success) {
          form.innerHTML = '<p class="form-note" style="font-size:1rem">Thanks — your message has been sent. We\u2019ll be in touch shortly.</p>';
        } else {
          throw new Error(out.message || 'Submission failed');
        }
      } catch (err) {
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
        showErr(null, 'Something went wrong sending your message. Please try again, or email us directly.');
      }
    });
  });
}

function flipCardsOnScroll() {
  const cards = Array.from(document.querySelectorAll('.flip'));
  if (!cards.length) return;
  const isMobile = () => window.matchMedia('(max-width: 860px)').matches;
  const noHover = () => window.matchMedia('(hover: none)').matches;
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let observer = null;
  const teardown = () => {
    if (observer) { observer.disconnect(); observer = null; }
    cards.forEach(c => c.querySelector('.flip-inner')?.classList.remove('is-flipped'));
  };
  const setup = () => {
    if (observer) return;
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const inner = entry.target.querySelector('.flip-inner');
        if (!inner) return;
        inner.classList.toggle('is-flipped', entry.isIntersecting);
      });
    }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });
    cards.forEach(c => observer.observe(c));
  };
  const evaluate = () => {
    if (isMobile() && noHover() && !reduceMotion()) setup();
    else teardown();
  };
  evaluate();
  window.addEventListener('resize', evaluate);
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', evaluate);
}

document.addEventListener('DOMContentLoaded', () => {
  mountChrome();
  heroCarousel();
  formHandler();
  flipCardsOnScroll();
});

/* ── Hero slide dots ── */
(function () {
  const slides   = document.querySelectorAll('.hero-slide');
  const dotsWrap = document.getElementById('hero-dots');
  if (!slides.length || !dotsWrap) return;
  const dots = Array.from(slides).map((_, i) => {
    const d = document.createElement('button');
    d.className = 'hero-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    d.addEventListener('click', () => goToSlide(i));
    dotsWrap.appendChild(d);
    return d;
  });
  function syncDots() {
    slides.forEach((slide, i) => {
      dots[i].classList.toggle('active', slide.classList.contains('active'));
    });
  }
  const obs = new MutationObserver(syncDots);
  slides.forEach(slide => obs.observe(slide, { attributes: true, attributeFilter: ['class'] }));
  function goToSlide(index) {
    const projectLabel = document.querySelector('.hero-project');
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('active', active);
      if (active && projectLabel) projectLabel.textContent = slide.dataset.project || '';
    });
    syncDots();
  }
})();
