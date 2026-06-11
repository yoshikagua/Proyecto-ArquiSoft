/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠️ ESTO ES LO CRUCIAL:
  // Hace que Next.js maneje internamente todas sus páginas bajo /donations
  basePath: '/donations',
  
  // Si tenías assetPrefix, puedes dejarlo o quitarlo, basePath suele encargarse de ambos en Next moderno
  assetPrefix: '/donations', 
};

export default nextConfig;