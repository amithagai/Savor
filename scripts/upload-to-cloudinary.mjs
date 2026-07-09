import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '../src/assets');
const manifestPath = path.resolve(__dirname, '../src/assets/cloudinary-manifest.json');

const targets = [
  { file: 'CRAEM 1.5.png', publicId: 'savor/craem-1' },
  { file: 'CRAEM4 1.5 .png', publicId: 'savor/craem-4' },
  { file: 'CRAEM5 1.5.png', publicId: 'savor/craem-5' },
  { file: 'LATTE לעמוד הבית.png', publicId: 'savor/latte-home' },
  { file: 'לעמוד הבית.png', publicId: 'savor/hero-home' },
  { file: 'סקיצה .png', publicId: 'savor/sketch' },
  { file: 'CRAEM5 1.5 4.svg', publicId: 'savor/material-hinges' },
  { file: 'CRAEM5 1.5 5.svg', publicId: 'savor/material-paint-doors' },
  { file: 'CRAEM5 1.5 6.svg', publicId: 'savor/material-plywood' },
  { file: 'CRAEM5 1.5 7.svg', publicId: 'savor/material-handles' },
  { file: 'CRAEM5 1.5 8.svg', publicId: 'savor/material-soft-close' },
  { file: 'CRAEM5 1.5 9.svg', publicId: 'savor/material-marble' },
];

if (!process.env.VITE_CLOUDINARY_URL) {
  console.error('VITE_CLOUDINARY_URL is not set (expected in savor-frontend/.env)');
  process.exit(1);
}

const manifest = {};

for (const { file, publicId } of targets) {
  const filePath = path.join(assetsDir, file);
  process.stdout.write(`Uploading ${file} -> ${publicId} ... `);
  try {
    const res = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    });
    manifest[publicId] = res.secure_url;
    console.log('done');
  } catch (err) {
    console.log('FAILED');
    console.error(`  ${file}:`, err.message);
  }
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nManifest written to ${manifestPath}`);
