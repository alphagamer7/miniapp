import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
// import basicSsl from '@vitejs/plugin-basic-ssl';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/miniapp',
  plugins: [
    // Allows using React dev server along with building a React application with Vite.
    // https://npmjs.com/package/@vitejs/plugin-react-swc
    react(),
    // Allows using self-signed certificates to run the dev server using HTTPS.
    // https://www.npmjs.com/package/@vitejs/plugin-basic-ssl
    // basicSsl(),
    // nodePolyfills({
    //   // Whether to polyfill specific globals
    //   globals: {
    //     Buffer: true,
    //     global: true,
    //     process: true,
    //   },
    //   // Whether to polyfill node: protocol imports
    //   protocolImports: true,
    // }),
    tailwindcss(),
  ],
  publicDir: './public',
  server: {
    // Exposes your dev server and makes it accessible for the devices in the same network.
    host: true,
  },
  resolve: {
    alias: {
      '@': resolve(dirname(fileURLToPath(import.meta.url)), './src'),
    },
    
  },
  optimizeDeps: {
    esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
            global: 'globalThis'
        },
        // Enable esbuild polyfill plugins
        plugins: [
            NodeGlobalsPolyfillPlugin({
                buffer: true
            })
        ]
    }
}
});

