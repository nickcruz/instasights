import { copyFile, chmod } from 'node:fs/promises';

const source = new URL('./src/instasights.mjs', import.meta.url);
const destination = new URL('../../skills/instasights/bin/instasights.mjs', import.meta.url);

await copyFile(source, destination);
await chmod(destination, 0o755);
console.log('Updated skills/instasights/bin/instasights.mjs');
