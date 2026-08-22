const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'index (1).html');
const source = fs.readFileSync(sourcePath, 'utf8');

function between(start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error(`Missing block: ${start}`);
  return source.slice(a, b);
}

function fromTo(start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error(`Missing range: ${start}`);
  return source.slice(a, b + end.length);
}

function section(comment, nextComment) {
  return between(comment, nextComment);
}

const docStart = source.slice(0, source.indexOf('<body'));
const bodyOpen = '<body data-page="{{page}}">';
const shellStart = source.slice(source.indexOf('<body>') + '<body>'.length, source.indexOf('  <!-- HERO -->'));
const footerToScript = fromTo('  <!-- FOOTER -->', '  <script>');
const footerShell = footerToScript.slice(0, footerToScript.lastIndexOf('  <script>'));
const script = source.slice(source.lastIndexOf('  <script>'));

const extraCss = `

    /* ---------- separate pages ---------- */
    .page-hero {
      min-height: 92vh;
      display: flex;
      align-items: flex-end;
      padding-top: 150px;
      padding-bottom: 72px;
      overflow: hidden;
      background: #f8f8f3;
    }

    .page-hero .wrap {
      width: 100%;
      display: grid;
      grid-template-columns: .95fr 1.05fr;
      gap: clamp(34px, 7vw, 110px);
      align-items: end;
    }

    .page-kicker {
      margin-bottom: 28px;
    }

    .page-hero h1 {
      font-family: 'Fraunces', serif;
      font-weight: 300;
      font-size: clamp(58px, 9vw, 154px);
      line-height: .86;
      letter-spacing: -.03em;
      margin-bottom: 26px;
    }

    .page-hero h1 em {
      color: var(--cyan-deep);
      font-style: italic;
    }

    .page-hero p {
      color: var(--ink-soft);
      max-width: 530px;
      font-size: 15.5px;
      line-height: 1.75;
    }

    .page-visual {
      position: relative;
      min-height: min(62vh, 610px);
      border-radius: 34px;
      overflow: hidden;
      background: var(--ink);
      isolation: isolate;
      box-shadow: 0 34px 100px rgba(17, 17, 17, .13);
    }

    .page-visual img {
      width: 100%;
      height: 100%;
      min-height: inherit;
      object-fit: cover;
      transform: scale(1.08);
      transition: transform 1.2s var(--ease), filter 1.2s var(--ease);
    }

    .page-visual:hover img {
      transform: scale(1.14);
      filter: saturate(1.08) contrast(1.04);
    }

    .page-visual::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(180deg, transparent 38%, rgba(0,0,0,.58)),
        radial-gradient(circle at 22% 18%, rgba(74,255,252,.28), transparent 26%);
      z-index: 1;
      pointer-events: none;
    }

    .page-floating-note {
      position: absolute;
      left: 26px;
      right: 26px;
      bottom: 26px;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 18px;
      color: #fff;
    }

    .page-floating-note b {
      display: block;
      font-family: 'Fraunces', serif;
      font-size: clamp(30px, 4vw, 56px);
      font-weight: 400;
      font-style: italic;
      color: var(--cyan);
      line-height: .9;
    }

    .page-floating-note span {
      max-width: 260px;
      color: rgba(255,255,255,.72);
      font-size: 12px;
      line-height: 1.55;
      text-align: right;
    }

    .page-stat-strip {
      padding: 44px 6vw;
      border-top: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
      background: #fff;
    }

    .page-stat-strip .wrap {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 22px;
    }

    .page-stat {
      border-left: 1px solid var(--line);
      padding-left: 22px;
    }

    .page-stat b {
      display: block;
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-weight: 400;
      font-size: clamp(28px, 3vw, 46px);
      color: var(--ink);
    }

    .page-stat span {
      display: block;
      margin-top: 6px;
      color: var(--ink-soft);
      font-size: 12.5px;
      line-height: 1.5;
    }

    .page-feature-grid {
      padding-top: 0;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .feature-card {
      min-height: 260px;
      border: 1px solid var(--line);
      border-radius: var(--r-md);
      padding: 30px;
      background: rgba(255,255,255,.74);
      position: relative;
      overflow: hidden;
      transition: transform .55s var(--ease), box-shadow .55s var(--ease), border-color .55s var(--ease);
    }

    .feature-card::before {
      content: '';
      position: absolute;
      left: 30px;
      right: 30px;
      top: 30px;
      height: 1px;
      background: var(--cyan-deep);
      transform: scaleX(.24);
      transform-origin: left;
      transition: transform .55s var(--ease);
    }

    .feature-card:hover {
      transform: translateY(-8px);
      border-color: rgba(15,216,212,.55);
      box-shadow: 0 30px 70px rgba(17,17,17,.08);
    }

    .feature-card:hover::before {
      transform: scaleX(1);
    }

    .feature-card h3 {
      font-family: 'Fraunces', serif;
      font-weight: 400;
      font-size: 28px;
      margin-top: 44px;
      margin-bottom: 18px;
    }

    .feature-card p {
      color: var(--ink-soft);
      font-size: 14px;
      line-height: 1.7;
    }

    .page-cta {
      background: var(--ink);
      color: #fff;
      overflow: hidden;
    }

    .page-cta::before {
      content: '';
      position: absolute;
      inset: -40% -10% auto;
      height: 80%;
      background: radial-gradient(circle, rgba(74,255,252,.16), transparent 60%);
      pointer-events: none;
    }

    .page-cta .wrap {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .page-cta h2 {
      font-family: 'Fraunces', serif;
      font-weight: 400;
      font-size: clamp(36px, 5vw, 76px);
      line-height: .98;
      max-width: 720px;
    }

    .page-cta h2 em {
      color: var(--cyan);
      font-style: italic;
    }

    @media(max-width:980px) {
      .page-hero .wrap,
      .feature-grid {
        grid-template-columns: 1fr;
      }

      .page-stat-strip .wrap {
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }

      .page-hero {
        min-height: auto;
        padding-bottom: 56px;
      }

      .page-visual {
        min-height: 380px;
      }

      .page-cta .wrap {
        align-items: flex-start;
        flex-direction: column;
      }
    }

    @media(max-width:640px) {
      .page-hero {
        padding-top: 104px;
      }

      .page-hero h1 {
        font-size: clamp(40px, 14vw, 70px);
      }

      .page-visual {
        min-height: 340px;
        border-radius: 22px;
      }

      .page-floating-note {
        align-items: flex-start;
        flex-direction: column;
      }

      .page-floating-note span {
        text-align: left;
      }
    }
`;

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function pageHero(page) {
  const data = {
    services: {
      eyebrow: 'Services',
      title: 'One studio for every <em>discipline.</em>',
      copy: 'Architecture, interiors, construction, landscape and consultancy stay connected from the first measured drawing to handover.',
      img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1500&q=75',
      metric: '07',
      note: 'disciplines coordinated by one accountable studio team.'
    },
    portfolio: {
      eyebrow: 'Portfolio',
      title: 'Built work with a <em>point of view.</em>',
      copy: 'Explore residential, commercial, hospitality, interior and landscape projects with quick filtering and tactile hover details.',
      img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1500&q=75',
      metric: '42+',
      note: 'projects shaped across India since 2011.'
    },
    about: {
      eyebrow: 'About',
      title: 'A studio built around <em>accountability.</em>',
      copy: 'The people who design the building stay close to the site, the budget and the client until the final handover.',
      img: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1500&q=75',
      metric: '2011',
      note: 'founded to keep design and delivery under one roof.'
    },
    pricing: {
      eyebrow: 'Pricing',
      title: 'Clear engagement for each <em>journey.</em>',
      copy: 'Choose a project tier based on scale and delivery needs, then refine scope with the studio before work begins.',
      img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1500&q=75',
      metric: '3',
      note: 'engagement paths from focused homes to large masterplans.'
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Visit the studio or start a <em>brief.</em>',
      copy: 'Find us at Municipality Market Complex, Balasore, or send the first project note and we will respond with next steps.',
      img: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1500&q=75',
      metric: '9:15',
      note: 'am opening time from Monday to Saturday.'
    }
  }[page];

  return `  <!-- PAGE HERO -->
  <section class="hero page-hero" id="${page}-intro">
    <div class="wrap">
      <div>
        <div class="eyebrow page-kicker reveal">${data.eyebrow}</div>
        <h1 class="reveal">${data.title}</h1>
        <p class="reveal">${data.copy}</p>
      </div>
      <div class="page-visual reveal hoverable">
        <img src="${data.img}" alt="ALCONS ${data.eyebrow.toLowerCase()} page visual">
        <div class="page-floating-note"><b>${data.metric}</b><span>${data.note}</span></div>
      </div>
    </div>
  </section>`;
}

