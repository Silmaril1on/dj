"use client";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useMotionTemplate } from "framer-motion";
import { useRef } from "react";
import {
  FiCheck,
  FiCheckCircle,
  FiArrowRight,
  FiZap,
  FiBarChart2,
  FiCalendar,
  FiBell,
  FiStar,
  FiMessageSquare,
  FiGlobe,
  FiGrid,
  FiUsers,
  FiMusic,
  FiMapPin,
  FiHeart,
  FiBookOpen,
  FiEdit3,
  FiShield,
  FiTrendingUp,
  FiSearch,
  FiLink,
} from "react-icons/fi";
import { BiStore } from "react-icons/bi";

const fadeUp = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -64 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const slideRight = {
  hidden: { opacity: 0, x: 64 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Animated Section Wrapper ─────────────────────────────────────────────────

function Reveal({ children, className = "", variants = stagger }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// Feature Card
function FeatureCard({ icon: Icon, title, items, progress, index }) {
  const start = index * 0.1;
  const end = start + 0.4;

  const opacity = useTransform(progress, [start, end], [1, 0]);
  const y = useTransform(progress, [start, end], [0, 50]);
  const scale = useTransform(progress, [start, end], [1, 0.95]);
  const blur = useTransform(progress, [start, end], [0, 8]);

  // ✅ correct way to bind blur
  const filter = useMotionTemplate`blur(${blur}px)`;

  return (
    <motion.div
      style={{
        opacity,
        y,
        scale,
        filter,
      }}
      className="bg-stone-900 border border-gold/50 p-6 hover:border-gold/60 hover:bg-stone-950 transition-all duration-300 group"
    >
      <div className="w-12 h-12 rounded-xl bg-gold/10 center mb-4 group-hover:bg-gold/20 transition-colors duration-300">
        <Icon className="text-gold text-xl" />
      </div>

      <h3 className="text-cream font-semibold text-lg mb-3">{title}</h3>

      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs text-cream/60 secondary"
          >
            <FiCheck className="text-gold mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// Reusable headline component
const HeadlineComponent = ({
  eyebrow,
  title,
  gradientText,
  body,
  divider = true,
  className = "py-28 px-6",
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.08", "start -0.22"],
  });

  const exitScale = useTransform(scrollYProgress, [0, 1], [1, 0.78]);
  const exitOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const exitY = useTransform(scrollYProgress, [0, 1], [0, -32]);

  return (
    <section ref={ref} className={className}>
      <motion.div
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={stagger}
        style={{ scale: exitScale, opacity: exitOpacity, y: exitY }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {eyebrow && (
            <motion.p
              variants={fadeUp}
              className="text-xs tracking-[0.35em] uppercase secondary text-cream mb-4"
            >
              {eyebrow}
            </motion.p>
          )}

          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-5xl font-bold text-cream mb-6 leading-snug"
          >
            {title}
            {gradientText && (
              <span className="soundfolio-gradient">{gradientText}</span>
            )}
          </motion.h2>

          {body && (
            <motion.p
              variants={fadeUp}
              className="text-chino/80 text-lg max-w-2xl mx-auto leading-relaxed secondary"
            >
              {body}
            </motion.p>
          )}
        </div>

        {divider && <Divider />}
      </motion.div>
    </section>
  );
};

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex items-center justify-center my-8">
      <div className="h-px w-1/3 bg-linear-to-r from-transparent to-gold/30" />
      <div className="w-2 h-2 rounded-full bg-gold/50 mx-3 shrink-0" />
      <div className="h-px w-1/3 bg-linear-to-l from-transparent to-gold/30" />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({
  children,
  colorClass = "bg-gold/10 text-gold border-gold/25",
}) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border tracking-widest ${colorClass}`}
    >
      {children}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SoundfolioPresentation = () => {
  return (
    <main className="bg-black text-white overflow-hidden no-main">
      {/* HERO */}
      <Header />
      {/* WHAT IS SOUNDFOLIO */}
      <HeadlineComponent
        eyebrow="What is Soundfolio"
        title="The Unified Platform for "
        gradientText="Electronic Music & Nightlife"
        body="Soundfolio brings the global electronic music ecosystem into one place — connecting artists, events, venues, and audiences through a seamless, data-driven experience."
      />
      {/* THE PROBLEM */}
      <TheProblem />
      {/* CORE ENTITIES */}
      <CoreEntities />
      {/* DISCOVERY */}
      <Discovery />
      {/* USER ENGAGEMENT */}
      <UserEngagement />
      {/* CREATOR TOOLS */}
      <CreatorTools />
      {/* USER ANALYTICS */}
      <UserAnalytics />
      {/* CONTENT & DATA */}
      <ContentData />
      {/* DATA ARCHITECTURE */}
      <DataArchitecture />
      {/* KEY ADVANTAGES */}
      <KeyAdvantages />
      {/* VISION */}
      <HeadlineComponent
        className="py-10"
        eyebrow="Our Vision"
        title="Where Discovery Meets"
        gradientText=" Interaction"
        body="Soundfolio is more than an app — it's an evolving digital infrastructure for the global electronic music scene. A place where discovery meets interaction, data meets experience, and community meets opportunity."
      />
    </main>
  );
};

// ─── HERO HEADER ──────────────────────────────────────────────────────────────
const Header = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 max-w-5xl mx-auto"
      >
        <motion.div variants={fadeUp} className="mb-6">
          <Badge colorClass="bg-cream/20 text-cream border-cream/25">
            Nightlife & Electronic Music · 2025
          </Badge>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="text-[100px] md:text-[150px] font-black tracking-tighter leading-none mb-5"
          style={{
            background:
              "linear-gradient(135deg, #ffd700 0%, #ff8000 55%, #fcb913 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          SOUNDFOLIO
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="text-xl md:text-2xl secondary text-cream/70 max-w-2xl mx-auto mb-10 font-light"
        >
          The Unified Platform for Electronic Music & Nightlife Culture
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: FiSearch, label: "DISCOVER EVENTS" },
            { icon: FiMusic, label: "ARTIST PROFILES" },
            { icon: FiMapPin, label: "CLUBS & VENUES" },
            { icon: FiBarChart2, label: "PERSONAL ANALYTICS" },
          ].map((chip) => (
            <div
              key={chip.label}
              className="flex items-center gap-2 px-4 py-2 bg-gold/15 rounded-full border border-gold/30"
            >
              <chip.icon className="text-gold text-sm" />
              <span className="text-xs text-cream tracking-wider secondary">
                {chip.label}
              </span>
            </div>
          ))}
        </motion.div>

        <motion.div variants={fadeIn} className="mt-20">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-white/50"
          >
            <span className="text-[10px] tracking-[0.4em]">SCROLL</span>
            <div className="w-px h-14 bg-linear-to-b from-white/50 to-transparent" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

// ─── THE PROBLEM ──────────────────────────────────────────────────────────────
const TheProblem = () => {
  const gridRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: gridRef,
    offset: ["start 0.05", "start -0.3"],
  });
  const exitX = useTransform(scrollYProgress, [0, 1], ["0%", "110%"]);

  return (
    <Reveal className="py-24 px-6 bg-white/1.5">
      <div className="max-w-6xl mx-auto">
        <HeadlineComponent
          className="pt-10 pb-5"
          eyebrow="The Problem"
          title="What the Scene"
          gradientText=" is Missing"
          body="The nightlife and electronic music world is fragmented across dozens of platforms with no central home."
        />
        <motion.div
          ref={gridRef}
          variants={stagger}
          style={{ x: exitX }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {[
            {
              number: "01",
              title: "No Central Hub",
              desc: "Artists, events, venues, and festivals live on separate, disconnected platforms with no unified discovery.",
            },
            {
              number: "02",
              title: "Passive Fan Experience",
              desc: "Fans scroll through feeds with zero interaction — no bookmarking, reminders, or engagement tools.",
            },
            {
              number: "03",
              title: "Artists Lack Visibility",
              desc: "Independent DJs and producers have no dedicated space to showcase their identity, music, and schedule.",
            },
            {
              number: "04",
              title: "Promoters Struggle to Reach Audiences",
              desc: "Event creators rely on social media algorithms with no targeted, community-driven distribution.",
            },
            {
              number: "05",
              title: "No Structured Data Layer",
              desc: "Nightlife information is unstructured and unsearchable — making discovery slow, incomplete, and unreliable.",
            },
          ].map((p) => (
            <motion.div
              key={p.number}
              variants={fadeUp}
              className="relative p-6  cursor-pointer border border-crimson/30 bg-crimson/15 hover:border-crimson/40 hover:bg-crimson/10 duration-300 "
            >
              <span className="text-6xl font-bold text-crimson/50 absolute top-3 right-4 select-none">
                {p.number}
              </span>
              <h3 className="text-cream/90 font-bold text-lg mb-2 pr-20">
                {p.title}
              </h3>
              <p className="text-chino/70 secondary text-sm leading-relaxed">
                {p.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Reveal>
  );
};

// ─── CORE ENTITIES ────────────────────────────────────────────────────────────
const CoreEntities = () => {
  const gridRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: gridRef,
    offset: ["start 0.05", "start -0.3"],
  });
  const exitX = useTransform(scrollYProgress, [0, 1], ["0%", "-110%"]);
  return (
    <Reveal className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <HeadlineComponent
          eyebrow="The Ecosystem"
          className="pt-10 pb-5"
          title="Everything in"
          gradientText=" One Platform"
          body="Soundfolio aggregates and organizes every key entity within the nightlife scene into a single, interconnected experience."
        />
        <motion.div
          ref={gridRef}
          variants={stagger}
          style={{ x: exitX }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {[
            {
              icon: FiMusic,
              label: "Artists & DJs",
              desc: "Profiles, music, and live schedules",
            },
            {
              icon: FiCalendar,
              label: "Events",
              desc: "Upcoming shows and lineups worldwide",
            },
            {
              icon: FiStar,
              label: "Festivals",
              desc: "Multi-day experiences and countdown timers",
            },
            {
              icon: BiStore,
              label: "Clubs & Venues",
              desc: "Venue profiles, location, and weekly schedules",
            },
            {
              icon: FiBookOpen,
              label: "News & Updates",
              desc: "User-generated content and scene news",
            },
            {
              icon: FiUsers,
              label: "Community",
              desc: "Fans, professionals, and creators together",
            },
          ].map((item) => (
            <motion.div
              key={item.label}
              variants={fadeUp}
              className="flex items-center gap-4 p-5 rounded-xl bg-gold/10 border border-gold/20 hover:border-gold/40 cursor-pointer hover:bg-gold/10 duration-300 group"
            >
              <div className="w-10 h-10 rounded-lg bg-gold/10 center shrink-0 group-hover:bg-gold/20 transition-colors">
                <item.icon className="text-gold" />
              </div>
              <div className="flex-1 leading-none">
                <span className="text-cream text-md font-medium block">
                  {item.label}
                </span>
                <span className="text-chino/70 secondary  text-xs">
                  {item.desc}
                </span>
              </div>
              <FiArrowRight className="text-chino/80 group-hover:text-gold/70 transition-colors shrink-0" />
            </motion.div>
          ))}
        </motion.div>
        <motion.div variants={fadeUp} className="mt-12 text-center">
          <p className="text-cream/70 text-xs tracking-[0.3em] secondary">
            ALL ENTITIES ARE <span className="text-gold">INTERCONNECTED</span> —
            CREATING A RICH DISCOVERY NETWORK
          </p>
        </motion.div>
      </div>
    </Reveal>
  );
};

// ─── DISCOVERY ────────────────────────────────────────────────────────────────
const Discovery = () => {
  const gridRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: gridRef,
    offset: ["start start", "end start"],
  });

  return (
    <Reveal className="py-24 px-6 bg-white/1.5">
      <div className="max-w-6xl mx-auto">
        <HeadlineComponent
          className="py-10"
          eyebrow="Core Experience"
          title="Discover Everything"
          gradientText=" in One Place"
          body="Every entity is interconnected — browse an artist, discover their upcoming events, find the venue, and navigate there. Seamless end-to-end exploration."
        />

        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <FeatureCard
            index={0}
            progress={scrollYProgress}
            icon={FiSearch}
            title="Smart Discovery"
            items={[
              "Filter events by country & city",
              "Sort by date, popularity, or newest",
              "Browse festivals with countdown timers",
              "Explore clubs by capacity & location",
            ]}
          />

          <FeatureCard
            index={1}
            progress={scrollYProgress}
            icon={FiLink}
            title="Interconnected Data"
            items={[
              "Artists linked to their events",
              "Events linked to their venues",
              "Venues linked to weekly schedules",
              "Festivals linked to full lineups",
            ]}
          />

          <FeatureCard
            index={2}
            progress={scrollYProgress}
            icon={FiGlobe}
            title="Global Reach"
            items={[
              "Events from countries worldwide",
              "Country & city-based filtering",
              "Artists from every corner of the scene",
              "International festival coverage",
            ]}
          />

          <FeatureCard
            index={3}
            progress={scrollYProgress}
            icon={FiTrendingUp}
            title="Trending & Recent"
            items={[
              "Recently viewed profiles",
              "Most liked & popular events",
              "Upcoming festivals highlighted",
              "New artist submissions surfaced",
            ]}
          />
        </div>
      </div>
    </Reveal>
  );
};

// ─── USER ENGAGEMENT ──────────────────────────────────────────────────────────
const UserEngagement = () => {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // LEFT (goes left)
  const leftX = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const leftOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const leftScale = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

  // RIGHT (goes right)
  const rightX = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const rightOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const rightScale = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

  return (
    <Reveal className="py-24 px-6">
      <div ref={sectionRef} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* LEFT SIDE */}
          <motion.div
            style={{
              x: leftX,
              opacity: leftOpacity,
              scale: leftScale,
            }}
          >
            <p className="text-xs secondary text-chino tracking-[0.35em] uppercase mb-4">
              Interactive Engagement
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-cream mb-3 leading-none">
              More Than
              <br />
              <span className="soundfolio-gradient">Just Browsing</span>
            </h2>
            <p className="text-chino secondary text-md leading-relaxed mb-8">
              Registered users become active participants — not passive viewers.
              Every interaction enriches their profile and shapes the platform.
            </p>

            <div className="space-y-3">
              {[
                "Follow artists, clubs, and festivals",
                "Like and review events and artists",
                "Set reminders for upcoming events",
                "Access location details and route navigation",
                "Track recently viewed profiles",
                "Build a personalized activity history",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <FiCheckCircle className="text-gold mt-0.5 shrink-0" />
                  <span className="text-chino/90 text-xs secondary">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            style={{
              x: rightX,
              opacity: rightOpacity,
              scale: rightScale,
            }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              {
                icon: FiHeart,
                label: "Likes & Follows",
                sub: "Stay connected to what matters",
              },
              {
                icon: FiBell,
                label: "Event Reminders",
                sub: "Never miss a show again",
              },
              {
                icon: FiStar,
                label: "Reviews & Ratings",
                sub: "Share your experience",
              },
              {
                icon: FiMapPin,
                label: "Route Navigation",
                sub: "Get there without friction",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="p-5  bg-stone-900 border border-gold/10 hover:border-gold/30 hover:bg-stone-800 transition-all duration-300 group"
              >
                <card.icon className="text-gold text-2xl mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-cream font-bold text-sm mb-1">
                  {card.label}
                </p>
                <p className="text-chino secondary text-xs">{card.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </Reveal>
  );
};

// ─── CREATOR TOOLS ────────────────────────────────────────────────────────────
const CreatorTools = () => {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  return (
    <Reveal className="py-24 px-6 bg-white/1.5">
      <div ref={sectionRef} className="max-w-6xl mx-auto">
        <HeadlineComponent
          className="py-10"
          eyebrow="Industry Tools"
          title="Built for"
          gradientText=" Professionals Too"
          body="Soundfolio isn't just for fans — it empowers every professional in the electronic music ecosystem."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              role: "Artists & DJs",
              icon: FiMusic,
              desc: "Submit and manage professional profiles...",
              features: [
                "Professional profile pages",
                "Music & schedule showcase",
                "Artist verification badge",
                "Linked event appearances",
              ],
              borderColor: "#fcb913",
              glowColor: "rgba(252,185,19,0.10)",
              iconColor: "#fcb913",
            },
            {
              role: "Club & Festival Owners",
              icon: BiStore,
              desc: "Register venues and festivals...",
              features: [
                "Official venue profiles",
                "Weekly schedule management",
                "Festival lineup display",
                "Ticket link integration",
              ],
              borderColor: "#9b59ff",
              glowColor: "rgba(155,89,255,0.10)",
              iconColor: "#9b59ff",
            },
            {
              role: "Promoters",
              icon: FiEdit3,
              desc: "Create and publish events...",
              features: [
                "Event creation & publishing",
                "Lineup & artist tagging",
                "Venue association",
                "Organic audience reach",
              ],
              borderColor: "#4affd7",
              glowColor: "rgba(74,255,215,0.08)",
              iconColor: "#4affd7",
            },
          ].map((item, i) => {
            const start = 0.2 + i * 0.1;
            const end = start + 0.4;

            const opacity = useTransform(scrollYProgress, [start, end], [1, 0]);
            const scale = useTransform(scrollYProgress, [start, end], [1, 0]);
            const x = useTransform(scrollYProgress, [start, end], [0, -80]);
            const blur = useTransform(scrollYProgress, [start, end], [0, 8]);

            const filter = useMotionTemplate`blur(${blur}px)`;

            return (
              <motion.div
                key={item.role}
                style={{
                  opacity,
                  scale,
                  x,
                  filter,
                  border: `1px solid ${item.borderColor}40`,
                  background: `linear-gradient(160deg, ${item.glowColor} 0%, transparent 60%)`,
                }}
                className="relative p-8 overflow-hidden hover:scale-[1.02] transition-transform duration-300"
              >
                <item.icon
                  className="text-4xl mb-4"
                  style={{ color: item.iconColor, opacity: 0.9 }}
                />

                <h3 className="text-cream text-xl font-bold mb-3">
                  {item.role}
                </h3>

                <p className="text-chino secondary text-xs leading-relaxed mb-5">
                  {item.desc}
                </p>

                <ul className="space-y-2">
                  {item.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 secondary text-xs text-cream/50"
                    >
                      <FiCheck
                        className="mt-0.5 shrink-0"
                        style={{ color: item.iconColor }}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div
                  className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full blur-2xl pointer-events-none"
                  style={{ background: item.glowColor }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
};

// ─── USER ANALYTICS ───────────────────────────────────────────────────────────
const UserAnalytics = () => {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // delay so it starts when visually near top
  const start = 0.2;
  const end = 0.6;

  // LEFT (grid → goes left)
  const leftX = useTransform(scrollYProgress, [start, end], [0, -250]);
  const leftOpacity = useTransform(scrollYProgress, [start, end], [1, 0]);
  const leftScale = useTransform(scrollYProgress, [start, end], [1, 0.6]);
  const leftBlur = useTransform(scrollYProgress, [start, end], [0, 6]);
  const leftFilter = useMotionTemplate`blur(${leftBlur}px)`;

  // RIGHT (text → goes right)
  const rightX = useTransform(scrollYProgress, [start, end], [0, 250]);
  const rightOpacity = useTransform(scrollYProgress, [start, end], [1, 0]);
  const rightScale = useTransform(scrollYProgress, [start, end], [1, 0.6]);
  const rightBlur = useTransform(scrollYProgress, [start, end], [0, 6]);
  const rightFilter = useMotionTemplate`blur(${rightBlur}px)`;

  return (
    <Reveal className="py-24 px-6">
      <div ref={sectionRef} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* LEFT SIDE */}
          <motion.div
            style={{
              x: leftX,
              opacity: leftOpacity,
              scale: leftScale,
              filter: leftFilter,
            }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              {
                icon: FiHeart,
                label: "Likes & Interactions",
                sub: "Track what you love",
              },
              {
                icon: FiMessageSquare,
                label: "Reviews & Ratings",
                sub: "Your voice in the scene",
              },
              {
                icon: FiBell,
                label: "Event Reminders",
                sub: "All your saved shows",
              },
              {
                icon: FiEdit3,
                label: "Submitted Content",
                sub: "Artists, events, venues",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="p-5 bg-violet-900/25 border border-violet/10 hover:border-violet/30 hover:bg-violet-900/30 transition-all duration-300 group"
              >
                <card.icon className="text-violet text-2xl mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-cream font-semibold text-sm mb-1">
                  {card.label}
                </p>
                <p className="text-chino/80 secondary text-xs">{card.sub}</p>
              </div>
            ))}
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            style={{
              x: rightX,
              opacity: rightOpacity,
              scale: rightScale,
              filter: rightFilter,
            }}
          >
            <p className="text-xs tracking-[0.35em] secondary uppercase text-chino mb-4">
              Personal Dashboard
            </p>

            <h2 className="text-4xl md:text-5xl font-bold text-cream mb-6 leading-tight">
              Your Activity,
              <br />
              <span className="soundfolio-gradient">Your Insights</span>
            </h2>

            <p className="text-chino secondary text-md leading-relaxed mb-8">
              Every user has access to a personal analytics dashboard — a clear
              overview of their activity, influence, and involvement on the
              platform.
            </p>

            <div className="space-y-3">
              {[
                "Full history of likes and interactions",
                "All your reviews and ratings in one place",
                "Upcoming events you've set reminders for",
                "Manage and track all your submitted content",
                "Measure your engagement and influence",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <FiCheckCircle className="text-violet mt-0.5 shrink-0" />
                  <span className="text-chino/80 secondary text-xs">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Reveal>
  );
};
// ─── CONTENT & DATA ───────────────────────────────────────────────────────────
const ContentData = () => {
  return (
    <Reveal className="py-24 px-6 bg-white/1.5">
      <div className="max-w-5xl mx-auto">
        <HeadlineComponent
          className="py-10"
          eyebrow="Content Control"
          title="Dynamic,"
          gradientText=" Ever-Evolving Ecosystem"
          body="Users don't just consume — they contribute. A constantly growing, community-driven database of nightlife culture."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* content creation */}
          <motion.div
            variants={slideLeft}
            className="p-8  border border-gold/20 bg-gold/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 center rounded-xl bg-gold/10">
                <FiEdit3 className="text-gold" />
              </div>
              <h3 className="text-cream text-xl font-bold">Content Creation</h3>
            </div>

            <div className="space-y-3">
              {[
                "Write and publish news & scene updates",
                "Submit artist & DJ profiles",
                "Create and manage events",
                "Register clubs and venues",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <FiCheckCircle className="text-gold shrink-0" />
                  <span className="text-chino/80 secondary text-sm">
                    {item}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-chino secondary text-sm mt-6 leading-relaxed">
              Publish news, submit artists and events, and maintain your own
              contributed content — all within one unified dashboard.
            </p>
          </motion.div>

          {/* data control */}
          <motion.div
            variants={slideRight}
            className="p-8 border border-green/20 bg-green/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 center rounded-xl bg-green/10">
                <FiShield className="text-green" />
              </div>
              <h3 className="text-cream text-xl font-bold">Data Ownership</h3>
            </div>
            <div className="space-y-4">
              {[
                "Full control over your contributed content",
                "Edit and update submissions at any time",
                "Administration review & approval pipeline",
                "Moderated ecosystem — quality guaranteed",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <FiCheckCircle className="text-green shrink-0" />
                  <span className="text-chino/80 secondary text-sm">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Reveal>
  );
};

// ─── DATA ARCHITECTURE ────────────────────────────────────────────────────────
const DataArchitecture = () => {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  return (
    <Reveal className="py-24 px-6">
      <div ref={sectionRef} className="max-w-6xl mx-auto">
        <HeadlineComponent
          className="py-10"
          eyebrow="Under the Hood"
          title="Data-Centric"
          gradientText=" Architecture"
          body="At its core, Soundfolio is a powerful, unified nightlife database — scalable, searchable, and interconnected."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: FiGrid,
              title: "Structured Aggregation",
              desc: "Every entity — artists, events, venues, festivals — lives in a clean, queryable data model.",
            },
            {
              icon: FiLink,
              title: "Relationship Linking",
              desc: "Artists are linked to events. Events to venues. Venues to schedules. Data points connect naturally.",
            },
            {
              icon: FiSearch,
              title: "Scalable & Searchable",
              desc: "Built to handle thousands of entities with fast filtering by country, city, date, and type.",
            },
            {
              icon: FiBarChart2,
              title: "Intelligent Insights",
              desc: "Interaction data powers rankings, trending content, and personalized discovery.",
            },
          ].map((item, i) => {
            const start = 0.35 + i * 0.1;
            const end = start + 0.4;

            const opacity = useTransform(scrollYProgress, [start, end], [1, 0]);

            const scale = useTransform(scrollYProgress, [start, end], [1, 0]);

            return (
              <motion.div
                key={item.title}
                style={{
                  opacity,
                  scale,
                }}
                className="p-6 border border-violet/20 bg-violet/10 hover:border-violet/40 hover:bg-violet/15 cursor-pointer transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-xl bg-violet/10 center mb-4 group-hover:bg-violet/20 transition-colors">
                  <item.icon className="text-violet" />
                </div>

                <h3 className="text-cream font-semibold mb-2">{item.title}</h3>

                <p className="text-chino/80 secondary text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
};

// ─── KEY ADVANTAGES ───────────────────────────────────────────────────────────
const KeyAdvantages = () => {
  const gridRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: gridRef,
    offset: ["start start", "end start"],
  });

  const start = 0.3;
  const end = 0.7;

  const opacity = useTransform(scrollYProgress, [start, end], [1, 0]);
  const scale = useTransform(scrollYProgress, [start, end], [1, 0]);

  return (
    <Reveal className="py-24 px-6 bg-white/1.5">
      <div className="max-w-6xl mx-auto">
        <HeadlineComponent
          className="py-10"
          eyebrow="Why Soundfolio"
          title="Key"
          gradientText=" Advantages"
          body="Built for the scene. Designed for scale. Ready for the future of nightlife discovery."
        />

        <motion.div
          ref={gridRef}
          style={{ opacity, scale }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {[
            {
              icon: FiGrid,
              title: "Centralized Hub",
              desc: "One platform for all fragmented nightlife data — no more jumping between apps and sites.",
            },
            {
              icon: FiUsers,
              title: "User-Driven Ecosystem",
              desc: "Real interactions, real submissions, and real engagement — not just static listings.",
            },
            {
              icon: FiZap,
              title: "Tools for Professionals",
              desc: "Artists, promoters, and venue owners all have dedicated tools to manage their presence.",
            },
            {
              icon: FiStar,
              title: "Clean, Modern Experience",
              desc: "Thoughtfully designed UI that makes exploration fast, intuitive, and enjoyable.",
            },
            {
              icon: FiBarChart2,
              title: "Personal Analytics",
              desc: "Users understand their own engagement and activity through a dedicated dashboard.",
            },
            {
              icon: FiTrendingUp,
              title: "Scalable Foundation",
              desc: "Architecture ready to grow — more entities, more regions, more data, zero compromise.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 bg-gold/10 border border-gold/15 hover:border-gold/35 hover:bg-gold/10 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/10 center mb-4 group-hover:bg-gold/20 transition-colors">
                <item.icon className="text-gold text-xl" />
              </div>
              <h3 className="text-cream font-semibold mb-2">{item.title}</h3>
              <p className="text-chino/80 secondary text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </Reveal>
  );
};

export default SoundfolioPresentation;
