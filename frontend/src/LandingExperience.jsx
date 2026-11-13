import "./landing.css";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const featureCards = [
  {
    number: "01",
    eyebrow: "MEASURE",
    title: "Make the invisible visible.",
    body: "Log transport, electricity, food and shopping choices. CarbonTrack turns everyday quantities into comparable CO₂e estimates.",
    tone: "mint",
    icon: "◉"
  },
  {
    number: "02",
    eyebrow: "UNDERSTAND",
    title: "Find the changes that matter.",
    body: "Read your category mix, compare weekly patterns and see where your footprint is really coming from.",
    tone: "gold",
    icon: "◌"
  },
  {
    number: "03",
    eyebrow: "IMPROVE",
    title: "Turn intention into momentum.",
    body: "Set a reduction goal, follow your progress and use practical recommendations to make your next choice count.",
    tone: "violet",
    icon: "↗"
  }
];

const journeyItems = [
  { number: "01", title: "Record a real-world action", text: "Choose a category, enter a quantity and see an estimated impact before saving." },
  { number: "02", title: "Understand your footprint", text: "Use clear summaries and trends to see how your everyday decisions add up." },
  { number: "03", title: "Choose your next improvement", text: "Set a target, follow your pace and build habits around measurable progress." },
  { number: "04", title: "Make progress together", text: "Use opt-in community and organisation features without giving up control of your data." }
];

