const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color themes for different categories / figures
const themes = [
  { bg1: '#0f172a', bg2: '#1e1b4b', accent: '#6366f1', glow: '#818cf8', icon: 'TECH' },
  { bg1: '#064e3b', bg2: '#022c22', accent: '#10b981', glow: '#34d399', icon: 'BIZ' },
  { bg1: '#311042', bg2: '#1e1b4b', accent: '#a855f7', glow: '#c084fc', icon: 'ART' },
  { bg1: '#451a03', bg2: '#1c1917', accent: '#f59e0b', glow: '#fbbf24', icon: 'LEAD' },
  { bg1: '#0f2942', bg2: '#091e3a', accent: '#06b6d4', glow: '#38bdf8', icon: 'IDEA' },
  { bg1: '#1e293b', bg2: '#0f172a', accent: '#3b82f6', glow: '#60a5fa', icon: 'INNOV' },
];

function getTheme(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return themes[hash % themes.length];
}

function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generatePortraitSvg(name, title) {
  const t = getTheme(name);
  const initials = name
    .split(/[-_]/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');

  const safeTitle = escapeXml(title);
  const safeInitials = escapeXml(initials);

  return `<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad_${safeInitials}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${t.bg1}" />
      <stop offset="100%" stop-color="${t.bg2}" />
    </linearGradient>
    <radialGradient id="glowGrad_${safeInitials}" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${t.glow}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${t.bg2}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="accentGrad_${safeInitials}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${t.accent}" />
      <stop offset="100%" stop-color="${t.glow}" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="600" fill="url(#bgGrad_${safeInitials})" />
  <rect width="600" height="600" fill="url(#glowGrad_${safeInitials})" />

  <!-- Abstract Decorative Grid Lines -->
  <circle cx="300" cy="300" r="230" fill="none" stroke="${t.accent}" stroke-width="2" stroke-opacity="0.2" />
  <circle cx="300" cy="300" r="180" fill="none" stroke="${t.glow}" stroke-width="1.5" stroke-dasharray="8 6" stroke-opacity="0.25" />
  <circle cx="300" cy="300" r="130" fill="none" stroke="${t.accent}" stroke-width="1" stroke-opacity="0.2" />

  <!-- Avatar Silhouette Outer Ring -->
  <circle cx="300" cy="240" r="105" fill="#0f172a" stroke="url(#accentGrad_${safeInitials})" stroke-width="5" />

  <!-- Neutral Silhouette Person -->
  <!-- Head -->
  <circle cx="300" cy="205" r="44" fill="${t.glow}" fill-opacity="0.9" />
  <!-- Shoulders -->
  <path d="M 210 310 C 210 255, 390 255, 390 310 Z" fill="${t.glow}" fill-opacity="0.9" />

  <!-- Geometric Accent Badge -->
  <rect x="220" y="380" width="160" height="42" rx="21" fill="#0f172a" stroke="${t.accent}" stroke-width="2" />
  <text x="300" y="407" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="3">${safeInitials}</text>

  <!-- Title / Label -->
  <text x="300" y="465" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#f8fafc" text-anchor="middle">${safeTitle}</text>
  <text x="300" y="495" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="2">NEUTRAL AVATAR ILLUSTRATION</text>
</svg>`;
}

function generateBannerSvg(name, category, title) {
  const t = getTheme(name + category);
  const cleanId = name.replace(/[^a-zA-Z0-9]/g, '');
  const safeTitle = escapeXml(title);
  const safeCategory = escapeXml(category.toUpperCase());

  return `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad_${cleanId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${t.bg1}" />
      <stop offset="50%" stop-color="${t.bg2}" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <radialGradient id="glowGrad_${cleanId}" cx="80%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${t.glow}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="accentGrad_${cleanId}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${t.accent}" />
      <stop offset="100%" stop-color="${t.glow}" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad_${cleanId})" />
  <rect width="1200" height="675" fill="url(#glowGrad_${cleanId})" />

  <!-- Abstract Geometry & Grid -->
  <path d="M-100 500 Q 300 200 700 450 T 1300 200" fill="none" stroke="${t.accent}" stroke-width="3" stroke-opacity="0.3" />
  <path d="M-100 350 Q 400 600 900 300 T 1300 500" fill="none" stroke="${t.glow}" stroke-width="2" stroke-opacity="0.25" stroke-dasharray="10 8" />

  <circle cx="950" cy="330" r="180" fill="none" stroke="url(#accentGrad_${cleanId})" stroke-width="3" stroke-opacity="0.45" />
  <circle cx="950" cy="330" r="120" fill="none" stroke="${t.glow}" stroke-width="1.5" stroke-opacity="0.35" />

  <!-- Stylized Abstract Silhouette in Banner -->
  <g transform="translate(870, 230)">
    <circle cx="80" cy="65" r="35" fill="${t.glow}" fill-opacity="0.9" />
    <path d="M 10 150 C 10 100, 150 100, 150 150 Z" fill="${t.glow}" fill-opacity="0.9" />
  </g>

  <!-- Left Content Card -->
  <rect x="100" y="200" width="560" height="275" rx="24" fill="#0f172a" fill-opacity="0.8" stroke="${t.accent}" stroke-width="2" stroke-opacity="0.6" />

  <rect x="140" y="240" width="160" height="32" rx="16" fill="${t.accent}" fill-opacity="0.25" stroke="${t.glow}" stroke-width="1.5" />
  <text x="220" y="261" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="${t.glow}" text-anchor="middle" letter-spacing="1.5">${safeCategory}</text>

  <text x="140" y="325" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#ffffff">${safeTitle}</text>
  <text x="140" y="365" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="#94a3b8">Neutral Graphic Banner Illustration</text>

  <line x1="140" y1="400" x2="600" y2="400" stroke="#334155" stroke-width="1" />
  <circle cx="150" cy="425" r="6" fill="${t.accent}" />
  <text x="170" y="429" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#cbd5e1">Campus Foundry Abstract Spotlight</text>
</svg>`;
}

const fileSpecs = [
  // public/assets/aistudio/
  { path: 'public/assets/aistudio/ada_lovelace-1_a1b1a6c8.jpg', type: 'portrait', name: 'Ada Lovelace', title: 'Ada Lovelace' },
  { path: 'public/assets/aistudio/aliko_dangote-1_5f89bfc4.jpg', type: 'portrait', name: 'Aliko Dangote', title: 'Aliko Dangote' },
  { path: 'public/assets/aistudio/chinua_achebe-1_322c2c38.jpg', type: 'portrait', name: 'Chinua Achebe', title: 'Chinua Achebe' },
  { path: 'public/assets/aistudio/kwame_nkrumah-1_44ad0299.jpg', type: 'portrait', name: 'Kwame Nkrumah', title: 'Kwame Nkrumah' },
  { path: 'public/assets/aistudio/martin_luther_king-2_5b50347a.jpg', type: 'portrait', name: 'Martin Luther King', title: 'Martin Luther King Jr.' },
  { path: 'public/assets/aistudio/nelson_mandela-1_bc5165a4.jpg', type: 'portrait', name: 'Nelson Mandela', title: 'Nelson Mandela' },
  { path: 'public/assets/aistudio/ngozi_okonjo_iweala-1_31b954a1.jpg', type: 'portrait', name: 'Ngozi Okonjo-Iweala', title: 'Ngozi Okonjo-Iweala' },
  { path: 'public/assets/aistudio/nikola_tesla-1_9a7d84ab.jpg', type: 'portrait', name: 'Nikola Tesla', title: 'Nikola Tesla' },
  { path: 'public/assets/aistudio/obafemi_awolowo-1_e6d537ca.jpg', type: 'portrait', name: 'Obafemi Awolowo', title: 'Obafemi Awolowo' },
  { path: 'public/assets/aistudio/philip_emeagwali-1_f36b1a0b.jpg', type: 'portrait', name: 'Philip Emeagwali', title: 'Philip Emeagwali' },
  { path: 'public/assets/aistudio/thomas_sankara-1_4418fe16.jpg', type: 'portrait', name: 'Thomas Sankara', title: 'Thomas Sankara' },
  { path: 'public/assets/aistudio/warren_buffett-1_65b02fb7.jpg', type: 'portrait', name: 'Warren Buffett', title: 'Warren Buffett' },
  { path: 'public/assets/aistudio/wole_soyinka-1_3c1e754f.jpg', type: 'portrait', name: 'Wole Soyinka', title: 'Wole Soyinka' },

  // public/assets/banners/
  { path: 'public/assets/banners/arts/chinua_achebe.jpg', type: 'banner', name: 'Chinua Achebe', category: 'Arts & Culture', title: 'Chinua Achebe' },
  { path: 'public/assets/banners/arts/wole_soyinka.jpg', type: 'banner', name: 'Wole Soyinka', category: 'Arts & Literature', title: 'Wole Soyinka' },
  { path: 'public/assets/banners/general/martin_luther_king.jpg', type: 'banner', name: 'Martin Luther King', category: 'Civil Rights', title: 'Martin Luther King Jr.' },
  { path: 'public/assets/banners/marketplace/aliko_dangote.jpg', type: 'banner', name: 'Aliko Dangote', category: 'Enterprise', title: 'Aliko Dangote' },
  { path: 'public/assets/banners/marketplace/ngozi_okonjo_iweala.jpg', type: 'banner', name: 'Ngozi Okonjo-Iweala', category: 'Global Economics', title: 'Ngozi Okonjo-Iweala' },
  { path: 'public/assets/banners/marketplace/warren_buffett.jpg', type: 'banner', name: 'Warren Buffett', category: 'Finance', title: 'Warren Buffett' },
  { path: 'public/assets/banners/politics/kwame_nkrumah.jpg', type: 'banner', name: 'Kwame Nkrumah', category: 'Statecraft', title: 'Kwame Nkrumah' },
  { path: 'public/assets/banners/politics/nelson_mandela.jpg', type: 'banner', name: 'Nelson Mandela', category: 'Leadership', title: 'Nelson Mandela' },
  { path: 'public/assets/banners/politics/obafemi_awolowo.jpg', type: 'banner', name: 'Obafemi Awolowo', category: 'Governance', title: 'Obafemi Awolowo' },
  { path: 'public/assets/banners/politics/thomas_sankara.jpg', type: 'banner', name: 'Thomas Sankara', category: 'Visionary', title: 'Thomas Sankara' },
  { path: 'public/assets/banners/tech/ada_lovelace.jpg', type: 'banner', name: 'Ada Lovelace', category: 'Computing', title: 'Ada Lovelace' },
  { path: 'public/assets/banners/tech/nikola_tesla.jpg', type: 'banner', name: 'Nikola Tesla', category: 'Innovation', title: 'Nikola Tesla' },
  { path: 'public/assets/banners/tech/philip_emeagwali.jpg', type: 'banner', name: 'Philip Emeagwali', category: 'Supercomputing', title: 'Philip Emeagwali' },

  // src/assets/images/
  { path: 'src/assets/images/aliko_dangote_portrait_1790940289570.jpg', type: 'portrait', name: 'Aliko Dangote', title: 'Aliko Dangote' },
  { path: 'src/assets/images/femi_otedola_portrait_1790939487250.jpg', type: 'portrait', name: 'Femi Otedola', title: 'Femi Otedola' },
  { path: 'src/assets/images/henry_ford_portrait_1790940304887.jpg', type: 'portrait', name: 'Henry Ford', title: 'Henry Ford' },
  { path: 'src/assets/images/ibukun_awosika_portrait_1790939474231.jpg', type: 'portrait', name: 'Ibukun Awosika', title: 'Ibukun Awosika' },
  { path: 'src/assets/images/kiichiro_toyoda_portrait_1790940336483.jpg', type: 'portrait', name: 'Kiichiro Toyoda', title: 'Kiichiro Toyoda' },
  { path: 'src/assets/images/madam_walker_portrait_1790940349868.jpg', type: 'portrait', name: 'Madam C.J. Walker', title: 'Madam C.J. Walker' },
  { path: 'src/assets/images/nikola_tesla_portrait_1790940322902.jpg', type: 'portrait', name: 'Nikola Tesla', title: 'Nikola Tesla' },
  { path: 'src/assets/images/tony_elumelu_portrait_1790940367182.jpg', type: 'portrait', name: 'Tony Elumelu', title: 'Tony Elumelu' },

  { path: 'src/assets/images/awosika_corporate_scene_1790940658161.jpg', type: 'banner', name: 'Awosika Corporate', category: 'Corporate Leadership', title: 'Corporate Excellence' },
  { path: 'src/assets/images/dangote_industrial_scene_1790940642635.jpg', type: 'banner', name: 'Dangote Industrial', category: 'Industrial Enterprise', title: 'Industrial Innovation' },
  { path: 'src/assets/images/elumelu_financial_scene_1790940739345.jpg', type: 'banner', name: 'Elumelu Financial', category: 'Africapitalism & Finance', title: 'Financial Vision' },
  { path: 'src/assets/images/ford_factory_scene_1790940685030.jpg', type: 'banner', name: 'Ford Factory', category: 'Manufacturing & Scale', title: 'Assembly & Production' },
  { path: 'src/assets/images/otedola_energy_scene_1790940671427.jpg', type: 'banner', name: 'Otedola Energy', category: 'Power & Infrastructure', title: 'Energy & Infrastructure' },
  { path: 'src/assets/images/tesla_laboratory_scene_1790940712651.jpg', type: 'banner', name: 'Tesla Laboratory', category: 'Science & Invention', title: 'Laboratory Invention' },
  { path: 'src/assets/images/toyoda_automotive_scene_1790940699572.jpg', type: 'banner', name: 'Toyoda Automotive', category: 'Automotive Engineering', title: 'Automotive Pioneer' },
  { path: 'src/assets/images/walker_apothecary_scene_1790940726641.jpg', type: 'banner', name: 'Walker Enterprise', category: 'Beauty & Commerce', title: 'Pioneering Commerce' },

  // public/assets/images/placeholders/default_figure.png
  { path: 'public/assets/images/placeholders/default_figure.png', type: 'png_portrait', name: 'Default Figure', title: 'Campus Profile' }
];

console.log(`Starting replacement of ${fileSpecs.length} files...`);

for (const spec of fileSpecs) {
  const fullPath = path.resolve(process.cwd(), spec.path);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let svgContent = '';
  if (spec.type === 'portrait' || spec.type === 'png_portrait') {
    svgContent = generatePortraitSvg(spec.name, spec.title);
  } else {
    svgContent = generateBannerSvg(spec.name, spec.category || 'Spotlight', spec.title);
  }

  const tmpSvg = path.join(dir, `_temp_${Date.now()}_${Math.floor(Math.random() * 10000)}.svg`);
  fs.writeFileSync(tmpSvg, svgContent, 'utf8');

  try {
    if (spec.path.endsWith('.png')) {
      execSync(`ffmpeg -y -i "${tmpSvg}" "${fullPath}"`, { stdio: 'ignore' });
    } else {
      execSync(`ffmpeg -y -i "${tmpSvg}" -q:v 2 "${fullPath}"`, { stdio: 'ignore' });
    }
    console.log(`Successfully updated: ${spec.path}`);
  } catch (err) {
    console.error(`Failed updating ${spec.path}:`, err.message);
  } finally {
    if (fs.existsSync(tmpSvg)) {
      fs.unlinkSync(tmpSvg);
    }
  }
}

console.log('All image assets successfully replaced with neutral vector illustrations!');
