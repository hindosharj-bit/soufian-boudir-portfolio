import './App.css'
import { useState, useEffect, useRef } from 'react'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [isScrolled, setIsScrolled] = useState(false)
  const countersRef = useRef<HTMLDivElement>(null)
  const [countersVisible, setCountersVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)

      const sections = ['home', 'about', 'services', 'skills', 'projects', 'contact']
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 150 && rect.bottom > 150) {
            setActiveSection(id)
            break
          }
        }
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCountersVisible(true)
      },
      { threshold: 0.3 }
    )

    if (countersRef.current) observer.observe(countersRef.current)

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setIsMenuOpen(false)
  }

  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="logo" onClick={() => scrollTo('home')}>
            <span className="logo-bracket">&lt;</span>
            SB
            <span className="logo-bracket">/&gt;</span>
          </div>
          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${isMenuOpen ? 'open' : ''}`} />
          </button>
          <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            {['home', 'about', 'services', 'skills', 'projects', 'contact'].map(id => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={activeSection === id ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); scrollTo(id) }}
                >
                  {id === 'home' ? 'Accueil' :
                   id === 'about' ? 'A propos' :
                   id === 'services' ? 'Services' :
                   id === 'skills' ? 'Competences' :
                   id === 'projects' ? 'Projets' :
                   'Contact'}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <section id="home" className="hero">
        <div className="hero-particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }} />
          ))}
        </div>
        <div className="hero-content">
          <div className="hero-badge">AI & Digital Marketing Expert</div>
          <h1>
            <span className="hero-line">Soufiane</span>
            <span className="hero-line gradient-text">Boudir</span>
          </h1>
          <p className="tagline">
            J'automatise votre acquisition client avec l'IA, le scraping intelligent et le multi-channel marketing.
          </p>
          <div className="hero-ctas">
            <button className="cta-button primary" onClick={() => scrollTo('services')}>
              Decouvrir mes services
              <span className="cta-arrow">&#8594;</span>
            </button>
            <button className="cta-button secondary" onClick={() => scrollTo('contact')}>
              Me contacter
            </button>
          </div>
          <div className="hero-tech-stack">
            {['Python', 'Node.js', 'React', 'AI/ML', 'Scraping', 'SMTP'].map(tech => (
              <span key={tech} className="tech-pill">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="about">
        <div className="section-header">
          <span className="section-tag">01 — A propos</span>
          <h2>Qui suis-je ?</h2>
        </div>
        <div className="about-grid">
          <div className="about-text">
            <p>
              Expert en automatisation et marketing digital base au Maroc. Je developpe des outils sur-mesure
              qui transforment la facon dont les entreprises trouvent et convertissent leurs clients.
            </p>
            <p>
              Ma specialite : combiner le scraping de donnees, la validation en temps reel,
              et l'envoi multi-canal (Email, SMS, WhatsApp) pour creer des campagnes
              qui performent vraiment.
            </p>
            <p>
              Chaque outil que je construis est pense pour etre simple a utiliser,
              puissant dans ses resultats, et entierement personnalisable.
            </p>
          </div>
          <div className="about-stats" ref={countersRef}>
            <StatCounter value={50} suffix="+" label="Projets realises" active={countersVisible} />
            <StatCounter value={98} suffix="%" label="Clients satisfaits" active={countersVisible} />
            <StatCounter value={3} suffix="M+" label="Leads generes" active={countersVisible} />
            <StatCounter value={5} suffix="+" label="Ans d'experience" active={countersVisible} />
          </div>
        </div>
      </section>

      <section id="services" className="services">
        <div className="section-header">
          <span className="section-tag">02 — Services</span>
          <h2>Ce que je propose</h2>
        </div>
        <div className="services-grid">
          <ServiceCard
            icon="&#128270;"
            title="Scraping Intelligent"
            description="Extraction de donnees ciblee : emails, numeros, sites web. Validation en temps reel avec verification SMTP et detection des bounces."
            features={['Scraping multi-sources', 'Validation email/tel', 'Export CSV/JSON', 'Anti-detection']}
          />
          <ServiceCard
            icon="&#9993;"
            title="Multi SMTP & Email Marketing"
            description="Systeme d'envoi distribue sur plusieurs SMTP pour un taux de delivrabilite maximal. Templates HTML professionnels."
            features={['Rotation SMTP', 'Templates HTML', 'Tracking ouvertures', 'Warmup automatique']}
            featured
          />
          <ServiceCard
            icon="&#128241;"
            title="SMS & WhatsApp Marketing"
            description="Campagnes SMS et WhatsApp automatisees avec personnalisation, segmentation et suivi des conversions."
            features={['API SMS integre', 'WhatsApp Business', 'Personnalisation', 'Analytics temps reel']}
          />
          <ServiceCard
            icon="&#129302;"
            title="Automatisation IA"
            description="Bots intelligents, chatbots, et workflows automatises qui travaillent pour vous 24/7."
            features={['Chatbots IA', 'Workflows auto', 'Integration API', 'Machine Learning']}
          />
          <ServiceCard
            icon="&#128202;"
            title="Dashboard & Analytics"
            description="Tableaux de bord intelligents pour suivre vos campagnes, vos leads et vos conversions en temps reel."
            features={['KPIs en direct', 'Rapports auto', 'Alertes custom', 'Export donnees']}
          />
          <ServiceCard
            icon="&#128640;"
            title="Solutions Sur-Mesure"
            description="Developpement d'outils personnalises adaptes a votre business : CRM, ERP, plateformes SaaS."
            features={['Dev full-stack', 'Architecture cloud', 'API custom', 'Support continu']}
          />
        </div>
      </section>

      <section id="skills" className="skills">
        <div className="section-header">
          <span className="section-tag">03 — Competences</span>
          <h2>Stack technique</h2>
        </div>
        <div className="skills-categories">
          <SkillCategory
            title="Backend & Scraping"
            skills={[
              { name: 'Python', level: 95 },
              { name: 'Node.js', level: 90 },
              { name: 'Selenium/Puppeteer', level: 92 },
              { name: 'API REST', level: 88 },
            ]}
          />
          <SkillCategory
            title="Email & Marketing"
            skills={[
              { name: 'SMTP/IMAP', level: 95 },
              { name: 'Email Deliverabilite', level: 90 },
              { name: 'HTML Email', level: 85 },
              { name: 'SMS API', level: 88 },
            ]}
          />
          <SkillCategory
            title="Frontend & Design"
            skills={[
              { name: 'React / Next.js', level: 88 },
              { name: 'Tailwind CSS', level: 90 },
              { name: 'TypeScript', level: 85 },
              { name: 'UI/UX Design', level: 80 },
            ]}
          />
          <SkillCategory
            title="IA & Data"
            skills={[
              { name: 'Machine Learning', level: 85 },
              { name: 'NLP / ChatGPT API', level: 88 },
              { name: 'Data Analysis', level: 82 },
              { name: 'Bases de donnees', level: 90 },
            ]}
          />
        </div>
      </section>

      <section id="projects" className="projects">
        <div className="section-header">
          <span className="section-tag">04 — Projets</span>
          <h2>Realisations</h2>
        </div>
        <div className="projects-grid">
          <ProjectCard
            title="LeadHunter Pro"
            category="Scraping & Validation"
            description="Outil de scraping avance avec validation email/telephone en temps reel. Capable d'extraire +10 000 leads qualifies par jour."
            tags={['Python', 'Selenium', 'SMTP Validation', 'PostgreSQL']}
            metric="+10K leads/jour"
          />
          <ProjectCard
            title="MultiSend Engine"
            category="Email Marketing"
            description="Moteur d'envoi email distribue sur 10+ SMTP simultanement avec rotation, warmup automatique et tracking avance."
            tags={['Node.js', 'Redis', 'SMTP', 'HTML Templates']}
            metric="98% delivrabilite"
          />
          <ProjectCard
            title="BOCA Food Automation"
            category="IA & Logistique"
            description="Systeme d'optimisation des stocks et commandes par IA pour la restauration. Reduction des pertes de 40%."
            tags={['Python', 'TensorFlow', 'React', 'MongoDB']}
            metric="-40% pertes"
          />
          <ProjectCard
            title="OmniChannel CRM"
            category="CRM & Automatisation"
            description="Plateforme CRM unifiee integrant email, SMS, WhatsApp et appels. Pipeline de vente automatise avec scoring IA."
            tags={['React', 'Node.js', 'Twilio', 'OpenAI']}
            metric="+65% conversion"
          />
          <ProjectCard
            title="DataVault Archiver"
            category="Data & Archivage"
            description="Systeme d'archivage intelligent qui organise, deduplique et categorise automatiquement les donnees collectees."
            tags={['Python', 'Elasticsearch', 'AWS S3', 'ML']}
            metric="3M+ records"
          />
          <ProjectCard
            title="SMSBlaster API"
            category="SMS Marketing"
            description="API d'envoi SMS compatible avec tous les providers majeurs. Interface drag-and-drop pour creer des campagnes."
            tags={['Node.js', 'React', 'Twilio', 'Vonage']}
            metric="50K SMS/heure"
          />
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-inner">
          <h2>Pret a booster votre business ?</h2>
          <p>Discutons de votre projet et trouvons la solution ideale pour automatiser votre acquisition client.</p>
          <button className="cta-button primary large" onClick={() => scrollTo('contact')}>
            Demarrer un projet
            <span className="cta-arrow">&#8594;</span>
          </button>
        </div>
      </section>

      <section id="contact" className="contact">
        <div className="section-header">
          <span className="section-tag">05 — Contact</span>
          <h2>Parlons de votre projet</h2>
        </div>
        <div className="contact-grid">
          <div className="contact-info">
            <h3>Contactez-moi</h3>
            <p>
              Que vous ayez besoin d'un outil de scraping, d'un systeme d'emailing, ou d'une solution complete
              d'automatisation, je suis la pour vous aider.
            </p>
            <div className="contact-methods">
              <a href="mailto:contact@soufianeboudir.com" className="contact-method">
                <span className="contact-icon">&#9993;</span>
                <div>
                  <strong>Email</strong>
                  <span>contact@soufianeboudir.com</span>
                </div>
              </a>
              <a href="https://wa.me/212600000000" className="contact-method" target="_blank" rel="noopener noreferrer">
                <span className="contact-icon">&#128172;</span>
                <div>
                  <strong>WhatsApp</strong>
                  <span>+212 6 00 00 00 00</span>
                </div>
              </a>
              <a href="https://linkedin.com/in/soufianeboudir" className="contact-method" target="_blank" rel="noopener noreferrer">
                <span className="contact-icon">&#128101;</span>
                <div>
                  <strong>LinkedIn</strong>
                  <span>Soufiane Boudir</span>
                </div>
              </a>
            </div>
          </div>
          <form className="contact-form" onSubmit={e => e.preventDefault()}>
            <div className="form-group">
              <input type="text" placeholder="Votre nom" required />
            </div>
            <div className="form-group">
              <input type="email" placeholder="Votre email" required />
            </div>
            <div className="form-group">
              <select defaultValue="">
                <option value="" disabled>Type de projet</option>
                <option>Scraping & Extraction de donnees</option>
                <option>Email Marketing / Multi SMTP</option>
                <option>SMS / WhatsApp Marketing</option>
                <option>Automatisation IA</option>
                <option>Dashboard & Analytics</option>
                <option>Solution sur-mesure</option>
              </select>
            </div>
            <div className="form-group">
              <textarea placeholder="Decrivez votre projet..." rows={5} required />
            </div>
            <button type="submit" className="cta-button primary full-width">
              Envoyer le message
              <span className="cta-arrow">&#8594;</span>
            </button>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-bracket">&lt;</span>
              SB
              <span className="logo-bracket">/&gt;</span>
            </div>
            <p>Expert en automatisation & marketing digital</p>
          </div>
          <div className="footer-links">
            {['Accueil', 'Services', 'Projets', 'Contact'].map(link => (
              <a key={link} href={`#${link.toLowerCase()}`} onClick={(e) => {
                e.preventDefault()
                scrollTo(link === 'Accueil' ? 'home' : link.toLowerCase())
              }}>{link}</a>
            ))}
          </div>
          <div className="footer-copy">
            &copy; {new Date().getFullYear()} Soufiane Boudir. Tous droits reserves.
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatCounter({ value, suffix, label, active }: { value: number; suffix: string; label: string; active: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    let frame: number
    const duration = 2000
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [active, value])

  return (
    <div className="stat-card">
      <span className="stat-value">{count}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function ServiceCard({ icon, title, description, features, featured }: {
  icon: string; title: string; description: string; features: string[]; featured?: boolean
}) {
  return (
    <div className={`service-card ${featured ? 'featured' : ''}`}>
      {featured && <div className="featured-badge">Populaire</div>}
      <span className="service-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <ul className="service-features">
        {features.map(f => <li key={f}><span className="check">&#10003;</span> {f}</li>)}
      </ul>
    </div>
  )
}

function SkillCategory({ title, skills }: { title: string; skills: { name: string; level: number }[] }) {
  return (
    <div className="skill-category">
      <h3>{title}</h3>
      {skills.map(skill => (
        <div key={skill.name} className="skill-item">
          <div className="skill-header">
            <span>{skill.name}</span>
            <span className="skill-percent">{skill.level}%</span>
          </div>
          <div className="skill-bar">
            <div className="skill-fill" style={{ width: `${skill.level}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProjectCard({ title, category, description, tags, metric }: {
  title: string; category: string; description: string; tags: string[]; metric: string
}) {
  return (
    <div className="project-card">
      <div className="project-top">
        <span className="project-category">{category}</span>
        <span className="project-metric">{metric}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="project-tags">
        {tags.map(tag => <span key={tag} className="project-tag">{tag}</span>)}
      </div>
    </div>
  )
}

export default App