function FadeContent({ children, className = "", delay = 0 }) {
  const element = useRef(null);
  useEffect(() => {
    const node = element.current;
    if (!node) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      node.dataset.visible = "true";
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.dataset.visible = "true";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={element} className={"fade-content " + className} style={{ "--fade-delay": delay + "ms" }}>{children}</div>;
}

function AnimatedList({ items, className = "" }) {
  return <div className={"spiral-list " + className}>
    {items.map((item, index) => (
      <article className="spiral-list-item" key={item.number} style={{ "--item-index": index }}>
        <span className="spiral-index">{item.number}</span>
        <div><b>{item.title}</b><p>{item.text}</p></div>
        <span className="spiral-arrow" aria-hidden="true">↗</span>
      </article>
    ))}
  </div>;
}

function DepthCarousel({ items }) {
  const [active, setActive] = useState(0);
  const length = items.length;
  const move = (amount) => setActive((current) => (current + amount + length) % length);
  const touchStart = useRef(null);
  return <div className="depth-carousel" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => {
    if (touchStart.current == null) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
    touchStart.current = null;
  }}>
    <div className="depth-stage" aria-live="polite">
      {items.map((item, index) => {
        const offset = (index - active + length) % length;
        const position = offset === 0 ? "front" : offset === 1 ? "right" : offset === length - 1 ? "left" : "hidden";
        return <article key={item.number} className={"depth-card " + position + " depth-" + item.tone} aria-hidden={position !== "front"} style={{ "--depth-order": offset }}>
          <div className="depth-card-top"><span>{item.eyebrow}</span><b>{item.number} / 03</b></div>
          <div className="depth-icon">{item.icon}</div>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          <span className="depth-card-line" />
        </article>;
      })}
    </div>
    <div className="depth-controls">
      <div className="depth-dots" aria-label="Choose feature">
        {items.map((item, index) => <button key={item.number} type="button" className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-label={"Show " + item.eyebrow.toLowerCase() + " feature"} />)}
      </div>
      <div className="depth-arrows">
        <button type="button" onClick={() => move(-1)} aria-label="Previous feature">←</button>
        <button type="button" onClick={() => move(1)} aria-label="Next feature">→</button>
      </div>
    </div>
  </div>;
}

function ScrollStack({ items }) {
  return <div className="story-stack">
    {items.map((item, index) => (
      <article className={"story-card story-card-" + index} key={item.number} style={{ "--stack-index": index }}>
        <span className="story-number">{item.number}</span>
        <div className="story-content">
          <span className="story-eyebrow">{item.eyebrow}</span>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
        <span className="story-symbol">{item.icon}</span>
      </article>
    ))}
  </div>;
}

function ImpactScene() {
  const host = useRef(null);
  useEffect(() => {
    const root = host.current;
    if (!root) return undefined;
    let renderer;
    let scene;
    let resizeObserver;
    let onResize;
    try {
      scene = new THREE.Scene();
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 80);
      camera.position.set(0, 0, 7.2);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.6));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      root.appendChild(renderer.domElement);

      const world = new THREE.Group();
      scene.add(world);
      scene.add(new THREE.AmbientLight(0xffffff, 1.6));
      const keyLight = new THREE.PointLight(0xb4f2ba, 34, 18);
      keyLight.position.set(-3, 3, 5);
      scene.add(keyLight);
      const rimLight = new THREE.PointLight(0xe0c77c, 22, 14);
      rimLight.position.set(4, -2, -3);
      scene.add(rimLight);

      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(1.48, 64, 64),
        new THREE.MeshPhysicalMaterial({ color: 0x246747, roughness: 0.34, metalness: 0.12, clearcoat: 0.9, clearcoatRoughness: 0.22 })
      );
      world.add(planet);

      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(1.58, 40, 40),
        new THREE.MeshBasicMaterial({ color: 0x9be3a0, transparent: true, opacity: 0.08, side: THREE.BackSide })
      );
      world.add(shell);

      const wire = new THREE.Mesh(
        new THREE.SphereGeometry(1.51, 28, 18),
        new THREE.MeshBasicMaterial({ color: 0xb0e8b3, wireframe: true, transparent: true, opacity: 0.16 })
      );
      world.add(wire);

      const ringA = new THREE.Mesh(
        new THREE.TorusGeometry(2.03, 0.012, 8, 160),
        new THREE.MeshBasicMaterial({ color: 0xc3df9c, transparent: true, opacity: 0.68 })
      );
      ringA.rotation.set(1.02, 0.24, -0.24);
      world.add(ringA);
      const ringB = new THREE.Mesh(
        new THREE.TorusGeometry(2.34, 0.008, 8, 160),
        new THREE.MeshBasicMaterial({ color: 0xe2c879, transparent: true, opacity: 0.54 })
      );
      ringB.rotation.set(0.28, 1.1, 0.52);
      world.add(ringB);

      const points = [];
      for (let index = 0; index < 420; index += 1) {
        const y = 1 - (index / 419) * 2;
        const radius = Math.sqrt(1 - y * y);
        const angle = Math.PI * (3 - Math.sqrt(5)) * index;
        points.push(Math.cos(angle) * radius * 1.68, y * 1.68, Math.sin(angle) * radius * 1.68);
      }
      const pointGeometry = new THREE.BufferGeometry();
      pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      const stars = new THREE.Points(pointGeometry, new THREE.PointsMaterial({ color: 0xd4f1b2, size: 0.025, transparent: true, opacity: 0.86, sizeAttenuation: true }));
      world.add(stars);

      const satellites = new THREE.Group();
      const satelliteMaterial = new THREE.MeshStandardMaterial({ color: 0xe6d18b, emissive: 0x594321, emissiveIntensity: 0.7, roughness: 0.28, metalness: 0.5 });
      [[2.02, 0.2, 0.1], [-1.8, 0.95, 0.25], [0.4, -2.15, -0.35], [1.42, 1.5, -0.55]].forEach((point, index) => {
        const node = new THREE.Mesh(new THREE.SphereGeometry(index === 0 ? 0.085 : 0.052, 18, 18), satelliteMaterial);
        node.position.set(point[0], point[1], point[2]);
        satellites.add(node);
      });
      world.add(satellites);

      onResize = () => {
        if (!root.clientWidth || !root.clientHeight) return;
        camera.aspect = root.clientWidth / root.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(root.clientWidth, root.clientHeight);
      };
      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(root);
      } else {
        window.addEventListener("resize", onResize);
      }

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let lastFrame = 0;
      renderer.setAnimationLoop((time) => {
        if (reduced) {
          renderer.render(scene, camera);
          return;
        }
        if (time - lastFrame < 32) return;
        lastFrame = time;
        world.rotation.y = time * 0.00009;
        world.rotation.x = Math.sin(time * 0.00016) * 0.055;
        ringA.rotation.z = -0.24 + Math.sin(time * 0.00018) * 0.08;
        ringB.rotation.y = 1.1 + Math.cos(time * 0.00014) * 0.12;
        satellites.rotation.y = -time * 0.00013;
        renderer.render(scene, camera);
      });
    } catch {
      root.dataset.fallback = "true";
    }

    return () => {
      if (renderer) {
        renderer.setAnimationLoop(null);
        renderer.dispose();
        if (renderer.domElement.parentNode === root) root.removeChild(renderer.domElement);
      }
      if (resizeObserver) resizeObserver.disconnect();
      else if (onResize) window.removeEventListener("resize", onResize);
      if (scene) {
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => material.dispose());
          }
        });
      }
    };
  }, []);

  return <div ref={host} className="impact-scene" aria-hidden="true">
    <div className="scene-orbit scene-orbit-one" />
    <div className="scene-orbit scene-orbit-two" />
    <div className="scene-glow" />
    <span className="scene-fallback-mark">c</span>
  </div>;
}

