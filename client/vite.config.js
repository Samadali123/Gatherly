import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const giphyApiKey = env.VITE_GIPHY_API_KEY || env.REACT_APP_GIPHY_API_KEY || '';

  return {
    define: {
      'import.meta.env.VITE_GIPHY_API_KEY': JSON.stringify(giphyApiKey),
      'import.meta.env.REACT_APP_GIPHY_API_KEY': JSON.stringify(giphyApiKey),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
      'import.meta.env.VITE_SOCKET_URL': JSON.stringify(env.VITE_SOCKET_URL || ''),
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (id.includes('tldraw') || id.includes('@tldraw')) {
              return 'vendor-tldraw';
            }

            if (id.includes('@livekit') || id.includes('livekit-client')) {
              return 'vendor-livekit';
            }

            if (id.includes('@emoji-mart')) {
              return 'vendor-emoji';
            }

            if (id.includes('react-easy-crop') || id.includes('browser-image-compression')) {
              return 'vendor-profile-media';
            }

            return undefined;
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': 'http://localhost:5000',
        '/socket.io': {
          target: 'http://localhost:5000',
          ws: true,
        },
      },
    },
  };
});
