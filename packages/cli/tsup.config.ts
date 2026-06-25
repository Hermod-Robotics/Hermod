import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'es2022',
  external: [
    // Node built-ins that EJS and js-yaml use via dynamic require
    'fs',
    'path',
    'util',
    'assert',
    'ejs',
    'js-yaml',
  ],
  noExternal: [
    // Bundle the engine workspace package
    '@hermod/engine',
  ],
  clean: true,
});
