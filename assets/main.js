:root {
  --green: #173f35;
  --green-2: #24584a;
  --green-3: #e8efea;
  --gold: #c6a45a;
  --gold-light: #e8d7a8;
  --ivory: #f8f5ed;
  --paper: #fffdf8;
  --ink: #222923;
  --muted: #69736c;
  --line: #e5e2d8;
  --shadow: 0 16px 42px rgba(23,63,53,.09);
  --radius: 18px;
  --serif: Georgia, "Times New Roman", serif;
  --sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--sans); line-height: 1.65; }
img { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font: inherit; }
button, a { -webkit-tap-highlight-color: transparent; }
.container { width: min(1160px, calc(100% - 40px)); margin-inline: auto; }
.skip-link { position:absolute; left:-9999px; top:auto; }
.skip-link:focus { left:1rem; top:1rem; z-index:1000; padding:1rem; background:white; }
.topbar { background: var(--green); color:#f8f5ed; font-size:.82rem; }
.topbar-inner { display:flex; justify-content:space-between; gap:1rem; padding:.55rem 0; }
.topbar a { color:var(--gold-light); }
.site-header { position:sticky; top:0; z-index:50; background:rgba(255,253,248,.96); backdrop-filter: blur(14px); border-bottom:1px solid rgba(229,226,216,.85); }
.header-inner { display:flex; align-items:center; justify-content:space-between; gap:1.5rem; min-height:82px; }
.brand img { width:300px; height:auto; }
.nav { display:flex; align-items:center; gap:1.2rem; font-size:.91rem; color:#3c4941; }
.nav a { padding:.55rem 0; transition:color .2s; }
.nav a:hover, .nav a[aria-current="page"] { color:var(--green); }
.nav .nav-cta { padding:.72rem 1rem; background:var(--green); color:white; border-radius:999px; }
.menu-toggle { display:none; border:1px solid var(--line); background:white; border-radius:10px; padding:.55rem .75rem; color:var(--green); }
.hero { position:relative; overflow:hidden; color:white; background:var(--green); }
.hero::before { content:""; position:absolute; inset:0; background:linear-gradient(90deg,rgba(11,38,31,.89) 0%,rgba(11,38,31,.68) 48%,rgba(11,38,31,.12) 100%); z-index:1; }
.hero-image { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.hero-content { position:relative; z-index:2; max-width:720px; padding:clamp(5rem,10vw,9rem) 0 clamp(5rem,8vw,7rem); }
.eyebrow { display:inline-flex; align-items:center; gap:.65rem; color:var(--gold-light); text-transform:uppercase; letter-spacing:.16em; font-size:.75rem; font-weight:700; }
.eyebrow::before { content:""; width:28px; height:1px; background:var(--gold); }
h1,h2,h3 { line-height:1.16; margin:0 0 1rem; }
h1,h2 { font-family:var(--serif); font-weight:500; letter-spacing:-.025em; }
h1 { font-size:clamp(2.7rem,6.2vw,5.25rem); max-width:850px; }
h2 { font-size:clamp(2rem,4vw,3.15rem); color:var(--green); }
h3 { font-size:1.18rem; color:var(--green); }
p { margin:.3rem 0 1rem; }
.hero p { max-width:610px; color:rgba(255,255,255,.86); font-size:clamp(1rem,1.7vw,1.16rem); }
.actions { display:flex; flex-wrap:wrap; gap:.8rem; margin-top:1.7rem; }
.btn { display:inline-flex; justify-content:center; align-items:center; gap:.5rem; padding:.9rem 1.25rem; border:1px solid transparent; border-radius:999px; font-weight:700; font-size:.93rem; cursor:pointer; transition:transform .2s, box-shadow .2s, background .2s; }
.btn:hover { transform:translateY(-2px); }
.btn-primary { background:var(--gold); color:#1c3027; }
.btn-primary:hover { background:#d8b96f; }
.btn-light { background:#fffdf8; color:var(--green); }
.btn-outline { border-color:rgba(255,255,255,.65); color:white; background:transparent; }
.btn-outline-dark { border-color:#cbd4cd; color:var(--green); background:transparent; }
.section { padding:clamp(3.5rem,7vw,6rem) 0; }
.section-soft { background:var(--ivory); }
.section-dark { background:var(--green); color:white; }
.section-dark h2 { color:white; }
.section-heading { display:flex; justify-content:space-between; align-items:end; gap:2rem; margin-bottom:2rem; }
.section-heading > div { max-width:680px; }
.section-heading p { color:var(--muted); max-width:600px; }
.section-dark .section-heading p { color:rgba(255,255,255,.72); }
.kicker { color:#9a7738; font-size:.77rem; text-transform:uppercase; letter-spacing:.15em; font-weight:800; margin-bottom:.8rem; }
.grid { display:grid; gap:1.25rem; }
.grid-3 { grid-template-columns:repeat(3,minmax(0,1fr)); }
.grid-4 { grid-template-columns:repeat(4,minmax(0,1fr)); }
.card { background:white; border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; box-shadow:0 4px 18px rgba(23,63,53,.025); transition:transform .2s,box-shadow .2s; }
.card:hover { transform:translateY(-4px); box-shadow:var(--shadow); }
.card-image { width:100%; aspect-ratio: 4 / 3; object-fit:cover; background:var(--green-3); }
.card-body { padding:1.25rem; }
.card-meta { color:#8c6d34; text-transform:uppercase; letter-spacing:.1em; font-size:.72rem; font-weight:800; }
.card h3 { margin:.55rem 0 .6rem; }
.card p { color:var(--muted); font-size:.93rem; }
.card-link { display:inline-flex; gap:.4rem; color:var(--green); font-weight:800; font-size:.9rem; margin-top:.35rem; }
.card-link span { color:#a9853d; }
.feature-band { display:grid; grid-template-columns:1fr 1fr; gap:3rem; align-items:center; }
.feature-image { width:100%; aspect-ratio:4/3; object-fit:cover; border-radius:var(--radius); box-shadow:var(--shadow); }
.check-list { list-style:none; padding:0; margin:1.2rem 0; display:grid; gap:.75rem; }
.check-list li { display:flex; gap:.7rem; align-items:flex-start; }
.check-list li::before { content:"✓"; display:grid; place-items:center; flex:0 0 24px; height:24px; border-radius:50%; background:#e6eee8; color:var(--green); font-size:.8rem; font-weight:900; margin-top:.1rem; }
.trust-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-top:2rem; }
.trust-item { padding:1.2rem; border:1px solid rgba(255,255,255,.18); border-radius:14px; }
.trust-item strong { display:block; color:var(--gold-light); font-family:var(--serif); font-size:1.45rem; font-weight:500; margin-bottom:.3rem; }
.trust-item span { color:rgba(255,255,255,.75); font-size:.88rem; }
.page-hero { padding:clamp(3.5rem,7vw,6rem) 0; background:var(--ivory); border-bottom:1px solid var(--line); }
.page-hero .container { max-width:1160px; }
.page-hero h1 { font-size:clamp(2.5rem,5vw,4rem); color:var(--green); max-width:850px; }
.page-hero p { max-width:720px; color:var(--muted); font-size:1.08rem; }
.breadcrumb { font-size:.82rem; color:var(--muted); margin-bottom:1.25rem; }
.breadcrumb a { color:var(--green); }
.package-price { color:var(--green); font-weight:800; font-size:.95rem; }
.note { border-left:3px solid var(--gold); background:#f7f3e8; padding:1rem 1.15rem; border-radius:0 12px 12px 0; color:#4b544e; font-size:.92rem; }
.form-card { background:white; padding:clamp(1.25rem,3vw,2rem); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow); }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.field { display:grid; gap:.42rem; }
.field-full { grid-column:1 / -1; }
label { font-size:.88rem; font-weight:700; color:#35463c; }
input,select,textarea { width:100%; border:1px solid #d8ded7; background:#fffefa; border-radius:10px; padding:.85rem .9rem; color:var(--ink); }
input:focus,select:focus,textarea:focus { outline:3px solid rgba(198,164,90,.25); border-color:var(--gold); }
textarea { resize:vertical; min-height:120px; }
.form-help { font-size:.83rem; color:var(--muted); }
.contact-layout { display:grid; grid-template-columns:.85fr 1.15fr; gap:2rem; align-items:start; }
.contact-panel { background:var(--green); color:white; border-radius:var(--radius); padding:2rem; }
.contact-panel h2 { color:white; font-size:2rem; }
.contact-panel a { color:var(--gold-light); overflow-wrap:anywhere; }
.contact-line { padding:1rem 0; border-bottom:1px solid rgba(255,255,255,.16); }
.contact-line:last-child { border-bottom:0; }
.steps { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; counter-reset:step; }
.step { padding:1.3rem; border:1px solid var(--line); border-radius:14px; background:white; counter-increment:step; }
.step::before { content:"0" counter(step); display:block; color:#9b7838; font-family:var(--serif); font-size:1.5rem; margin-bottom:.75rem; }
.step p { color:var(--muted); font-size:.9rem; }
.faq-list { display:grid; gap:.75rem; max-width:850px; }
details { padding:1rem 1.1rem; background:white; border:1px solid var(--line); border-radius:12px; }
summary { cursor:pointer; color:var(--green); font-weight:800; }
details p { color:var(--muted); margin:.75rem 0 0; }
.cta-strip { display:flex; justify-content:space-between; align-items:center; gap:2rem; padding:2rem; border-radius:var(--radius); background:#eee7d6; }
.cta-strip h2 { font-size:clamp(1.6rem,3vw,2.3rem); margin-bottom:.4rem; }
.cta-strip p { color:#59645c; margin:0; }
.prose { max-width:850px; }
.prose h2 { font-size:1.8rem; margin-top:2.3rem; }
.prose h3 { margin-top:1.5rem; }
.prose p,.prose li { color:#59645c; }
.prose a { color:var(--green); text-decoration:underline; text-underline-offset:3px; }
.site-footer { background:#102f28; color:#f8f5ed; padding:3.5rem 0 1.5rem; }
.footer-grid { display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr; gap:2rem; }
.footer-brand { width:260px; background:var(--ivory); border-radius:8px; margin-bottom:1rem; }
.site-footer p,.site-footer li { color:rgba(255,255,255,.68); font-size:.9rem; }
.site-footer h3 { color:var(--gold-light); font-size:.9rem; text-transform:uppercase; letter-spacing:.1em; }
.site-footer ul { list-style:none; padding:0; margin:0; display:grid; gap:.55rem; }
.site-footer a:hover { color:var(--gold-light); }
.footer-bottom { border-top:1px solid rgba(255,255,255,.16); margin-top:2.5rem; padding-top:1.2rem; display:flex; justify-content:space-between; gap:1rem; color:rgba(255,255,255,.55); font-size:.85rem; }
.whatsapp-float { position:fixed; z-index:40; right:18px; bottom:18px; display:flex; align-items:center; gap:.5rem; padding:.8rem 1rem; border-radius:999px; color:white; background:#1e7652; box-shadow:0 14px 26px rgba(0,0,0,.15); }
.whatsapp-float svg { width:20px; height:20px; fill:currentColor; }
.chat-toggle { position:fixed; right:18px; bottom:78px; z-index:39; display:inline-flex; align-items:center; gap:.55rem; padding:.82rem 1rem; border:none; border-radius:999px; background:linear-gradient(135deg,#173f35,#1f6a4d); color:#fff; box-shadow:0 16px 30px rgba(23,63,53,.2); cursor:pointer; font-weight:800; }
.chat-toggle-icon { display:inline-grid; place-items:center; width:22px; height:22px; border-radius:50%; background:rgba(255,255,255,.18); font-size:.85rem; }
.chat-widget { position:fixed; right:18px; bottom:136px; z-index:42; opacity:0; visibility:hidden; transform:translateY(10px); transition:all .2s ease; pointer-events:none; }
.chat-widget.is-open { opacity:1; visibility:visible; transform:translateY(0); pointer-events:auto; }
.chat-window { width:min(360px, calc(100vw - 28px)); background:rgba(255,253,248,.98); border:1px solid var(--line); border-radius:20px; box-shadow:0 26px 45px rgba(11,38,31,.18); overflow:hidden; }
.chat-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1rem .8rem; background:var(--green); color:white; }
.chat-badge { display:inline-block; font-size:.62rem; letter-spacing:.12em; text-transform:uppercase; color:var(--gold-light); margin-bottom:.2rem; }
.chat-header strong { display:block; font-size:1.05rem; }
.chat-close { background:transparent; border:none; color:white; font-size:1.6rem; line-height:1; cursor:pointer; }
.chat-messages { display:grid; gap:.8rem; padding:1rem; max-height:300px; overflow:auto; background:linear-gradient(180deg,#f8f5ed,#fffdf8); }
.chat-bubble { max-width:85%; padding:.7rem .85rem; border-radius:14px; line-height:1.5; font-size:.9rem; }
.chat-bubble.bot { background:#edf2ee; color:var(--ink); border-top-left-radius:4px; }
.chat-bubble.user { margin-left:auto; background:var(--green); color:white; border-top-right-radius:4px; }
.chat-form { display:flex; gap:.6rem; align-items:center; background:white; padding:0.8rem 1rem 1rem; border-top:1px solid var(--line); }
.chat-form input { flex:1; border:1px solid #d8ded7; background:#fffefa; border-radius:999px; padding:.75rem .9rem; }
.chat-form button { border:none; border-radius:999px; background:var(--gold); color:#1c3027; padding:.72rem .95rem; font-weight:800; cursor:pointer; }
.chat-preview { display:flex; justify-content:center; align-items:center; }
.chat-preview-window { width:100%; max-width:420px; background:white; border:1px solid var(--line); border-radius:20px; box-shadow:var(--shadow); overflow:hidden; }
.chat-preview-header { background:var(--green); color:white; padding:.8rem 1rem; font-weight:800; }
.chat-preview-body { display:grid; gap:.8rem; padding:1rem; background:linear-gradient(180deg,#f8f5ed,#fffdf8); }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
.muted { color:var(--muted); }
.small { font-size:.85rem; }
.center { text-align:center; }
.mt-2 { margin-top:2rem; }
.mb-0 { margin-bottom:0; }
.empty-state { padding:2rem; background:var(--ivory); border-radius:14px; }
@media (max-width: 980px) {
  .nav { gap:.8rem; font-size:.85rem; }
  .brand img { width:245px; }
  .grid-4 { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .footer-grid { grid-template-columns:repeat(2,1fr); }
  .steps { grid-template-columns:repeat(2,1fr); }
}
@media (max-width: 760px) {
  .container { width:min(100% - 30px, 600px); }
  .topbar-inner { justify-content:center; text-align:center; }
  .topbar-inner span:first-child { display:none; }
  .header-inner { min-height:72px; }
  .brand img { width:230px; }
  .menu-toggle { display:inline-flex; align-items:center; gap:.5rem; }
  .nav { display:none; position:absolute; left:0; right:0; top:100%; padding:1rem 1.25rem 1.25rem; background:var(--paper); border-bottom:1px solid var(--line); box-shadow:0 14px 24px rgba(0,0,0,.1); }
  .nav.is-open { display:flex; }
  .nav a { padding:.75rem .5rem; }
  .nav .nav-cta { text-align:center; margin-top:.4rem; }
  .hero::before { background:linear-gradient(90deg,rgba(11,38,31,.88),rgba(11,38,31,.48)); }
  .hero-content { padding:5rem 0; }
  .section-heading { display:block; }
  .section-heading .card-link { margin-top:.5rem; }
  .grid-3,.grid-4 { grid-template-columns:1fr; }
  .feature-band,.contact-layout { grid-template-columns:1fr; gap:2rem; }
  .feature-image { order:-1; }
  .trust-grid { grid-template-columns:1fr; }
  .form-grid { grid-template-columns:1fr; }
  .field-full { grid-column:auto; }
  .steps { grid-template-columns:1fr; }
  .cta-strip { display:block; padding:1.5rem; }
  .cta-strip .btn { margin-top:1rem; width:100%; }
  .footer-grid { grid-template-columns:1fr 1fr; gap:1.6rem 1rem; }
  .footer-grid > div:first-child { grid-column:1 / -1; }
  .footer-brand { width:230px; }
  .footer-bottom { display:block; }
  .footer-bottom span { display:block; margin-top:.4rem; }
  .whatsapp-float { right:12px; bottom:12px; padding:.8rem; }
  .whatsapp-float .wa-label { display:none; }
  .chat-toggle { right:12px; bottom:64px; }
  .chat-widget { right:12px; bottom:116px; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior:auto; }
  *,*::before,*::after { transition:none !important; animation:none !important; }
}

.package-controls{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:28px}.package-controls input,.package-controls select{border:1px solid #d9dfd7;border-radius:8px;padding:12px 14px;background:#fffefa}.package-controls button{border:none;border-radius:8px;background:var(--green);color:white;padding:12px 18px;cursor:pointer}.package-controls button:hover{background:var(--green-2)}