function Brand() {
  return <a href="#top" className="landing-brand" aria-label="CarbonTrack home">
    <span className="landing-brand-mark">c</span>
    <span>carbon<span>track</span><small>MAKE IMPACT VISIBLE</small></span>
  </a>;
}

function AuthDialog({ mode, setMode, onLogin, onRegister, busy, error, onClose }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (mode === "login") await onLogin(username, password);
    else await onRegister(username, email, password);
  }
  return <div className="landing-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="landing-auth-modal" role="dialog" aria-modal="true" aria-labelledby="landing-auth-title">
      <button className="landing-modal-close" type="button" onClick={onClose} aria-label="Close sign in dialog">×</button>
      <span className="landing-auth-kicker">YOUR NEXT STEP STARTS HERE</span>
      <h2 id="landing-auth-title">{mode === "login" ? "Welcome back." : "Create your space."}</h2>
      <p>{mode === "login" ? "Sign in to continue tracking your impact." : "Build a clearer picture of your everyday footprint."}</p>
      <div className="landing-auth-tabs">
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button>
        <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Create account</button>
      </div>
      <form className="landing-auth-form" onSubmit={submit}>
        <label><span>Username</span><input required minLength={3} autoComplete="username" placeholder="Your username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        {mode === "register" && <label><span>Email address</span><input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
        <label><span>Password</span><input required type="password" maxLength={72} minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "login" ? "Your password" : "At least 8 characters"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <div className="landing-auth-error" role="alert">{error}</div>}
        <button className="landing-primary-button landing-auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in to CarbonTrack ↗" : "Create my account ↗"}</button>
      </form>
      <small className="landing-auth-privacy">Your footprint is personal. Your data stays under your control.</small>
    </section>
  </div>;
}

