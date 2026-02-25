import { motion } from "motion/react";

// ============================================
// CONTINUOUS LIQUID GRADIENT BACKGROUND
// This flows seamlessly across the entire page
// ============================================

export function LiquidGradientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white dark:bg-neutral-950">
      {/* Subtle top gradient - light mode */}
      <div 
        className="absolute inset-0 dark:hidden"
        style={{
          background: "linear-gradient(180deg, rgba(248, 250, 252, 1) 0%, rgba(255, 255, 255, 1) 30%, rgba(255, 255, 255, 1) 100%)",
        }}
      />
      {/* Dark mode gradient */}
      <div 
        className="absolute inset-0 hidden dark:block"
        style={{
          background: "linear-gradient(180deg, rgba(10, 10, 10, 1) 0%, rgba(5, 5, 5, 1) 100%)",
        }}
      />
      {/* Single subtle accent - light mode */}
      <div 
        className="absolute -top-[300px] left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full blur-[150px] dark:hidden"
        style={{ background: "rgba(59, 130, 246, 0.04)" }}
      />
      {/* Dark mode accent */}
      <div 
        className="absolute -top-[300px] left-1/2 hidden h-[600px] w-[800px] -translate-x-1/2 rounded-full blur-[150px] dark:block"
        style={{ background: "rgba(16, 185, 129, 0.08)" }}
      />
    </div>
  );
}

// ============================================
// DEMO PAGE SHOWCASING ALL THEMES
// ============================================

