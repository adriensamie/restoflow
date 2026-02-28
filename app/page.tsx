import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

export default async function LandingPage() {
  const { orgId } = await auth()
  if (orgId) redirect('/dashboard')

  return (
    <>
      <style>{`
        :root {
          --bg: #04080f; --surface: #080f1c; --border: #0f1e35;
          --accent: #0ea5e9; --accent2: #8b5cf6; --gold: #d4a843;
          --text: #e2e8f0; --muted: #4a6fa5; --dim: #1e2d4a;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); overflow-x: hidden; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .reveal { opacity:0; transform:translateY(30px); transition:opacity .7s ease,transform .7s ease; }
        .reveal.visible { opacity:1; transform:translateY(0); }
        nav { position:fixed;top:0;left:0;right:0;z-index:100;padding:20px 60px;display:flex;align-items:center;justify-content:space-between;background:rgba(4,8,15,.85);backdrop-filter:blur(20px);border-bottom:1px solid var(--border); }
        .logo { font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:10px;text-decoration:none; }
        .logo-dot { width:8px;height:8px;border-radius:50%;background:var(--accent);animation:pulse 2s infinite; }
        .nav-links { display:flex;align-items:center;gap:36px;list-style:none; }
        .nav-links a { text-decoration:none;color:var(--muted);font-size:14px;font-weight:500;transition:color .2s; }
        .nav-links a:hover { color:var(--text); }
        .nav-cta { background:linear-gradient(135deg,#1d4ed8,var(--accent));color:white!important;padding:10px 22px;border-radius:8px; }
        .hero { position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:120px 60px 80px;overflow:hidden; }
        .hero-bg { position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(14,165,233,.12) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 60%,rgba(139,92,246,.08) 0%,transparent 50%); }
        .hero-grid { position:absolute;inset:0;background-image:linear-gradient(rgba(14,165,233,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,.04) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse at center,black 20%,transparent 70%); }
        .hero-content { position:relative;z-index:1;text-align:center;max-width:860px; }
        .hero-badge { display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:100px;border:1px solid rgba(212,168,67,.3);background:rgba(212,168,67,.06);color:var(--gold);font-size:12px;font-weight:500;letter-spacing:.8px;text-transform:uppercase;margin-bottom:32px;animation:fadeInUp .6s ease both; }
        .badge-dot { width:6px;height:6px;border-radius:50%;background:var(--gold);animation:pulse 1.5s infinite; }
        h1 { font-family:'Playfair Display',serif;font-size:clamp(52px,7vw,88px);font-weight:900;line-height:1.0;letter-spacing:-2px;margin-bottom:28px;animation:fadeInUp .7s .1s ease both; }
        h1 em { font-style:italic;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
        .hero-sub { font-size:18px;color:var(--muted);line-height:1.7;max-width:560px;margin:0 auto 44px;font-weight:300;animation:fadeInUp .7s .2s ease both; }
        .hero-actions { display:flex;align-items:center;justify-content:center;gap:16px;animation:fadeInUp .7s .3s ease both; }
        .btn-primary { display:inline-flex;align-items:center;gap:10px;padding:16px 32px;background:linear-gradient(135deg,#1d4ed8,var(--accent));color:white;border-radius:10px;font-size:15px;font-weight:500;text-decoration:none;border:none;cursor:pointer;transition:transform .2s,box-shadow .2s;box-shadow:0 0 40px rgba(14,165,233,.25); }
        .btn-primary:hover { transform:translateY(-2px);box-shadow:0 0 60px rgba(14,165,233,.4); }
        .btn-secondary { display:inline-flex;align-items:center;gap:10px;padding:16px 32px;background:transparent;color:var(--text);border-radius:10px;font-size:15px;font-weight:500;text-decoration:none;border:1px solid var(--dim);cursor:pointer;transition:border-color .2s,background .2s; }
        .btn-secondary:hover { border-color:var(--muted);background:rgba(255,255,255,.03); }
        .hero-proof { margin-top:64px;display:flex;align-items:center;justify-content:center;gap:32px;animation:fadeInUp .7s .4s ease both; }
        .proof-num { font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--text); }
        .proof-label { font-size:12px;color:var(--muted);margin-top:2px; }
        .proof-divider { width:1px;height:40px;background:var(--border); }
        .section { padding:100px 60px;position:relative; }
        .section-tag { font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:16px;display:block; }
        .section-title { font-family:'Playfair Display',serif;font-size:clamp(36px,4vw,52px);font-weight:700;letter-spacing:-1px;line-height:1.1;margin-bottom:16px; }
        .section-sub { font-size:16px;color:var(--muted);max-width:480px;line-height:1.7;font-weight:300;margin-bottom:60px; }
        .modules-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:var(--border);border:1px solid var(--border);border-radius:16px;overflow:hidden; }
        .module-card { background:var(--surface);padding:32px;transition:background .2s;position:relative;overflow:hidden; }
        .module-card:hover { background:#0a1628; }
        .module-card::after { content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--card-color,var(--accent)),transparent);opacity:0;transition:opacity .3s; }
        .module-card:hover::after { opacity:1; }
        .module-icon { width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:20px;background:var(--card-bg,rgba(14,165,233,.1)); }
        .module-name { font-size:15px;font-weight:600;color:var(--text);margin-bottom:8px; }
        .module-desc { font-size:13px;color:var(--muted);line-height:1.6; }
        .ia-section { padding:100px 60px;background:radial-gradient(ellipse 80% 80% at 50% 50%,rgba(139,92,246,.06) 0%,transparent 70%);border-top:1px solid var(--border);border-bottom:1px solid var(--border); }
        .ia-layout { display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center; }
        .ia-features { display:flex;flex-direction:column;gap:24px;margin-top:40px; }
        .ia-feature { display:flex;gap:16px;align-items:flex-start; }
        .ia-feature-icon { width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.2); }
        .ia-feature-text h4 { font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px; }
        .ia-feature-text p { font-size:13px;color:var(--muted);line-height:1.6; }
        .chat-mockup { background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.5),0 0 0 1px rgba(139,92,246,.1); }
        .chat-header { padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:rgba(139,92,246,.05); }
        .chat-avatar { width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:14px; }
        .chat-title { font-size:13px;font-weight:600;color:var(--text); }
        .chat-status { font-size:11px;color:#4ade80; }
        .chat-body { padding:20px;display:flex;flex-direction:column;gap:16px; }
        .chat-msg { display:flex;gap:10px;max-width:85%; }
        .chat-msg.user { align-self:flex-end;flex-direction:row-reverse; }
        .chat-bubble { padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5;color:var(--text); }
        .chat-msg.ai .chat-bubble { background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.2); }
        .chat-msg.user .chat-bubble { background:rgba(14,165,233,.1);border:1px solid rgba(14,165,233,.2);color:#93c5fd; }
        .chat-msg-avatar { width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;margin-top:2px; }
        .stats-section { padding:80px 60px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface); }
        .stats-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:40px;text-align:center; }
        .stat-num { font-family:'Playfair Display',serif;font-size:48px;font-weight:700;background:linear-gradient(135deg,var(--text),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
        .stat-label { font-size:13px;color:var(--muted);margin-top:6px;font-weight:300; }
        .pricing-section { padding:100px 60px; }
        .pricing-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:1000px;margin:0 auto; }
        .pricing-card { padding:36px;border-radius:16px;border:1px solid var(--border);background:var(--surface);position:relative;transition:transform .2s,border-color .2s; }
        .pricing-card:hover { transform:translateY(-4px); }
        .pricing-card.featured { border-color:var(--accent);background:linear-gradient(180deg,rgba(14,165,233,.08) 0%,var(--surface) 100%); }
        .pricing-badge { position:absolute;top:-12px;left:50%;transform:translateX(-50%);padding:4px 16px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:.5px;background:linear-gradient(135deg,#1d4ed8,var(--accent));color:white; }
        .pricing-name { font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:16px; }
        .pricing-price { font-family:'Playfair Display',serif;font-size:52px;font-weight:700;color:var(--text);line-height:1;margin-bottom:6px; }
        .pricing-price sup { font-size:22px;vertical-align:top;margin-top:12px;display:inline-block;font-family:'DM Sans',sans-serif;font-weight:300; }
        .pricing-period { font-size:13px;color:var(--muted);margin-bottom:28px; }
        .pricing-features { list-style:none;display:flex;flex-direction:column;gap:12px;margin-bottom:32px; }
        .pricing-features li { display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--muted); }
        .pricing-features li::before { content:'✓';color:#4ade80;font-weight:700;flex-shrink:0;margin-top:1px; }
        .pricing-features li.inactive { opacity:.35; }
        .pricing-features li.inactive::before { content:'—';color:var(--dim); }
        .pricing-btn { display:block;width:100%;padding:14px;border-radius:10px;font-size:14px;font-weight:500;text-align:center;text-decoration:none;cursor:pointer;border:none;transition:all .2s; }
        .pricing-btn.primary { background:linear-gradient(135deg,#1d4ed8,var(--accent));color:white;box-shadow:0 0 30px rgba(14,165,233,.2); }
        .pricing-btn.secondary { background:transparent;color:var(--text);border:1px solid var(--dim); }
        .pricing-btn:hover { opacity:.85;transform:translateY(-1px); }
        .testimonials-section { padding:100px 60px; }
        .testimonials-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:60px; }
        .testimonial-card { padding:32px;border-radius:16px;border:1px solid var(--border);background:var(--surface); }
        .testimonial-stars { color:var(--gold);font-size:14px;letter-spacing:2px;margin-bottom:16px; }
        .testimonial-text { font-size:14px;line-height:1.8;color:var(--muted);font-style:italic;margin-bottom:24px;font-family:'Playfair Display',serif; }
        .testimonial-author { display:flex;align-items:center;gap:12px; }
        .testimonial-avatar { width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:white; }
        .testimonial-name { font-size:14px;font-weight:600;color:var(--text); }
        .testimonial-role { font-size:12px;color:var(--muted); }
        .cta-section { padding:120px 60px;text-align:center;position:relative;overflow:hidden; }
        .cta-bg { position:absolute;inset:0;background:radial-gradient(ellipse 60% 80% at 50% 50%,rgba(14,165,233,.08) 0%,transparent 70%); }
        .cta-section h2 { font-family:'Playfair Display',serif;font-size:clamp(40px,5vw,64px);font-weight:700;letter-spacing:-1.5px;line-height:1.1;margin-bottom:20px;position:relative; }
        .cta-section p { font-size:17px;color:var(--muted);margin-bottom:44px;position:relative;font-weight:300; }
        .cta-actions { display:flex;justify-content:center;gap:16px;position:relative; }
        footer { padding:60px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center; }
        .footer-copy { font-size:13px;color:var(--muted); }
        .footer-links { display:flex;gap:24px; }
        .footer-links a { font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s; }
        .footer-links a:hover { color:var(--text); }
        @media (max-width: 768px) {
          nav { padding:12px 20px; }
          .nav-links { gap:16px; }
          .nav-links li:not(:last-child) { display:none; }
          .hero { padding:100px 20px 60px; }
          h1 { font-size:clamp(32px,10vw,52px);letter-spacing:-1px; }
          .hero-sub { font-size:15px; }
          .hero-actions { flex-direction:column;gap:12px; }
          .hero-proof { flex-wrap:wrap;gap:16px; }
          .proof-divider { display:none; }
          .section { padding:60px 20px; }
          .modules-grid { grid-template-columns:1fr; }
          .ia-section { padding:60px 20px; }
          .ia-layout { grid-template-columns:1fr;gap:40px; }
          .stats-section { padding:40px 20px; }
          .stats-grid { grid-template-columns:repeat(2,1fr);gap:24px; }
          .pricing-section { padding:60px 20px; }
          .pricing-grid { grid-template-columns:1fr;max-width:400px; }
          .testimonials-section { padding:60px 20px; }
          .testimonials-grid { grid-template-columns:1fr; }
          .cta-section { padding:60px 20px; }
          footer { padding:30px 20px;flex-direction:column;gap:16px;text-align:center; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          nav { padding:16px 30px; }
          .hero { padding:120px 30px 80px; }
          .section { padding:80px 30px; }
          .modules-grid { grid-template-columns:repeat(2,1fr); }
          .ia-section { padding:80px 30px; }
          .stats-section { padding:60px 30px; }
          .pricing-section { padding:80px 30px; }
          .pricing-grid { grid-template-columns:1fr 1fr; }
          .testimonials-section { padding:80px 30px; }
          .testimonials-grid { grid-template-columns:1fr 1fr; }
          .cta-section { padding:80px 30px; }
          footer { padding:40px 30px; }
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />

      <nav>
        <a href="/" className="logo"><div className="logo-dot"></div>RestoFlow</a>
        <ul className="nav-links">
          <li><a href="#fonctionnalites">Fonctionnalités</a></li>
          <li><a href="#ia">IA</a></li>
          <li><a href="#tarifs">Tarifs</a></li>
          <li><a href="/sign-in" className="nav-cta">Connexion →</a></li>
        </ul>
      </nav>

      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-content">
          <div className="hero-badge"><div className="badge-dot"></div>Nouveau · Prévisions IA disponibles</div>
          <h1>La gestion<br/><em>intelligente</em><br/>de votre restaurant</h1>
          <p className="hero-sub">Stocks, food cost, planning, HACCP et prévisions IA — tout ce dont vous avez besoin pour piloter votre restaurant avec précision.</p>
          <div className="hero-actions">
            <a href="/sign-up" className="btn-primary">Démarrer gratuitement <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
            <a href="#fonctionnalites" className="btn-secondary">Voir les fonctionnalités</a>
          </div>
          <div className="hero-proof">
            <div className="proof-item"><div className="proof-num">500+</div><div className="proof-label">Restaurants actifs</div></div>
            <div className="proof-divider"></div>
            <div className="proof-item"><div className="proof-num">-23%</div><div className="proof-label">Food cost moyen</div></div>
            <div className="proof-divider"></div>
            <div className="proof-item"><div className="proof-num">4.8★</div><div className="proof-label">Note moyenne</div></div>
            <div className="proof-divider"></div>
            <div className="proof-item"><div className="proof-num">14j</div><div className="proof-label">Essai gratuit</div></div>
          </div>
        </div>
      </section>

      <section className="section" id="fonctionnalites">
        <div className="reveal">
          <span className="section-tag">// 9 modules intégrés</span>
          <h2 className="section-title">Tout ce qu'il faut<br/>pour bien gérer</h2>
          <p className="section-sub">Une plateforme complète pensée pour les restaurateurs, pas pour les comptables.</p>
        </div>
        <div className="modules-grid reveal">
          {[
            {icon:'📦',name:'Stocks & Pertes',desc:"Suivi temps réel, alertes seuils, historique des pertes par motif.",color:'#60a5fa',bg:'rgba(96,165,250,.1)'},
            {icon:'🛒',name:'Commandes IA',desc:"Import bon de livraison par photo — stocks mis à jour automatiquement.",color:'#4ade80',bg:'rgba(74,222,128,.1)'},
            {icon:'🍷',name:'Cave à vins',desc:"Gestion cave complète, étiquetage, fiches techniques vins.",color:'#a78bfa',bg:'rgba(167,139,250,.1)'},
            {icon:'📋',name:'Recettes & Fiches',desc:"Fiches techniques avec calcul food cost automatique et import IA.",color:'#fbbf24',bg:'rgba(251,191,36,.1)'},
            {icon:'📊',name:'Marges & Food Cost',desc:"Tableaux de bord marges, objectifs KPI, analyse par recette.",color:'#f97316',bg:'rgba(249,115,22,.1)'},
            {icon:'🛡️',name:'Anti-Fraude Caisse',desc:"Détection annulations suspectes, alertes temps réel, journal caisse.",color:'#f87171',bg:'rgba(248,113,113,.1)'},
            {icon:'🔮',name:'Prévisions IA',desc:"Prévisions couverts et CA basées sur météo, historique et événements.",color:'#0ea5e9',bg:'rgba(14,165,233,.1)'},
            {icon:'👥',name:'Planning Équipe',desc:"Planning visuel par employé, duplication semaine, calcul heures.",color:'#60a5fa',bg:'rgba(96,165,250,.1)'},
            {icon:'🧼',name:'HACCP',desc:"Checklist quotidienne, relevés températures, alertes non-conformités.",color:'#4ade80',bg:'rgba(74,222,128,.1)'},
          ].map(m => (
            <div key={m.name} className="module-card" style={{'--card-color':m.color,'--card-bg':m.bg} as any}>
              <div className="module-icon">{m.icon}</div>
              <div className="module-name">{m.name}</div>
              <div className="module-desc">{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="ia-section" id="ia">
        <div className="ia-layout">
          <div className="reveal">
            <span className="section-tag">// Propulsé par Claude AI</span>
            <h2 className="section-title">Votre expert IA<br/>disponible 24h/24</h2>
            <p className="section-sub">Posez une question, obtenez une analyse concrète basée sur vos données réelles.</p>
            <div className="ia-features">
              {[
                {icon:'🎯',title:'Analyse food cost instantanée',desc:"Identifie vos recettes problématiques et suggère des optimisations précises."},
                {icon:'📈',title:'Prévisions météo-contextuelles',desc:"Anticipe vos couverts en tenant compte de la météo, des féries et de l'historique."},
                {icon:'⚡',title:'Alertes stocks intelligentes',desc:"Suggère les commandes prioritaires avant rupture selon la consommation réelle."},
                {icon:'🤖',title:'Import documents par photo',desc:"Scannez vos bons de livraison et fiches techniques — l'IA extrait tout automatiquement."},
              ].map(f => (
                <div key={f.title} className="ia-feature">
                  <div className="ia-feature-icon">{f.icon}</div>
                  <div className="ia-feature-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal">
            <div className="chat-mockup">
              <div className="chat-header">
                <div className="chat-avatar">🤖</div>
                <div><div className="chat-title">Assistant IA RestoFlow</div><div className="chat-status">● En ligne · données temps réel</div></div>
              </div>
              <div className="chat-body">
                <div className="chat-msg user">
                  <div className="chat-msg-avatar" style={{background:'linear-gradient(135deg,#1d4ed8,#0ea5e9)'}}>A</div>
                  <div className="chat-bubble">Analyse mon food cost et donne-moi 3 actions concrètes.</div>
                </div>
                <div className="chat-msg ai">
                  <div className="chat-msg-avatar" style={{background:'linear-gradient(135deg,#4f46e5,#8b5cf6)'}}>🤖</div>
                  <div className="chat-bubble">Votre food cost est à <strong style={{color:'#f97316'}}>34.2%</strong> ce mois.<br/><br/><strong style={{color:'#e2e8f0'}}>3 actions prioritaires :</strong><br/>1. 🍖 Le magret est à 52% — renégociez<br/>2. 📦 Perte fromage +40€/sem — réviser portions<br/>3. 🥗 La César à 18% — mettez-la en avant</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section reveal">
        <div className="stats-grid">
          {[{n:'-23%',l:'Réduction food cost'},{n:'3h',l:'Gain quotidien admin'},{n:'500+',l:'Restaurants actifs'},{n:'99.9%',l:'Uptime garanti'}].map(s => (
            <div key={s.l}><div className="stat-num">{s.n}</div><div className="stat-label">{s.l}</div></div>
          ))}
        </div>
      </section>

      <section className="pricing-section" id="tarifs">
        <div style={{textAlign:'center'}} className="reveal">
          <span className="section-tag">// Tarification simple</span>
          <h2 className="section-title">Des tarifs clairs, sans surprises</h2>
          <p className="section-sub" style={{margin:'0 auto 60px'}}>Essai gratuit 14 jours · Sans carte bancaire · Résiliation à tout moment.</p>
        </div>
        <div className="pricing-grid reveal">
          <div className="pricing-card">
            <div className="pricing-name">Starter</div>
            <div className="pricing-price"><sup>€</sup>49</div>
            <div className="pricing-period">par mois · 1 établissement</div>
            <ul className="pricing-features">
              <li>Stocks & Pertes</li><li>Commandes & Livraisons</li><li>Recettes & Food Cost</li>
              <li>Planning équipe</li><li>HACCP basique</li>
              <li className="inactive">Prévisions IA</li><li className="inactive">Assistant IA</li><li className="inactive">Anti-Fraude</li>
            </ul>
            <a href="/sign-up" className="pricing-btn secondary">Commencer l'essai</a>
          </div>
          <div className="pricing-card featured">
            <div className="pricing-badge">✦ Le plus populaire</div>
            <div className="pricing-name">Pro</div>
            <div className="pricing-price"><sup>€</sup>99</div>
            <div className="pricing-period">par mois · 1 établissement</div>
            <ul className="pricing-features">
              <li>Tout Starter inclus</li><li>Prévisions IA météo</li><li>Assistant IA illimité</li>
              <li>Anti-Fraude Caisse</li><li>Cave à vins</li><li>Import BL par photo</li>
              <li>Fiches de paie</li><li>Intégrations caisses</li>
            </ul>
            <a href="/sign-up" className="pricing-btn primary">Démarrer gratuitement →</a>
          </div>
          <div className="pricing-card">
            <div className="pricing-name">Multi-Sites</div>
            <div className="pricing-price"><sup>€</sup>199</div>
            <div className="pricing-period">par mois · jusqu'à 5 établissements</div>
            <ul className="pricing-features">
              <li>Tout Pro inclus</li><li>Jusqu'à 5 établissements</li><li>Dashboard consolidé</li>
              <li>Support prioritaire</li><li>Onboarding dédié</li><li>API accès complet</li>
              <li>SLA 99.9% garanti</li><li>Comparaison inter-sites</li>
            </ul>
            <a href="mailto:hello@restoflow.fr" className="pricing-btn secondary">Nous contacter</a>
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <div style={{textAlign:'center'}} className="reveal">
          <span className="section-tag">// Ils nous font confiance</span>
          <h2 className="section-title">Ce qu'en disent<br/>nos clients</h2>
        </div>
        <div className="testimonials-grid reveal">
          {[
            {stars:'★★★★★',text:'"RestoFlow a transformé notre façon de gérer la cuisine. Le food cost est passé de 38% à 29% en 3 mois."',name:'Marc Dubois',role:'Chef propriétaire · Bistrot des Halles, Lyon',color:'linear-gradient(135deg,#1d4ed8,#0ea5e9)',initiale:'M'},
            {stars:'★★★★★',text:'"L\'assistant IA m\'a économisé 2h par jour sur la gestion admin. Je me concentre enfin sur la cuisine."',name:'Sophie Renard',role:'Gérante · La Table de Sophie, Paris',color:'linear-gradient(135deg,#059669,#10b981)',initiale:'S'},
            {stars:'★★★★★',text:'"Le module HACCP seul vaut l\'abonnement. Plus de stress pour les inspections — tout est tracé."',name:'Thomas Moreau',role:'Directeur · Groupe Moreau (3 restaurants)',color:'linear-gradient(135deg,#d97706,#fbbf24)',initiale:'T'},
          ].map(t => (
            <div key={t.name} className="testimonial-card">
              <div className="testimonial-stars">{t.stars}</div>
              <div className="testimonial-text">{t.text}</div>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{background:t.color}}>{t.initiale}</div>
                <div><div className="testimonial-name">{t.name}</div><div className="testimonial-role">{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-bg"></div>
        <div className="reveal">
          <h2>Prêt à transformer<br/>votre restaurant ?</h2>
          <p>Rejoignez 500+ restaurateurs qui pilotent leur activité avec RestoFlow.</p>
          <div className="cta-actions">
            <a href="/sign-up" className="btn-primary">Essai gratuit 14 jours <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
            <a href="mailto:hello@restoflow.fr" className="btn-secondary">Demander une démo</a>
          </div>
        </div>
      </section>

      <footer>
        <div className="logo"><div className="logo-dot"></div>RestoFlow</div>
        <div className="footer-links"><a href="/cgu">CGU</a><a href="/confidentialite">Confidentialite</a><a href="mailto:hello@restoflow.fr">Contact</a></div>
        <div className="footer-copy">© 2026 RestoFlow · Tous droits réservés</div>
      </footer>

      <script dangerouslySetInnerHTML={{__html:`
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
              setTimeout(() => entry.target.classList.add('visible'), i * 80)
              observer.unobserve(entry.target)
            }
          })
        }, { threshold: 0.1 })
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
      `}} />
    </>
  )
}