function statStrip(stats) {
  return `  <section class="page-stat-strip">
    <div class="wrap">
${stats.map(item => `      <div class="page-stat reveal"><b>${item[0]}</b><span>${item[1]}</span></div>`).join('\n')}
    </div>
  </section>`;
}

function featureGrid(items) {
  return `  <section class="page-feature-grid">
    <div class="wrap feature-grid">
${items.map(item => `      <div class="feature-card reveal hoverable"><h3>${item[0]}</h3><p>${item[1]}</p></div>`).join('\n')}
    </div>
  </section>`;
}

function cta(copy) {
  return `  <section class="page-cta">
    <div class="wrap">
      <h2>${copy}</h2>
      <a href="contact.html" class="btn solid hoverable">Book Consultation <span class="arrow"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h12M9 3l5 5-5 5"/></svg></span></a>
    </div>
  </section>`;
}

const sections = {
  services: section('  <!-- SERVICES -->', '  <!-- PORTFOLIO -->'),
  portfolio: section('  <!-- PORTFOLIO -->', '  <!-- TESTIMONIALS -->'),
  testimonials: section('  <!-- TESTIMONIALS -->', '  <!-- ABOUT -->'),
  about: section('  <!-- ABOUT -->', '  <!-- PRICING -->'),
  pricing: section('  <!-- PRICING -->', '  <!-- CONTACT -->'),
  contact: section('  <!-- CONTACT -->', '  <!-- FOOTER -->')
};

