import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import FadeContent from "./reactbits/FadeContent.jsx";
import DepthCarousel from "./reactbits/DepthCarousel.jsx";
import AnimatedList from "./reactbits/AnimatedList.jsx";
import ScrollStack, { ScrollStackItem } from "./reactbits/ScrollStack.jsx";
import FluidGlass from "./reactbits/FluidGlass.jsx";
import "./reactbits/DepthCarousel.css";
import "./reactbits/AnimatedList.css";
import "./reactbits/ScrollStack.css";
import "./reactbits/FluidGlass.css";
import "./immersive-ui.css";

const carouselItems = [
  { image: "/visuals/activity-impact.svg", alt: "Measure everyday activities and their environmental impact" },
  { image: "/visuals/category-insight.svg", alt: "Understand the emissions categories behind your footprint" },
  { image: "/visuals/goal-trajectory.svg", alt: "Follow a reduction goal and its progress trajectory" },
  { image: "/visuals/community-network.svg", alt: "Join optional anonymous community progress" }
];

const journey = [
  { id: "measure", icon: "◉", title: "Log everyday activity", description: "Transport · electricity · food · shopping", meta: "01" },
  { id: "preview", icon: "⌁", title: "See the CO₂e estimate", description: "Emission factors turn quantities into impact", meta: "02" },
  { id: "understand", icon: "◌", title: "Read the patterns", description: "Compare categories and weekly trends", meta: "03" },
  { id: "improve", icon: "↗", title: "Follow your next goal", description: "Track a target with a pace-based estimate", meta: "04" }
];