// Theme 1: Gradient Beams (diagonal light rays)
function GradientBeamsBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/50" />
      <motion.div
        className="absolute top-0 -left-[20%] h-[200%] w-[40%] rotate-[25deg] bg-gradient-to-r from-transparent via-blue-200/40 to-transparent blur-[2px]"
        animate={{ x: [0, 100, 0], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-0 -left-[10%] h-[200%] w-[25%] rotate-[25deg] bg-gradient-to-r from-transparent via-violet-200/30 to-transparent blur-[2px]"
        animate={{ x: [0, 80, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-0 left-[40%] h-[200%] w-[30%] rotate-[25deg] bg-gradient-to-r from-transparent via-cyan-200/25 to-transparent blur-[2px]"
        animate={{ x: [0, 60, 0], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
    </div>
  );
}

// Theme 2: Morphing Blob (single large animated shape)
function MorphingBlobBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2"
        animate={{
          borderRadius: [
            "60% 40% 30% 70% / 60% 30% 70% 40%",
            "30% 60% 70% 40% / 50% 60% 30% 60%",
            "60% 40% 30% 70% / 60% 30% 70% 40%",
          ],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(6, 182, 212, 0.08) 100%)",
          filter: "blur(40px)",
        }}
      />
    </div>
  );
}

// Theme 3: Gradient Stripes (angled color bands)
function GradientStripesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              transparent 0%, 
              transparent 20%,
              rgba(59, 130, 246, 0.08) 20%,
              rgba(59, 130, 246, 0.08) 25%,
              transparent 25%,
              transparent 40%,
              rgba(139, 92, 246, 0.06) 40%,
              rgba(139, 92, 246, 0.06) 45%,
              transparent 45%,
              transparent 60%,
              rgba(6, 182, 212, 0.05) 60%,
              rgba(6, 182, 212, 0.05) 65%,
              transparent 65%,
              transparent 80%,
              rgba(59, 130, 246, 0.04) 80%,
              rgba(59, 130, 246, 0.04) 85%,
              transparent 85%
            )
          `,
        }}
      />
      <div className="absolute top-[20%] -right-[200px] h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-blue-200/30 to-transparent blur-[80px]" />
    </div>
  );
}

// Theme 4: Spotlight Effect (dramatic top-down light)
function SpotlightBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-white to-white" />
      <motion.div
        className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2"
        style={{
          background: "conic-gradient(from 90deg at 50% 0%, transparent 0deg, rgba(59, 130, 246, 0.12) 60deg, rgba(139, 92, 246, 0.08) 120deg, transparent 180deg)",
          filter: "blur(60px)",
        }}
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute top-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 bg-gradient-to-b from-white via-transparent to-transparent" />
    </div>
  );
}

// Theme 5: Particle Field (floating dots with depth)
function ParticleFieldBackground() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30" />
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-400"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
      <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-b from-blue-100/30 to-transparent blur-[100px]" />
    </div>
  );
}

// Theme 6: Glassmorphism Layers (stacked frosted panels)
function GlassLayersBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50" />
      <motion.div
        className="absolute top-[10%] -left-[10%] h-[400px] w-[500px] rotate-[-15deg] rounded-3xl border border-white/50 bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-sm"
        animate={{ y: [0, 20, 0], rotate: [-15, -12, -15] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[20%] -right-[5%] h-[350px] w-[450px] rotate-[10deg] rounded-3xl border border-white/50 bg-gradient-to-br from-blue-100/40 to-transparent backdrop-blur-sm"
        animate={{ y: [0, -15, 0], rotate: [10, 13, 10] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute -bottom-[5%] left-[20%] h-[300px] w-[400px] rotate-[5deg] rounded-3xl border border-white/50 bg-gradient-to-tr from-violet-100/30 to-transparent backdrop-blur-sm"
        animate={{ y: [0, 15, 0], rotate: [5, 8, 5] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
    </div>
  );
}

// Theme 7: Noise Gradient (textured gradient)
function NoiseGradientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 via-white to-violet-100/40" />
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <filter id="noise-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{ filter: "url(#noise-filter)" }}
      />
      <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-blue-200/50 to-transparent blur-[100px]" />
    </div>
  );
}

// Theme 8: Liquid Gradient (flowing color blend) - STANDALONE VERSION
function LiquidGradientBackgroundStandalone() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(255,255,255,1) 40%, rgba(139, 92, 246, 0.1) 100%)",
            "linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(255,255,255,1) 50%, rgba(6, 182, 212, 0.1) 100%)",
            "linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(255,255,255,1) 45%, rgba(59, 130, 246, 0.12) 100%)",
            "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(255,255,255,1) 40%, rgba(139, 92, 246, 0.1) 100%)",
          ],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// Theme 9: Geometric Shapes (floating abstract forms)
function GeometricShapesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white" />
      <motion.div
        className="absolute top-[15%] left-[10%] h-[200px] w-[200px] rounded-full border-2 border-blue-200/50"
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-[10%] right-[15%] h-[150px] w-[150px] border-2 border-violet-200/40"
        style={{ borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-[20%] left-[20%] h-[180px] w-[180px] rotate-45 border-2 border-cyan-200/40"
        animate={{ rotate: [45, 135, 45], y: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[25%] bottom-[15%] h-[120px] w-[120px] rounded-full bg-gradient-to-br from-blue-100/40 to-transparent"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-blue-100/20 to-transparent blur-[80px]" />
    </div>
  );
}

// Theme 10: Aurora Waves (flowing aurora borealis)
function AuroraWavesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />
      <motion.div
        className="absolute -top-[50%] right-0 left-0 h-[800px]"
        style={{
          background: "linear-gradient(180deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 30%, rgba(6, 182, 212, 0.1) 60%, transparent 100%)",
          filter: "blur(60px)",
        }}
        animate={{
          y: [0, 50, 0],
          scaleY: [1, 1.1, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-[40%] right-0 left-0 h-[600px]"
        style={{
          background: "linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 40%, transparent 100%)",
          filter: "blur(80px)",
        }}
        animate={{
          y: [0, -30, 0],
          scaleY: [1, 0.9, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}

// Theme 11: Split Gradient (bold color division)
function SplitGradientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-white" />
      <motion.div
        className="absolute top-0 -left-[20%] h-full w-[60%] skew-x-[-10deg]"
        style={{
          background: "linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)",
        }}
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-0 -right-[10%] h-full w-[50%] skew-x-[-10deg]"
        style={{
          background: "linear-gradient(180deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%)",
        }}
        animate={{ x: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <div className="absolute top-[30%] left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-white to-transparent blur-[60px]" />
    </div>
  );
}

// Theme 12: Prism Light (refracted light effect)
function PrismLightBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-white" />
      <motion.div
        className="absolute -top-[100px] left-[20%] h-[600px] w-[100px] rotate-[30deg]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), rgba(251, 146, 60, 0.1), rgba(250, 204, 21, 0.1), rgba(74, 222, 128, 0.1), rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1), transparent)",
          filter: "blur(20px)",
        }}
        animate={{ x: [0, 200, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-[50px] right-[30%] h-[500px] w-[80px] rotate-[25deg]"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1), transparent)",
          filter: "blur(15px)",
        }}
        animate={{ x: [0, -150, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />
    </div>
  );
}

// ============================================
// DEMO SECTIONS
// ============================================

function Section({ bg, label, labelColor, description }: { 
  bg: React.ReactNode; 
  label: string; 
  labelColor: string;
  description: string;
}) {
  return (
    <section className="relative min-h-[70vh] overflow-hidden border-neutral-200 border-b py-20">
      {bg}
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-4 text-center">
          <span className={`inline-block rounded-full px-3 py-1 font-medium text-xs ${labelColor}`}>
            {label}
          </span>
        </div>
        <h1 className="mb-6 text-center">
          <span className="block font-light font-serif text-[44px] text-neutral-900 leading-[1.1] tracking-[-0.02em] sm:text-[56px] md:text-[72px]">
            Take Your Brand to the
          </span>
          <span className="mt-1 block font-light font-serif text-[44px] text-neutral-900 italic leading-[1.1] tracking-[-0.02em] sm:text-[56px] md:text-[72px]">
            Top of Search<span className="text-blue-600">.</span>
          </span>
        </h1>
        <p className="mx-auto max-w-xl text-center text-neutral-500">
          {description}
        </p>
      </div>
    </section>
  );
}

// ============================================
// COMBINED DEMO PAGE
// ============================================

export function LandingSectionsDemo() {
  return (
    <div className="bg-white">
      <Section
        bg={<GradientBeamsBackground />}
        label="Theme 1: Gradient Beams"
        labelColor="bg-blue-100 text-blue-700"
        description="Animated diagonal light rays. Dynamic, premium, catches attention without overwhelming."
      />
      <Section
        bg={<MorphingBlobBackground />}
        label="Theme 2: Morphing Blob"
        labelColor="bg-violet-100 text-violet-700"
        description="Single large shape that morphs and rotates. Hypnotic, modern, very unique."
      />
      <Section
        bg={<GradientStripesBackground />}
        label="Theme 3: Gradient Stripes"
        labelColor="bg-indigo-100 text-indigo-700"
        description="Angled color bands. Bold, structured, editorial feel. Very intentional."
      />
      <Section
        bg={<SpotlightBackground />}
        label="Theme 4: Spotlight"
        labelColor="bg-sky-100 text-sky-700"
        description="Dramatic top-down light cone. Draws focus to content, theatrical."
      />
      <Section
        bg={<ParticleFieldBackground />}
        label="Theme 5: Particle Field"
        labelColor="bg-cyan-100 text-cyan-700"
        description="Floating dots with depth. Tech-forward, alive, sophisticated."
      />
      <Section
        bg={<GlassLayersBackground />}
        label="Theme 6: Glass Layers"
        labelColor="bg-emerald-100 text-emerald-700"
        description="Stacked frosted glass panels. Depth, dimension, very modern UI feel."
      />
      <Section
        bg={<NoiseGradientBackground />}
        label="Theme 7: Noise Gradient"
        labelColor="bg-teal-100 text-teal-700"
        description="Textured gradient with grain. Editorial, tactile, premium print feel."
      />
      <Section
        bg={<LiquidGradientBackgroundStandalone />}
        label="Theme 8: Liquid Gradient"
        labelColor="bg-purple-100 text-purple-700"
        description="Smoothly transitioning colors. Hypnotic, fluid, very polished."
      />
      <Section
        bg={<GeometricShapesBackground />}
        label="Theme 9: Geometric Shapes"
        labelColor="bg-pink-100 text-pink-700"
        description="Floating abstract forms. Playful but professional, distinctive."
      />
      <Section
        bg={<AuroraWavesBackground />}
        label="Theme 10: Aurora Waves"
        labelColor="bg-amber-100 text-amber-700"
        description="Flowing aurora borealis from top. Dramatic, ethereal, striking."
      />
      <Section
        bg={<SplitGradientBackground />}
        label="Theme 11: Split Gradient"
        labelColor="bg-orange-100 text-orange-700"
        description="Bold diagonal color division. Architectural, confident, modern."
      />
      <Section
        bg={<PrismLightBackground />}
        label="Theme 12: Prism Light"
        labelColor="bg-rose-100 text-rose-700"
        description="Refracted light beams with rainbow hints. Innovative, eye-catching, tech-forward."
      />
    </div>
  );
}