const pageBodies = {
  services: [
    pageHero('services'),
    statStrip([['07', 'studio disciplines'], ['01', 'single accountable team'], ['Weekly', 'site reporting cadence'], ['365', 'days aftercare']]),
    sections.services,
    featureGrid([
      ['Brief to Build', 'Design decisions are checked against cost, procurement and site reality before they become promises.'],
      ['Site-Led Feedback', 'Material samples, progress images and issue logs keep the owner close to the build without noise.'],
      ['Quiet Coordination', 'Architects, vendors, contractors and supervisors work from one shared chain of responsibility.']
    ]),
    cta('Have a site ready? Let us shape the <em>next move.</em>')
  ].join('\n\n'),
  portfolio: [
    pageHero('portfolio'),
    statStrip([['5', 'project categories'], ['42+', 'completed projects'], ['4%', 'average timeline overrun'], ['100%', 'filtered browsing']]),
    sections.portfolio,
    sections.testimonials,
    cta('See something close to your ambition? Start a <em>brief.</em>')
  ].join('\n\n'),
  about: [
    pageHero('about'),
    statStrip([['2011', 'studio founded'], ['5', 'core leadership roles'], ['1', 'design-build chain'], ['East', 'India delivery focus']]),
    sections.about,
    sections.testimonials,
    featureGrid([
      ['Principal Attention', 'Every commission stays close to senior review, especially when budget, site or programme pressure rises.'],
      ['Measured Restraint', 'The studio favors durable form, clean detailing and material choices that age without shouting.'],
      ['On-Site Memory', 'Lessons from previous builds stay inside the same team instead of disappearing between vendors.']
    ]),
    cta('Meet the team and begin with a <em>real conversation.</em>')
  ].join('\n\n'),
  pricing: [
    pageHero('pricing'),
    statStrip([['3', 'engagement tiers'], ['Fixed', 'fee options'], ['Weekly', 'supervision available'], ['Custom', 'enterprise scope']]),
    sections.pricing,
    featureGrid([
      ['Transparent Scoping', 'The first proposal names deliverables, responsibilities and review cadence before the contract begins.'],
      ['Scale Matched', 'Small homes, commercial fit-outs and masterplans are priced around different risk profiles.'],
      ['No Hidden Handoffs', 'The same delivery philosophy remains in place whether the fee is fixed, percentage based or custom.']
    ]),
    cta('Need the right scope first? Book a <em>consultation.</em>')
  ].join('\n\n'),
  contact: [
    pageHero('contact'),
    statStrip([['Balasore', 'studio location'], ['Mon-Sat', 'open for visits'], ['9:15-8', 'office hours'], ['1 day', 'response target']]),
    sections.contact,
    cta('Bring the site, the ambition and the constraints. We will bring the <em>method.</em>')
  ].join('\n\n')
};

function buildPage(page, body) {
  let html = docStart
    .replace(/<title>[\s\S]*?<\/title>/, `<title>ALCONS ${titleCase(page)} — Architecture, Engineered for Light</title>`)
    .replace('</style>', `${extraCss}\n  </style>`);
  html += bodyOpen.replace('{{page}}', page);
  html += shellStart;
  html += body;
  html += '\n\n';
  html += footerShell;
  html += script;
  return html;
}

for (const [page, body] of Object.entries(pageBodies)) {
  fs.writeFileSync(path.join(root, `${page}.html`), buildPage(page, body));
}

const homepage = fs.readFileSync(sourcePath, 'utf8');
fs.writeFileSync(path.join(root, 'index.html'), homepage);