function ImpactScene() {
  const host = useRef(null);
  useEffect(() => {
    const root = host.current;
    if (!root) return undefined;
    let renderer;
    let scene;
    let resizeObserver;
    let onResize;
    let animationFrame = 0;
    try {
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
      camera.position.set(0, 0, 7.6);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.15 : 1.5));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      root.appendChild(renderer.domElement);

      const group = new THREE.Group();
      scene.add(group);
      scene.add(new THREE.AmbientLight(0x9abca7, 1.1));
      const light = new THREE.PointLight(0x9ce78b, 25, 18);
      light.position.set(-3.5, 2.5, 4.5);
      scene.add(light);
      const violet = new THREE.PointLight(0xc77de9, 15, 15);
      violet.position.set(3, -2.5, -2);
      scene.add(violet);

      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(1.61, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0x10251e, transparent: true, opacity: 0.72, wireframe: true })
      );
      group.add(globe);

      const pointPositions = [];
      const pointColors = [];
      const count = 2300;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const lime = new THREE.Color(0xc7f58a);
      const pale = new THREE.Color(0x92d8cf);
      const purple = new THREE.Color(0xc28be8);
      for (let i = 0; i < count; i += 1) {
        const y = 1 - (i / (count - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        const latitude = Math.asin(y);
        const longitude = Math.atan2(z, x);
        const continentA = Math.pow((Math.sin(longitude * 2.2 + 0.5) * 0.55 + Math.cos(latitude * 3.1) * 0.42), 2);
        const continentB = Math.pow((Math.cos(longitude * 1.8 - 1.3) * 0.5 + Math.sin(latitude * 4.5) * 0.5), 2);
        const isLand = continentA > 0.27 || continentB > 0.31;
        const r = 1.64 + (Math.sin(i * 8.73) * 0.008);
        pointPositions.push(x * r, y * r, z * r);
        const color = isLand ? lime.clone().lerp(pale, Math.abs(y) * 0.55) : pale.clone().lerp(purple, (Math.sin(i * 0.11) + 1) * 0.12);
        pointColors.push(color.r, color.g, color.b);
      }
      const pointGeometry = new THREE.BufferGeometry();
      pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(pointPositions, 3));
      pointGeometry.setAttribute("color", new THREE.Float32BufferAttribute(pointColors, 3));
      const dots = new THREE.Points(pointGeometry, new THREE.PointsMaterial({
        size: 0.018,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        depthWrite: false
      }));
      group.add(dots);

      const outerGlow = new THREE.Mesh(
        new THREE.SphereGeometry(1.73, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0x9de5ac, transparent: true, opacity: 0.035, side: THREE.BackSide })
      );
      group.add(outerGlow);

      const makeOrbit = (radius, tube, color, rotation, opacity) => {
        const mesh = new THREE.Mesh(
          new THREE.TorusGeometry(radius, tube, 6, 180),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
        );
        mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
        group.add(mesh);
        return mesh;
      };
      const orbitA = makeOrbit(2.12, 0.009, 0xd17be6, [1.07, 0.27, -0.2], 0.78);
      const orbitB = makeOrbit(2.35, 0.007, 0x9de57b, [0.35, 1.14, 0.56], 0.73);
      const orbitC = makeOrbit(2.58, 0.005, 0x8b9cde, [1.43, -0.4, 0.85], 0.42);

      const satellites = new THREE.Group();
      const satMaterial = new THREE.MeshStandardMaterial({ color: 0xe7efa7, emissive: 0x647b32, emissiveIntensity: 1.1, metalness: 0.45, roughness: 0.28 });
      [[2.12, 0.15, 0.1], [-1.86, 0.94, 0.24], [0.35, -2.1, -0.35], [1.46, 1.47, -0.5]].forEach((p, i) => {
        const node = new THREE.Mesh(new THREE.SphereGeometry(i === 0 ? 0.075 : 0.047, 16, 16), satMaterial);
        node.position.set(p[0], p[1], p[2]);
        satellites.add(node);
      });
      group.add(satellites);

      const starsGeometry = new THREE.BufferGeometry();
      const stars = [];
      for (let i = 0; i < 500; i += 1) {
        stars.push((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 9, -2 - Math.random() * 5);
      }
      starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(stars, 3));
      const starField = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0x9caeaa, size: 0.012, transparent: true, opacity: 0.6 }));
      scene.add(starField);

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

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        renderer.render(scene, camera);
      } else {
        let last = 0;
        renderer.setAnimationLoop((time) => {
          if (time - last < 32) return;
          last = time;
          group.rotation.y = time * 0.0001;
          group.rotation.x = Math.sin(time * 0.00012) * 0.045;
          orbitA.rotation.z = -0.2 + Math.sin(time * 0.00013) * 0.11;
          orbitB.rotation.x = 0.35 + Math.cos(time * 0.00011) * 0.1;
          orbitC.rotation.y = -0.4 + Math.sin(time * 0.00009) * 0.08;
          satellites.rotation.y = -time * 0.00017;
          starField.rotation.z = time * 0.000004;
          renderer.render(scene, camera);
        });
      }
    } catch {
      root.dataset.fallback = "true";
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      if (renderer) {
        renderer.setAnimationLoop(null);
        renderer.dispose();
        if (renderer.domElement.parentNode === root) root.removeChild(renderer.domElement);
      }
      resizeObserver?.disconnect();
      if (!resizeObserver && onResize) window.removeEventListener("resize", onResize);
      scene?.traverse((object) => {
        object.geometry?.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, []);

  return <div ref={host} className="impact-scene" aria-hidden="true">
    <div className="impact-scene-grid" />
    <div className="impact-scene-fallback">c</div>
  </div>;
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
  return <div className="immersive-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="immersive-auth-modal" role="dialog" aria-modal="true" aria-labelledby="immersive-auth-title">
      <button className="immersive-modal-close" type="button" onClick={onClose} aria-label="Close sign in dialog">×</button>
      <div className="immersive-auth-orb" />
      <span className="immersive-eyebrow">CARBONTRACK / YOUR PERSONAL SPACE</span>
      <h2 id="immersive-auth-title">{mode === "login" ? "Welcome back." : "Start with one action."}</h2>
      <p>{mode === "login" ? "Your footprint story continues here." : "Create an account to start measuring your everyday impact."}</p>
      <div className="immersive-auth-tabs">
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button>
        <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Create account</button>
      </div>
      <form className="immersive-auth-form" onSubmit={submit}>
        <label><span>Username</span><input required minLength={3} autoComplete="username" placeholder="Your username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        {mode === "register" && <label><span>Email address</span><input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
        <label><span>Password</span><input required type="password" maxLength={72} minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "login" ? "Your password" : "At least 8 characters"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <div className="immersive-auth-error" role="alert">{error}</div>}
        <button className="immersive-primary" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Enter CarbonTrack ↗" : "Create account ↗"}</button>
      </form>
      <small className="immersive-auth-foot">Your personal records stay under your control.</small>
    </section>
  </div>;
}

