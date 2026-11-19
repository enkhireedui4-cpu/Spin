import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'style.css', 'app.js']) await cp(file, `dist/${file}`);
console.log('Static files ready in dist/');
