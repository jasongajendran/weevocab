import React from 'react';

/**
 * GeometricBackdrop:
 * Renders a rich, multi-layered Scottish Highlands backdrop with:
 * - Subtle geometric tartan cross-hatch lattice
 * - Isometric diamond mesh & intersection nodal dots
 * - Atmospheric floating geometric shapes (diamonds, hexagons, saltire shields)
 *   strategically placed in the side gutters and background
 * - Soft Highland aurora glow washes (emerald, loch cyan, heather violet, warm amber)
 */
export const GeometricBackdrop: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      
      {/* 1. Deep Atmospheric Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1322] via-[#0e192c] to-[#0a111e]" />

      {/* 2. Soft Highland Aurora Color Washes */}
      <div className="absolute -top-32 left-1/12 w-[600px] h-[600px] bg-emerald-600/12 rounded-full blur-3xl" />
      <div className="absolute top-1/4 -right-32 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 -left-40 w-[650px] h-[650px] bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute top-2/3 right-1/10 w-[500px] h-[500px] bg-sky-600/12 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 w-[700px] h-[500px] bg-sky-600/10 rounded-full blur-3xl" />

      {/* 3. SVG Geometric Tartan Lattice & Isometric Grid */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-60" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Tartan Geometric Weave Pattern */}
          <pattern 
            id="highland-tartan-grid" 
            width="120" 
            height="120" 
            patternUnits="userSpaceOnUse"
          >
            {/* Primary Grid Lines */}
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1" />
            <path d="M 60 0 L 60 120 M 0 60 L 120 60" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Diagonal Cross Weave */}
            <path d="M 0 0 L 120 120 M 120 0 L 0 120" fill="none" stroke="rgba(245, 158, 11, 0.03)" strokeWidth="0.8" />
            {/* Geometric Nodal Dots */}
            <circle cx="60" cy="60" r="1.5" fill="rgba(52, 211, 153, 0.25)" />
            <circle cx="0" cy="0" r="1.2" fill="rgba(251, 191, 36, 0.2)" />
            <circle cx="120" cy="120" r="1.2" fill="rgba(251, 191, 36, 0.2)" />
          </pattern>

          {/* Isometric Diamond Grid for Outer Side Margins */}
          <pattern 
            id="isometric-diamonds" 
            width="60" 
            height="104" 
            patternUnits="userSpaceOnUse"
          >
            <path 
              d="M 30 0 L 60 52 L 30 104 L 0 52 Z" 
              fill="none" 
              stroke="rgba(148, 163, 184, 0.03)" 
              strokeWidth="0.75" 
            />
          </pattern>

          {/* Linear Gradients for Floating Geometric Polygons */}
          <linearGradient id="geom-emerald-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id="geom-amber-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id="geom-teal-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Apply Tartan Grid Everywhere */}
        <rect width="100%" height="100%" fill="url(#highland-tartan-grid)" />
        <rect width="100%" height="100%" fill="url(#isometric-diamonds)" />
      </svg>

      {/* 4. Left Gutter Decorative Geometric Shapes (Specially visible in widescreen tabs) */}
      <div className="absolute top-24 left-4 xl:left-8 2xl:left-14 w-64 h-[800px] pointer-events-none hidden md:block opacity-75">
        
        {/* Diamond 1: Emerald Rotated Card Frame */}
        <div className="absolute top-8 left-2 w-32 h-32 rotate-45 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent shadow-lg shadow-emerald-950/20 backdrop-blur-[1px]">
          <div className="absolute inset-2 rounded-xl border border-emerald-400/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-xs font-mono font-black text-emerald-400/50">
            ◆ SCOTS
          </div>
        </div>

        {/* Saltire Scottish X-Cross Geometry */}
        <div className="absolute top-64 left-10 w-24 h-24 rotate-12">
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent" />
          <div className="absolute inset-0 rotate-45 border border-cyan-400/20 rounded-lg" />
        </div>

        {/* Hexagonal Poly Accent */}
        <div className="absolute top-[440px] left-6 w-28 h-28 border border-amber-500/20 rounded-3xl rotate-12 bg-amber-500/5">
          <div className="absolute inset-2 border border-dashed border-amber-400/20 rounded-2xl" />
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-amber-300/40">
            01 / P6-S4
          </div>
        </div>

        {/* Vertical Rail Ruler Indicator */}
        <div className="absolute top-20 right-0 w-[1px] h-[650px] bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent flex flex-col justify-between items-center py-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400" />
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400" />
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-xs shadow-teal-400" />
        </div>
      </div>

      {/* 5. Right Gutter Decorative Geometric Shapes (Specially visible in widescreen tabs) */}
      <div className="absolute top-28 right-4 xl:right-8 2xl:right-14 w-64 h-[800px] pointer-events-none hidden md:block opacity-75">
        
        {/* Diamond 2: Amber Rotated Card Frame */}
        <div className="absolute top-12 right-4 w-36 h-36 rotate-12 rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-transparent shadow-lg shadow-amber-950/20">
          <div className="absolute inset-2 rounded-2xl border border-amber-400/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 text-xs font-mono font-black text-amber-300/50">
            LEXICON ❖
          </div>
        </div>

        {/* Concentric Circles & Crosshair */}
        <div className="absolute top-72 right-12 w-28 h-28 rounded-full border border-teal-500/20 flex items-center justify-center">
          <div className="w-18 h-18 rounded-full border border-dashed border-teal-400/30 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-300/40" />
          </div>
          <div className="absolute w-full h-[1px] bg-teal-500/20" />
          <div className="absolute h-full w-[1px] bg-teal-500/20" />
        </div>

        {/* Tilted Scottish Tartan Square */}
        <div className="absolute top-[480px] right-8 w-32 h-32 rotate-45 rounded-2xl border border-sky-500/20 bg-sky-500/5">
          <div className="absolute inset-3 border border-sky-400/20 rounded-xl" />
        </div>

        {/* Vertical Rail Ruler Indicator Right */}
        <div className="absolute top-20 left-0 w-[1px] h-[650px] bg-gradient-to-b from-transparent via-amber-500/30 to-transparent flex flex-col justify-between items-center py-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400" />
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400" />
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-xs shadow-sky-400" />
        </div>
      </div>

    </div>
  );
};
