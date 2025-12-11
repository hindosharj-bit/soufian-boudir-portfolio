import './App.css'
import { useState } from 'react'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">SB</div>
        <button 
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          &#9776;
        </button>
        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      <section id="home" className="hero">
        <div className="hero-content">
          <h1>Soufiane Boudir</h1>
          <p className="subtitle">AI & Automation Expert</p>
          <p className="tagline">Building intelligent solutions for logistics & automation</p>
          <button className="cta-button">Get in Touch</button>
        </div>
      </section>

      <section id="about" className="about">
        <h2>About Me</h2>
        <p>I'm an AI and automation expert with experience in building intelligent solutions for logistics and supply chain optimization.</p>
      </section>

      <section id="skills" className="skills">
        <h2>Skills</h2>
        <div className="skill-grid">
          <div className="skill-card">AI & Machine Learning</div>
          <div className="skill-card">Automation & RPA</div>
          <div className="skill-card">Full Stack Development</div>
          <div className="skill-card">Cloud Architecture</div>
        </div>
      </section>

      <section id="projects" className="projects">
        <h2>Projects</h2>
        <div className="project-grid">
          <div className="project-card">
            <h3>BOCA Food Automation</h3>
            <p>AI-powered inventory optimization system</p>
          </div>
          <div className="project-card">
            <h3>Colis Prive Integration</h3>
            <p>Logistics automation platform</p>
          </div>
        </div>
      </section>

      <section id="contact" className="contact">
        <h2>Get In Touch</h2>
        <p>I'm always interested in hearing about new projects and opportunities.</p>
        <div className="contact-links">
          <button className="contact-btn">LinkedIn</button>
          <button className="contact-btn">GitHub</button>
          <button className="contact-btn">Email</button>
        </div>
      </section>

      <footer className="footer">
        <p>© 2025 Soufiane Boudir. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
