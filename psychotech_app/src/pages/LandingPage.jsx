import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="landing-page">
      {/* ======================================== */}
      {/* NAVBAR */}
      {/* ======================================== */}
      <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="nav-logo">
          <div className="nav-logo-icon">🧠</div>
          <span className="nav-logo-text">PsychoTech</span>
        </Link>

        <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features') }}>Features</a></li>
          <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works') }}>How It Works</a></li>
          <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about') }}>About</a></li>
          <li>
            <Link to="/login" className="btn-nav btn-nav-login">Log In</Link>
          </li>
          <li>
            <Link to="/signup" className="btn-nav btn-nav-signup">Sign Up</Link>
          </li>
        </ul>

        <div className="nav-buttons">
          <Link to="/login" className="btn-nav btn-nav-login">Log In</Link>
          <Link to="/signup" className="btn-nav btn-nav-signup">Sign Up</Link>
        </div>

        <button 
          className={`nav-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* ======================================== */}
      {/* HERO SECTION */}
      {/* ======================================== */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Your Mental Health<br />
              <span>Matters. We're Here.</span>
            </h1>
            <p>
              PsychoTech is an AI-powered mental health prediction and support 
              platform designed specifically for Nigerian undergraduate students. 
              Take control of your mental well-being with personalized assessments, 
              peer support, and actionable insights.
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn-hero-primary">
                Get Started Free
              </Link>
              <a href="#features" className="btn-hero-secondary" onClick={(e) => { e.preventDefault(); scrollToSection('features') }}>
                Learn More
              </a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <h3>99%</h3>
                <p>Model Accuracy</p>
              </div>
              <div className="hero-stat">
                <h3>47+</h3>
                <p>Student Responses</p>
              </div>
              <div className="hero-stat">
                <h3>24/7</h3>
                <p>Peer Support</p>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">🧠</div>
          </div>
        </div>
      </section>

      {/* ======================================== */}
      {/* FEATURES SECTION */}
      {/* ======================================== */}
      <section id="features" className="landing-features">
        <div className="section-header">
          <h2>Why <span>PsychoTech</span>?</h2>
          <p>Designed to support your mental health journey with cutting-edge technology and compassionate community.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>AI Risk Prediction</h3>
            <p>Get accurate mental health risk assessments powered by machine learning with 99% accuracy.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Comprehensive Assessment</h3>
            <p>Complete PHQ-9 and GAD-7 screenings along with academic, lifestyle, and socio-environmental factors.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Anonymous Community</h3>
            <p>Connect with peers who understand. Share experiences and support each other in a safe, moderated space.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Safe & Moderated</h3>
            <p>Dual-layer message monitoring with automated keyword filtering and manual reporting keeps everyone safe.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Track Your Progress</h3>
            <p>Visualize your mental health journey with interactive charts showing your PHQ-9 and GAD-7 scores over time.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌙</div>
            <h3>Personalized Tips</h3>
            <p>Receive wellness recommendations tailored to your risk level, updated hourly based on the time of day.</p>
          </div>
        </div>
      </section>

      {/* ======================================== */}
      {/* HOW IT WORKS SECTION */}
      {/* ======================================== */}
      <section id="how-it-works" className="landing-how">
        <div className="section-header">
          <h2>How <span>It Works</span></h2>
          <p>Getting started is simple. Follow these steps to begin your mental health journey.</p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h4>Create Account</h4>
            <p>Sign up with your email and create your anonymous profile. Your identity is protected.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h4>Take Assessment</h4>
            <p>Complete the comprehensive mental health assessment with PHQ-9 and GAD-7 screenings.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h4>Get Your Results</h4>
            <p>Receive your personalized risk assessment, wellness tips, and actionable recommendations.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h4>Connect & Track</h4>
            <p>Join the community, track your progress over time, and monitor your mental health journey.</p>
          </div>
        </div>
      </section>

      {/* ======================================== */}
      {/* ABOUT SECTION */}
      {/* ======================================== */}
      <section id="about" className="landing-features" style={{ background: 'var(--white)' }}>
        <div className="section-header">
          <h2>About <span>PsychoTech</span></h2>
          <p>Built for Nigerian students, by researchers who understand.</p>
        </div>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: 'var(--text-gray)', lineHeight: '1.8', marginBottom: '20px' }}>
            PsychoTech is a research project developed as part of a BSc Computer Science program 
            at David Umahi Federal University of Health Sciences, Uburu. The system combines 
            machine learning, web technology, and peer support to address the mental health needs 
            of Nigerian undergraduate students.
          </p>
          <p style={{ fontSize: '16px', color: 'var(--text-gray)', lineHeight: '1.8' }}>
            Using validated instruments like PHQ-9 and GAD-7, along with academic and lifestyle 
            factors, PsychoTech provides accurate risk predictions and connects students with 
            the support they need.
          </p>
        </div>
      </section>

      {/* ======================================== */}
      {/* CTA SECTION */}
      {/* ======================================== */}
      <section className="landing-cta">
        <h2>Ready to Take Control of Your Mental Health?</h2>
        <p>Join hundreds of Nigerian students already using PsychoTech.</p>
        <Link to="/signup" className="btn-cta">
          Get Started Now →
        </Link>
      </section>

      {/* ======================================== */}
      {/* FOOTER */}
      {/* ======================================== */}
      <footer className="landing-footer">
        <p>© 2026 PsychoTech. All rights reserved.</p>
        <p>
          David Umahi Federal University of Health Sciences, Uburu — 
          BSc Computer Science Project
        </p>
        <p style={{ marginTop: '12px', fontSize: '12px', opacity: '0.6' }}>
          🧠 Mental health matters. You are not alone.
        </p>
      </footer>
    </div>
  )
}

export default LandingPage