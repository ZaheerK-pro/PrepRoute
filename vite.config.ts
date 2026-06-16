/// <reference types="node" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function getProxyTarget(apiBaseUrl: string | undefined): string | undefined {
  if (!apiBaseUrl?.trim()) return undefined;

  const trimmed = apiBaseUrl.trim().replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
}

function createApiProxy(proxyTarget: string | undefined) {
  if (!proxyTarget) return undefined;

  return {
    '/api': {
      target: proxyTarget,
      changeOrigin: true,
      secure: true,
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = getProxyTarget(env.VITE_API_BASE_URL);
  const apiProxy = createApiProxy(proxyTarget);

  if (mode === 'development' && !proxyTarget) {
    console.warn(
      '\n[Vite] VITE_API_BASE_URL is not set in .env — API proxy is disabled.\n' +
        '       Copy .env.example to .env and set your API URL, then restart the dev server.\n',
    );
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: apiProxy,
    },
    preview: {
      proxy: apiProxy,
    },
  };
});