export default function LandingExperience({ onLogin, onRegister, busy, error }) {
  const [authMode, setAuthMode] = useState(null);
  const [selectedJourney, setSelectedJourney] = useState("measure");
  const openAuth = (mode) => setAuthMode(mode);
  return <div className="immersive-landing" id="home">
    <div className="immersive-grain" />
    <header className="immersive-header">
      <a className="immersive-brand" href="#home" aria-label="CarbonTrack home"><span>c</span><b>carbon<span>track</span><small>IMPACT, IN FOCUS</small></b></a>
      <nav>
        <a href="#experience">Experience</a>
        <a href="#method">Method</a>
        <a href="#privacy">Privacy</a>
      </nav>
      <div className="immersive-header-actions">
        <button className="immersive-login" type="button" onClick={() => openAuth("login")}>Sign in</button>
        <button className="immersive-primary immersive-header-cta" type="button" onClick={() => openAuth("register")}>Get started <span>↗</span></button>
      </div>
    </header>

    <main>
      <section className="immersive-hero">
        <div className="immersive-hero-copy">
          <FadeContent effect="focus" blur={7} duration={1.15} delay={0.1}>
            <div className="immersive-status"><i /> PERSONAL CARBON INTELLIGENCE</div>
            <h1>See your impact.<br /><em>Shift your orbit.</em></h1>
            <p>CarbonTrack turns daily choices into a clearer picture of your footprint — then helps you decide what to change next.</p>
            <div className="immersive-hero-actions">
              <button className="immersive-primary immersive-hero-cta" type="button" onClick={() => openAuth("register")}>Start tracking <span>↗</span></button>
              <a href="#experience" className="immersive-hero-link">Explore the system <span>↓</span></a>
            </div>
            <div className="immersive-proof">
              <span><i>01</i> Activity intelligence</span>
              <span><i>02</i> Goal trajectories</span>
              <span><i>03</i> Opt-in community</span>
            </div>
          </FadeContent>
        </div>
        <div className="immersive-hero-visual">
          <ImpactScene />
          <div className="immersive-orbit-label orbit-label-one"><span className="orbit-label-dot lime" /><div><b>PERSONAL IMPACT</b><small>Measure what you do</small></div></div>
          <div className="immersive-orbit-label orbit-label-two"><span className="orbit-label-dot violet" /><div><b>REDUCTION PATH</b><small>Follow your progress</small></div></div>
          <div className="immersive-coordinate">12° 58' N / 77° 35' E <span>GLOBAL VIEW / 001</span></div>
        </div>
        <div className="immersive-side-note">A BETTER VIEW OF EVERYDAY IMPACT <span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className="immersive-marquee">
        <span>MEASURE</span><i /> <span>UNDERSTAND</span><i /> <span>IMPROVE</span><i /> <span>REPEAT</span><i /> <span>MEASURE</span>
      </section>

      <section className="immersive-section immersive-experience" id="experience">
        <div className="immersive-section-heading">
          <FadeContent effect="develop" blur={4}>
            <span className="immersive-eyebrow">01 / THE CARBONTRACK SYSTEM</span>
            <h2>One footprint.<br /><em>Many dimensions.</em></h2>
          </FadeContent>
          <p>Your activity data becomes a connected view of impact, patterns and momentum. Explore the system in depth.</p>
        </div>
        <FadeContent effect="fade" blur={3} delay={0.05}>
          <div className="immersive-depth-wrap">
            <DepthCarousel
              items={carouselItems}
              cardWidth={360}
              cardHeight={440}
              radius={18}
              tint="#070b0a"
              depth={220}
              spread={105}
              tilt={24}
              perspective={1500}
              visibleCards={3}
              falloff={0.22}
              blur={2.5}
              duration={760}
              autoplay
              autoplayDelay={4300}
              loop
              showControls
              showIndicators
              className="immersive-depth-carousel"
            />
            <div className="immersive-carousel-caption"><span>INTERACTIVE FEATURE GALLERY</span><span>DRAG / SCROLL / SELECT</span></div>
          </div>
        </FadeContent>
      </section>

      <section className="immersive-section immersive-method" id="method">
        <div className="immersive-method-copy">
          <FadeContent effect="focus" blur={5}>
            <span className="immersive-eyebrow">02 / FROM ACTION TO INSIGHT</span>
            <h2>Small actions.<br /><em>Clear signals.</em></h2>
            <p>Start with a simple activity log. Follow the data through to a practical next step, with no extra complexity in the workflow.</p>
          </FadeContent>
          <div className="immersive-selected-step"><span>SELECTED STEP</span><b>{journey.find((item) => item.id === selectedJourney)?.title || "Log everyday activity"}</b><small>{journey.find((item) => item.id === selectedJourney)?.description || ""}</small></div>
        </div>
        <div className="immersive-list-wrap">
          <AnimatedList
            items={journey}
            initialSelectedIndex={0}
            selectOnHover
            enableArrowNavigation
            loop
            animation="pop"
            stagger={0.07}
            showGradients
            displayScrollbar={false}
            frame
            theme="dark"
            accentColor="#c9f47a"
            radius={15}
            gap={9}
            width="100%"
            maxHeight={360}
            className="immersive-animated-list"
            onItemSelect={(item) => setSelectedJourney(item.id)}
            renderItem={(item, index, selected) => <><span className="immersive-list-icon">{item.icon}</span><span className="animated-list__text"><span className="animated-list__title">{item.title}</span><span className="animated-list__description">{item.description}</span></span><span className="immersive-list-number">{item.meta}</span></>}
          />
          <span className="immersive-list-foot">KEYBOARD ↑ ↓ / ENTER TO SELECT</span>
        </div>
      </section>

      <section className="immersive-section immersive-stack-section" id="privacy">
        <div className="immersive-section-heading">
          <FadeContent effect="fade" blur={4}>
            <span className="immersive-eyebrow">03 / BUILT AROUND REAL PROGRESS</span>
            <h2>Insight that leads<br /><em>somewhere useful.</em></h2>
          </FadeContent>
          <p>Three principles shape the experience: understand the data, keep goals practical, and make sharing a choice.</p>
        </div>
        <ScrollStack
          useWindowScroll
          itemDistance={90}
          itemStackDistance={26}
          stackPosition="17%"
          itemScale={0.055}
          baseScale={0.94}
          dimAmount={0.24}
          blurAmount={0.2}
          tiltAmount={0.5}
          rotationAmount={0.4}
          holdDistance={140}
          smoothScroll={false}
          snap={false}
          className="immersive-scroll-stack"
        >
          <ScrollStackItem itemClassName="immersive-stack-card stack-card-green">
            <span className="immersive-stack-index">01 / PERSONAL ANALYTICS</span>
            <div className="immersive-stack-main"><h3>See the whole picture,<br />not just one score.</h3><p>Read your category breakdown, daily footprint and weekly comparisons to find the patterns behind your impact.</p></div>
            <span className="immersive-stack-symbol">◉</span>
          </ScrollStackItem>
          <ScrollStackItem itemClassName="immersive-stack-card stack-card-violet">
            <span className="immersive-stack-index">02 / GOALS THAT MOVE</span>
            <div className="immersive-stack-main"><h3>Follow the trajectory.<br />Choose your next move.</h3><p>Set a personal reduction target and compare observed emissions with a pace-based projection across the goal period.</p></div>
            <span className="immersive-stack-symbol">↗</span>
          </ScrollStackItem>
          <ScrollStackItem itemClassName="immersive-stack-card stack-card-amber">
            <span className="immersive-stack-index">03 / PRIVACY BY CHOICE</span>
            <div className="immersive-stack-main"><h3>Share intentionally.<br />Keep control.</h3><p>Community ranking and organisation reporting use separate opt-in choices. Your individual account remains yours to manage.</p></div>
            <span className="immersive-stack-symbol">⌑</span>
          </ScrollStackItem>
        </ScrollStack>
      </section>

      <section className="immersive-closing">
        <div className="immersive-closing-fluid" aria-hidden="true">
          <FluidGlass
            text=""
            shape="lens"
            shapes={["lens", "torus", "diamond"]}
            size={215}
            refraction={1.25}
            dispersion={0.38}
            reflection={1.15}
            frost={0.12}
            color="#d9f7c2"
            tint={0.12}
            shadow={0.35}
            elevation={0.25}
            interaction="static"
            smoothness={0.62}
            wobble={0.32}
            spin={0.12}
            idle
            morphOnClick={false}
            intro
            maxDevicePixelRatio={1.5}
          />
        </div>
        <div className="closing-orbit closing-orbit-one" /><div className="closing-orbit closing-orbit-two" />
        <FadeContent effect="focus" blur={5}>
          <span className="immersive-eyebrow">YOUR NEXT DECISION IS THE START</span>
          <h2>Make the invisible<br /><em>measurable.</em></h2>
          <p>One activity is enough to begin. The bigger picture follows.</p>
          <button className="immersive-primary immersive-closing-cta" type="button" onClick={() => openAuth("register")}>Create your CarbonTrack account <span>↗</span></button>
        </FadeContent>
      </section>
    </main>

    <footer className="immersive-footer">
      <a className="immersive-brand" href="#home"><span>c</span><b>carbon<span>track</span><small>IMPACT, IN FOCUS</small></b></a>
      <span>Measure what matters. Improve what you can.</span>
      <a href="#home">BACK TO TOP ↑</a>
    </footer>

    {authMode && <AuthDialog mode={authMode} setMode={setAuthMode} onLogin={onLogin} onRegister={onRegister} busy={busy} error={error} onClose={() => setAuthMode(null)} />}
  </div>;
}
