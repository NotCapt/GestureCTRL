import React, { useState, useEffect } from 'react';

const LandingPage = ({ onGetStarted }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
    const [selectedPlan, setSelectedPlan] = useState('free'); // 'free' | 'starter' | 'pro'

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 3);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

        const els = Array.from(document.querySelectorAll('[data-animate]'));
        if (els.length === 0) return;

        const io = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                }
            }
        }, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });

        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const plans = [
        {
            id: 'free',
            name: 'Free',
            popular: false,
            monthly: 0,
            yearly: 0,
            desc: 'Get started with core gesture controls.',
        },
        {
            id: 'starter',
            name: 'Starter',
            popular: true,
            monthly: 799,
            yearly: 5999,
            desc: 'More gestures, faster training, and presets.',
        },
        {
            id: 'pro',
            name: 'Pro',
            popular: false,
            monthly: 1499,
            yearly: 10999,
            desc: 'Power user features for daily workflow automation.',
        },
    ];

    const formatPrice = (n) => {
        if (n === 0) return '₹0';
        return `₹${n.toLocaleString('en-IN')}`;
    };

    return (
        <div className="landing-container">
            <style>
                {`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

          :root {
            --lp-bg: #0A0B0F;
            --lp-accent: #00FFB2;
            --lp-text: #E8E9ED;
            --lp-text-muted: #9CA0B0;
          }

          .landing-container {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: var(--lp-bg);
            color: var(--lp-text);
            min-height: 100vh;
            overflow-x: hidden;
            position: relative;
          }

          /* Scroll reveal animations */
          [data-animate] {
            opacity: 0;
            transform: translateY(18px);
            transition:
              opacity 700ms ease,
              transform 800ms cubic-bezier(0.22, 1, 0.36, 1);
            will-change: transform, opacity;
          }

          [data-animate].in-view {
            opacity: 1;
            transform: translateY(0);
          }

          [data-animate="fade"] { transform: none; }

          @media (prefers-reduced-motion: reduce) {
            [data-animate] {
              opacity: 1 !important;
              transform: none !important;
              transition: none !important;
            }
            .gradient-mesh, .mesh-blob, .live-fill {
              animation: none !important;
            }
          }

          /* Animated Gradient Background */
          .gradient-mesh {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100vh;
            z-index: 0;
            background: 
              radial-gradient(at 0% 0%, rgba(76, 29, 149, 0.15) 0px, transparent 50%),
              radial-gradient(at 98% 1%, rgba(5, 150, 105, 0.15) 0px, transparent 50%),
              radial-gradient(at 0% 100%, rgba(219, 39, 119, 0.1) 0px, transparent 50%),
              radial-gradient(at 98% 100%, rgba(124, 58, 237, 0.15) 0px, transparent 50%);
            animation: backgroundShift 20s ease-in-out infinite alternate;
          }
          
          .mesh-blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.6;
            animation: float 20s infinite;
          }

          .blob-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: #4c1d95; animation-delay: 0s; }
          .blob-2 { top: 20%; right: -20%; width: 40vw; height: 40vw; background: #059669; animation-delay: -5s; }
          .blob-3 { bottom: -10%; left: 20%; width: 60vw; height: 40vw; background: #db2777; animation-delay: -10s; }

          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }

          /* Navbar */
          .landing-nav {
            position: sticky;
            top: 0;
            z-index: 50;
            padding: 20px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(10, 11, 15, 0.7);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }

          .nav-logo {
            font-family: 'DM Mono', monospace;
            font-weight: 700;
            font-size: 20px;
            letter-spacing: -0.5px;
            color: #fff;
          }

          .nav-links {
            display: flex;
            gap: 32px;
          }

          .nav-link {
            color: var(--lp-text-muted);
            text-decoration: none;
            font-weight: 500;
            font-size: 15px;
            transition: color 0.2s;
          }
          .nav-link:hover { color: #fff; }

          .nav-actions {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .btn-pill {
            padding: 8px 16px;
            border-radius: 999px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .btn-text { background: none; border: none; color: #fff; }
          .btn-text:hover { opacity: 0.8; }

          .btn-outline {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #fff;
          }
          .btn-outline:hover { background: rgba(255, 255, 255, 0.15); }

          /* Hero Section */
          .hero-section {
            position: relative;
            z-index: 10;
            max-width: 1200px;
            margin: 0 auto;
            padding: 100px 32px;
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 60px;
            align-items: center;
          }

          .hero-content h1 {
            font-size: 64px;
            line-height: 1.1;
            font-weight: 800;
            margin-bottom: 24px;
            letter-spacing: -2px;
          }

          .hero-gradient-text {
            background: linear-gradient(135deg, #00FFB2 0%, #00CC8E 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .hero-sub {
            font-size: 20px;
            color: var(--lp-text-muted);
            line-height: 1.6;
            margin-bottom: 40px;
            max-width: 540px;
          }

          .cta-row {
            display: flex;
            gap: 12px;
            max-width: 480px;
          }

          .cta-input {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 999px;
            padding: 14px 24px;
            color: #fff;
            font-family: inherit;
            font-size: 16px;
          }
          .cta-input::placeholder { color: rgba(255, 255, 255, 0.3); }

          .btn-cta {
            background: var(--lp-accent);
            color: #000;
            border: none;
            padding: 14px 28px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .btn-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 255, 178, 0.3);
          }

          /* Floating Cards */
          .hero-visual {
            position: relative;
            perspective: 1000px;
          }

          .float-card {
            background: rgba(18, 19, 26, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 24px;
            position: absolute;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .card-main {
            width: 340px;
            top: -180px;
            right: 0;
            transform: rotateY(-12deg) rotateX(6deg) translateX(0);
            z-index: 2;
          }
          .card-main:hover {
            transform: rotateY(-8deg) rotateX(4deg) translateZ(20px);
          }

          .card-back {
            width: 300px;
            top: -40px;
            right: -60px;
            transform: rotateY(-12deg) rotateX(6deg) translateZ(-50px);
            z-index: 1;
            opacity: 0.8;
          }

          .mock-ui-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-family: 'DM Mono', monospace;
            font-size: 12px;
            color: var(--lp-text-muted);
          }

          .mock-gesture-icon {
            width: 80px;
            height: 80px;
            background: rgba(0, 255, 178, 0.1);
            border-radius: 16px;
            display: grid;
            place-items: center;
            font-size: 32px;
            margin: 0 auto 20px;
            border: 1px solid rgba(0, 255, 178, 0.2);
            color: var(--lp-accent);
          }

          .mock-label {
            text-align: center;
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 8px;
          }
          
          .mock-action {
            text-align: center;
            color: var(--lp-text-muted);
            font-size: 14px;
            background: rgba(255, 255, 255, 0.05);
            padding: 6px 12px;
            border-radius: 8px;
            display: inline-block;
            margin: 0 auto;
            width: 100%;
          }

          .live-bar {
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            margin-top: 12px;
            overflow: hidden;
          }
          .live-fill {
            height: 100%;
            background: var(--lp-accent);
            width: 85%;
            border-radius: 3px;
            animation: pulseBar 2s infinite;
          }

          @keyframes pulseBar {
            0%, 100% { width: 85%; opacity: 1; }
            50% { width: 92%; opacity: 0.8; }
          }

          /* Logo Strip */
          .logo-strip {
            max-width: 1200px;
            margin: 40px auto;
            padding: 0 32px;
            display: flex;
            align-items: center;
            gap: 40px;
            overflow: hidden;
          }
          
          .logo-label {
            font-size: 14px;
            font-weight: 600;
            color: var(--lp-text-muted);
            white-space: nowrap;
          }

          .logos {
            display: flex;
            gap: 40px;
            align-items: center;
            opacity: 0.5;
            filter: grayscale(1);
          }

          .text-logo {
            font-weight: 700;
            font-size: 18px;
            color: #fff;
          }

          /* How It Works */
          .features-section {
            max-width: 1200px;
            margin: 120px auto;
            padding: 0 32px;
          }

          .feature-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 40px;
          }

          .feature-col {
            position: relative;
            padding-left: 24px;
          }
          .feature-col::before {
             content: '';
             position: absolute;
             left: 0;
             top: 0;
             bottom: 0;
             width: 1px;
             background: linear-gradient(to bottom, var(--lp-accent), transparent);
          }

          .feature-col.in-view {
            transition-delay: var(--delay, 0ms);
          }

          .step-num {
            font-family: 'DM Mono', monospace;
            color: var(--lp-accent);
            font-size: 14px;
            margin-bottom: 16px;
            display: block;
          }

          .feature-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 12px;
          }

          .feature-desc {
            color: var(--lp-text-muted);
            line-height: 1.6;
            font-size: 16px;
          }

          /* Pricing */
          .pricing-section {
            max-width: 1200px;
            margin: 120px auto 140px;
            padding: 0 32px;
            position: relative;
            z-index: 10;
          }

          .pricing-wrap {
            display: grid;
            grid-template-columns: 1fr 520px;
            gap: 48px;
            align-items: center;
          }

          .pricing-kicker {
            font-family: 'DM Mono', monospace;
            color: rgba(0, 255, 178, 0.9);
            font-size: 12px;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            margin-bottom: 14px;
          }

          .pricing-title {
            font-size: 44px;
            line-height: 1.1;
            font-weight: 800;
            letter-spacing: -1.2px;
            margin-bottom: 14px;
          }

          .pricing-sub {
            color: var(--lp-text-muted);
            font-size: 16px;
            line-height: 1.7;
            max-width: 520px;
          }

          .pricing-card {
            background: rgba(18, 19, 26, 0.78);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 18px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(18px);
          }

          .billing-toggle {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            padding: 10px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.08);
            margin-bottom: 14px;
          }

          .billing-btn {
            border: none;
            border-radius: 999px;
            padding: 12px 14px;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            background: transparent;
            color: rgba(232, 233, 237, 0.85);
            transition: transform 0.15s, background 0.2s, color 0.2s;
          }

          .billing-btn:hover {
            transform: translateY(-1px);
            color: #fff;
          }

          .billing-btn.active {
            background: rgba(255, 255, 255, 0.10);
            border: 1px solid rgba(255, 255, 255, 0.14);
            color: #fff;
          }

          .plan-list {
            display: grid;
            gap: 12px;
            margin-top: 10px;
          }

          .plan-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            padding: 16px 16px;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.16);
            background: rgba(255, 255, 255, 0.04);
            cursor: pointer;
            transition: border-color 0.2s, background 0.2s, transform 0.15s;
          }

          .plan-row:hover {
            transform: translateY(-1px);
            background: rgba(255, 255, 255, 0.06);
          }

          .plan-row.selected {
            border-color: rgba(0, 255, 178, 0.55);
            background: rgba(0, 255, 178, 0.08);
          }

          .plan-left {
            min-width: 0;
          }

          .plan-name {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.3px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .plan-popular {
            font-size: 12px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 999px;
            background: rgba(255, 210, 77, 0.16);
            color: #FFD24D;
            border: 1px solid rgba(255, 210, 77, 0.28);
          }

          .plan-price {
            margin-top: 6px;
            color: rgba(232, 233, 237, 0.92);
            font-weight: 700;
            font-size: 16px;
          }

          .plan-price span {
            color: rgba(156, 160, 176, 0.95);
            font-weight: 600;
          }

          .plan-desc {
            margin-top: 10px;
            color: var(--lp-text-muted);
            font-size: 13px;
            line-height: 1.5;
          }

          .plan-radio {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2px solid rgba(232, 233, 237, 0.35);
            display: grid;
            place-items: center;
            margin-top: 2px;
            flex: 0 0 auto;
          }

          .plan-row.selected .plan-radio {
            border-color: rgba(0, 255, 178, 0.9);
          }

          .plan-radio::after {
            content: '';
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(0, 255, 178, 0.95);
            transform: scale(0);
            transition: transform 0.18s ease;
          }

          .plan-row.selected .plan-radio::after {
            transform: scale(1);
          }

          .pricing-cta {
            margin-top: 14px;
            width: 100%;
            border: none;
            border-radius: 999px;
            padding: 16px 18px;
            font-weight: 800;
            font-size: 16px;
            cursor: pointer;
            background: var(--lp-accent);
            color: #000;
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .pricing-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 28px rgba(0, 255, 178, 0.28);
          }

          .pricing-footnote {
            margin-top: 10px;
            font-size: 12px;
            color: rgba(156, 160, 176, 0.9);
            text-align: center;
          }

          @media (max-width: 960px) {
            .hero-section { grid-template-columns: 1fr; text-align: center; padding-top: 60px; }
            .hero-visual { display: none; }
            .cta-row { margin: 0 auto; }
            .feature-grid { grid-template-columns: 1fr; }
            .nav-links { display: none; }
            .pricing-wrap { grid-template-columns: 1fr; }
          }
        `}
            </style>

            <div className="gradient-mesh">
                <div className="mesh-blob blob-1"></div>
                <div className="mesh-blob blob-2"></div>
                <div className="mesh-blob blob-3"></div>
            </div>

            <nav className="landing-nav">
                <div className="nav-logo">gesturectrl</div>
                <div className="nav-links">
                    <a
                        href="#how-it-works"
                        className="nav-link"
                        onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
                    >
                        Features
                    </a>
                    <a
                        href="#how-it-works"
                        className="nav-link"
                        onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
                    >
                        How it works
                    </a>
                    <a href="#" className="nav-link">Docs</a>
                    <a
                        href="#pricing"
                        className="nav-link"
                        onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}
                    >
                        Pricing
                    </a>
                </div>
                <div className="nav-actions">
                    <button className="btn-text" onClick={onGetStarted}>Sign in</button>
                    <button className="btn-pill btn-outline" onClick={onGetStarted}>Start free &rarr;</button>
                </div>
            </nav>

            <main className="hero-section">
                <div className="hero-content" data-animate>
                    <h1>
                        Control your desktop<br />
                        with just your <span className="hero-gradient-text">hands</span>
                    </h1>
                    <p className="hero-sub">
                        GestureCtrl lets you add, train, and use custom hand gestures
                        to control any app on your computer — no hardware required.
                    </p>

                    <div className="cta-row">
                        <input type="email" placeholder="email@example.com" className="cta-input" />
                        <button className="btn-cta" onClick={onGetStarted}>Get Started</button>
                    </div>
                </div>

                <div className="hero-visual" data-animate style={{ transitionDelay: '120ms' }}>
                    <div className="float-card card-back">
                        <div className="mock-ui-header">
                            <span>LIVE DETECTION</span>
                            <span style={{ color: '#00FFB2' }}>● ON</span>
                        </div>
                        <div style={{ height: '140px', background: '#1A1B24', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A5E70' }}>
                            [Camera Feed]
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                <span style={{ color: '#00FFB2' }}>Open Palm</span>
                                <span className="font-mono">98%</span>
                            </div>
                            <div className="live-bar"><div className="live-fill"></div></div>
                        </div>
                    </div>

                    <div className="float-card card-main">
                        <div className="mock-ui-header">
                            <span>NEW GESTURE</span>
                            <span>EDIT</span>
                        </div>
                        <div className="mock-gesture-icon">
                            ✌️
                        </div>
                        <div className="mock-label">Victory Sign</div>
                        <div className="mock-action">
                            <span style={{ opacity: 0.6 }}>Action: </span>
                            Play/Pause Media
                        </div>
                    </div>
                </div>
            </main>

            <div className="logo-strip" data-animate="fade">
                <span className="logo-label">Works seamlessly with</span>
                <div className="logos">
                    <span className="text-logo">Windows</span>
                    <span className="text-logo">macOS</span>
                    <span className="text-logo">Linux</span>
                    <span className="text-logo">Chrome</span>
                    <span className="text-logo">VS Code</span>
                </div>
            </div>

            <div className="features-section" id="how-it-works" data-animate>
                <div className="feature-grid">
                    <div className="feature-col" data-animate style={{ '--delay': '0ms' }}>
                        <span className="step-num">01</span>
                        <h3 className="feature-title">Add a Gesture</h3>
                        <p className="feature-desc">Define a new custom gesture by giving it a name and assigning a keyboard shortcut or system action.</p>
                    </div>
                    <div className="feature-col" data-animate style={{ '--delay': '120ms' }}>
                        <span className="step-num">02</span>
                        <h3 className="feature-title">Collect Samples</h3>
                        <p className="feature-desc">Use your webcam to record a few seconds of video samples. Our AI learns your unique hand movements instantly.</p>
                    </div>
                    <div className="feature-col" data-animate style={{ '--delay': '240ms' }}>
                        <span className="step-num">03</span>
                        <h3 className="feature-title">Control Your Desktop</h3>
                        <p className="feature-desc">Run the detection engine in the background and control music, switch apps, or mute your mic with a wave.</p>
                    </div>
                </div>
            </div>

            <section className="pricing-section" id="pricing" data-animate>
                <div className="pricing-wrap">
                    <div data-animate>
                        <div className="pricing-kicker">Pricing</div>
                        <div className="pricing-title">Pick a plan that fits your flow</div>
                        <div className="pricing-sub">
                            Start free, then upgrade when you’re ready for more gestures, faster iteration, and power-user controls.
                        </div>
                    </div>

                    <div className="pricing-card" data-animate style={{ transitionDelay: '120ms' }}>
                        <div className="billing-toggle" role="tablist" aria-label="Billing cycle">
                            <button
                                type="button"
                                className={`billing-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                                onClick={() => setBillingCycle('monthly')}
                            >
                                Monthly
                            </button>
                            <button
                                type="button"
                                className={`billing-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                                onClick={() => setBillingCycle('yearly')}
                            >
                                Yearly
                            </button>
                        </div>

                        <div className="plan-list" role="radiogroup" aria-label="Plan selection">
                            {plans.map((p) => {
                                const price = billingCycle === 'yearly' ? p.yearly : p.monthly;
                                const suffix = billingCycle === 'yearly' ? '/year' : '/month';
                                const selected = selectedPlan === p.id;
                                return (
                                    <div
                                        key={p.id}
                                        className={`plan-row ${selected ? 'selected' : ''}`}
                                        role="radio"
                                        aria-checked={selected}
                                        tabIndex={0}
                                        onClick={() => setSelectedPlan(p.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setSelectedPlan(p.id);
                                            }
                                        }}
                                    >
                                        <div className="plan-left">
                                            <div className="plan-name">
                                                {p.name}
                                                {p.popular && <span className="plan-popular">Popular</span>}
                                            </div>
                                            <div className="plan-price">
                                                {formatPrice(price)}<span>{suffix}</span>
                                            </div>
                                            <div className="plan-desc">{p.desc}</div>
                                        </div>
                                        <div className="plan-radio" aria-hidden="true" />
                                    </div>
                                );
                            })}
                        </div>

                        <button className="pricing-cta" onClick={onGetStarted}>
                            Get Started
                        </button>
                        <div className="pricing-footnote">
                            {billingCycle === 'yearly' ? 'Save more with annual billing.' : 'Switch to yearly anytime.'}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
