// next.config.ts
import type { NextConfig } from "next";
// import path from 'path'; // Provavelmente não necessário aqui

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* Suas outras opções de config podem estar aqui */
  reactStrictMode: true, // Exemplo

  // 1. Saída Standalone: NECESSÁRIO para o build otimizado para Docker
  output: 'standalone',

  // 2. Configuração Webpack para Prisma: NECESSÁRIO para que o Prisma funcione com 'standalone'
  webpack: (config, { isServer, nextRuntime }) => {
    // Garante que o Prisma Client não seja empacotado no bundle do servidor Node.js
    if (nextRuntime === 'nodejs' && isServer) {
      config.externals.push('@prisma/client');
    }
    return config;
  },
};

export default nextConfig;