export default function LandingPage({ onLogin, onRegister, busy, error }) {
  const [authMode, setAuthMode] = useState(null);
  const openAuth = (mode) => setAuthMode(mode);
  return <div className="landing-page" id="top">
    <div className="landing-noise" />
    <header className="landing-header">
      <Brand />
      <nav className="landing-nav" aria-label="Main navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#features">What you can track</a>
        <a href="#principles">Our approach</a>
      </nav>
      <div className="landing-header-actions">
        <button type="button" className="landing-login-button" onClick={() => openAuth("login")}>Sign in</button>
        <button type="button" className="landing-primary-button landing-header-cta" onClick={() => openAuth("register")}>Get started <span>↗</span></button>
      </div>
    </header>

    <main>
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <FadeContent>
            <div className="landing-pill"><span /> PERSONAL CARBON TRACKING, MADE CLEAR</div>
            <h1>Small choices.<br /><em>Lasting impact.</em></h1>
            <p className="landing-lede">Your everyday decisions shape your footprint. CarbonTrack helps you measure them, understand the patterns and make changes that add up.</p>
            <div className="landing-hero-actions">
              <button type="button" className="landing-primary-button landing-hero-cta" onClick={() => openAuth("register")}>Start tracking your impact <span>↗</span></button>
              <a className="landing-secondary-link" href="#how-it-works">Explore the experience <span>↓</span></a>
            </div>
            <div className="landing-proof-row">
              <span><i>✓</i> Personal footprint insights</span>
              <span><i>✓</i> Goals you can measure</span>
            </div>
          </FadeContent>
        </div>
        <div className="landing-hero-visual">
          <ImpactScene />
          <div className="floating-note note-top"><span className="note-icon">↗</span><div><b>Everyday impact</b><small>Turn activity into insight</small></div></div>
          <div className="floating-note note-bottom"><span className="note-spark">✳</span><div><b>Progress, not perfection</b><small>One better choice at a time</small></div></div>
          <div className="hero-side-caption">A CLEARER VIEW OF YOUR FOOTPRINT <span>01 / 03</span></div>
        </div>
        <div className="landing-scroll-cue"><span /> SCROLL TO EXPLORE</div>
      </section>

      <section className="landing-signal-strip">
        <div><span>01</span><b>MEASURE</b><small>Everyday activities</small></div>
        <div><span>02</span><b>UNDERSTAND</b><small>Patterns and categories</small></div>
        <div><span>03</span><b>IMPROVE</b><small>Goals and habits</small></div>
        <p>Not another number to chase. A clearer way to choose.</p>
      </section>

      <section className="landing-section landing-how" id="how-it-works">
        <FadeContent className="landing-section-heading">
          <span className="landing-section-kicker">A SIMPLE, USEFUL ROUTINE</span>
          <h2>From daily actions<br /><em>to visible progress.</em></h2>
          <p>CarbonTrack brings activity logging, footprint analytics and reduction goals into one connected workspace.</p>
        </FadeContent>
        <div className="landing-how-grid">
          <div className="landing-how-intro">
            <span className="orbit-number">A / 03</span>
            <h3>Make your next choice with context.</h3>
            <p>Start with the things you already do. Add a little context, understand the impact and use that information to decide what to change next.</p>
            <a href="#features">See the features <span>↗</span></a>
            <div className="mini-orbit"><span /><span /><span /></div>
          </div>
          <AnimatedList items={journeyItems} />
        </div>
      </section>

      <section className="landing-section landing-features" id="features">
        <div className="landing-feature-heading">
          <FadeContent>
            <span className="landing-section-kicker">BUILT AROUND YOUR EVERYDAY</span>
            <h2>Everything connected.<br /><em>Nothing complicated.</em></h2>
          </FadeContent>
          <p>Move from a single activity to a bigger picture with tools that stay focused on useful, understandable information.</p>
        </div>
        <DepthCarousel items={featureCards} />
      </section>

      <section className="landing-section landing-principles" id="principles">
        <div className="landing-principles-top">
          <FadeContent>
            <span className="landing-section-kicker">DESIGNED FOR REAL PROGRESS</span>
            <h2>Clarity first.<br /><em>Action follows.</em></h2>
          </FadeContent>
          <p>A good footprint tracker should help you make sense of your data, keep your goals in view and make privacy choices explicit.</p>
        </div>
        <ScrollStack items={[
          { number: "01", eyebrow: "UNDERSTAND YOUR DATA", title: "See the full picture, not just a score.", body: "Use your activity history, category breakdown and weekly comparisons to spot the patterns behind your footprint.", icon: "◉" },
          { number: "02", eyebrow: "KEEP GOALS PRACTICAL", title: "Make the next step feel achievable.", body: "Set a target that makes sense for you, then follow recorded progress and a clearly labelled pace-based estimate.", icon: "↗" },
          { number: "03", eyebrow: "PRIVACY BY CHOICE", title: "Your data. Your decision to share.", body: "Community ranking and organisation reporting are opt-in. Your individual account remains yours to manage.", icon: "⌑" }
        ]} />
      </section>

      <section className="landing-final-cta">
        <div className="cta-orb" />
        <span className="landing-section-kicker">YOUR FOOTPRINT IS A PLACE TO START</span>
        <h2>Make the next choice<br /><em>a more informed one.</em></h2>
        <p>Start with one activity. Build a clearer picture from there.</p>
        <button type="button" className="landing-light-button" onClick={() => openAuth("register")}>Create your CarbonTrack account <span>↗</span></button>
        <small>No perfection required. Just a place to begin.</small>
      </section>
    </main>

    <footer className="landing-footer">
      <Brand />
      <span>Measure what matters. Improve what you can.</span>
      <div><a href="#top">Back to top ↑</a><span>CARBONTRACK · PERSONAL SUSTAINABILITY</span></div>
    </footer>

    {authMode && <AuthDialog mode={authMode} setMode={setAuthMode} onLogin={onLogin} onRegister={onRegister} busy={busy} error={error} onClose={() => setAuthMode(null)} />}
  </div>;
}
