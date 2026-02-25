const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist-web');
const nestedIndex = path.join(distDir, 'src', 'web', 'index.html');
const rootIndex = path.join(distDir, 'index.html');

if (fs.existsSync(nestedIndex)) {
    fs.copyFileSync(nestedIndex, rootIndex);
    console.log('[postbuild-web] index.html copied to dist-web root');
} else {
    console.warn('[postbuild-web] nested index.html not found, skipping');
}