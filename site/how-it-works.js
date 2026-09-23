/* FinStarter — How it works: feature switcher + roadmap draw-in */

// "What's already built for you": side menu drives the title, description and screenshot.
(function () {
  var nav = document.querySelector('.built__nav');
  var content = document.querySelector('.built__content');
  if (!nav || !content) return;
  var titleEl = document.getElementById('built-title');
  var descEl = document.getElementById('built-desc');
  var imgEl = document.getElementById('built-img');

  // Copy for each feature. Only "Client portal" comes from the mock; the rest is draft copy — edit freely.
  var FEATURES = {
    'client-portal': {
      title: 'Client portal',
      desc: 'Every company that manages client investments needs the same underlying layer.<br>In FinStarter it is already built, tested, and compliant. What you receive is a finished, working foundation — not a toolkit and not a project to manage.',
      img: 'assets/hiw-oe.png'
    },
    'lifecycle': {
      title: 'Customer and lifecycle management',
      desc: 'Onboarding, KYC and every step of the client relationship in one place — from first contact to closed account. Statuses, documents and communications stay attached to the client, so nothing lives in a spreadsheet.',
      img: 'assets/feature-1.png'
    },
    'portfolio': {
      title: 'Portfolio management',
      desc: 'Positions, cash, transactions and performance across every client account, reconciled daily. Rebalancing, corporate actions and fee calculations run as workflows, not as manual jobs.',
      img: 'assets/feature-2.png'
    },
    'model': {
      title: 'Model portfolio engine',
      desc: 'Build model portfolios with versioning and drift rules, assign them to client segments and roll changes out in one operation. Every version is kept, so you can always show what a client held and why.',
      img: 'assets/feature-3.png'
    },
    'ai': {
      title: 'AI strategy validation',
      desc: 'Back-test strategies against historical data before they reach a single client. Risk, drawdown and turnover are estimated up front, and the result is stored with the model for audit.',
      img: 'assets/feature-4.png'
    },
    'analytics': {
      title: 'Analytics',
      desc: 'Performance, risk and attribution for the firm, a manager or a single client — on the same data your operations run on. No exports, no reconciliation between tools.',
      img: 'assets/feature-4.png'
    },
    'reporting': {
      title: 'Reporting',
      desc: 'Client statements, regulatory reports and internal dashboards from one reporting layer. Branded, scheduled and delivered automatically.',
      img: 'assets/feature-2.png'
    },
    'audit': {
      title: 'Audit trail',
      desc: 'Every change to a client, a portfolio or a model is recorded with who, when and what — immutable and searchable. Regulators get answers in minutes, not weeks.',
      img: 'assets/feature-1.png'
    },
    'governance': {
      title: 'Governance',
      desc: 'Role-based access, four-eyes approvals and configurable policies enforce how your firm works — structurally, not as a layer you bolt on later.',
      img: 'assets/feature-3.png'
    }
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 'client-portal', timer = null;

  // preload screenshots so the switch is instant
  Object.keys(FEATURES).forEach(function (k) { var i = new Image(); i.src = FEATURES[k].img; });

  function apply(key) {
    var f = FEATURES[key];
    titleEl.textContent = f.title;
    descEl.innerHTML = f.desc;
    if (imgEl.getAttribute('src') !== f.img) imgEl.setAttribute('src', f.img);
  }

  function select(key, btn) {
    if (!FEATURES[key] || key === current) return;
    current = key;
    Array.prototype.forEach.call(nav.querySelectorAll('.built__item'), function (b) {
      var on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (reduced) { apply(key); return; }
    clearTimeout(timer);
    content.classList.add('is-switching');
    timer = setTimeout(function () {
      apply(key);
      setTimeout(function () { content.classList.remove('is-switching'); }, 30);
    }, 220);
  }

  nav.addEventListener('click', function (e) {
    var btn = e.target.closest('.built__item');
    if (btn) select(btn.getAttribute('data-feature'), btn);
  });
})();

// Roadmap: the line draws from top to bottom and each milestone lights up as it is reached.
(function () {
  var rm = document.getElementById('roadmap');
  if (!rm) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  rm.classList.add('rm--armed');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { rm.classList.add('rm--in'); io.disconnect(); }
    });
  }, { threshold: 0.2 });
  io.observe(rm);
})();
