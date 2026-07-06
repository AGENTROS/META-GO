const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'node_modules', '@mediapipe', 'face_mesh', 'face_mesh.js');

if (!fs.existsSync(targetFile)) {
  console.log('Target file not found. node_modules might not be installed yet.');
  process.exit(0);
}

try {
  let content = fs.readFileSync(targetFile, 'utf8');
  
  // Check if it's already patched
  if (content.includes('module.exports = { FaceMesh:')) {
    console.log('face_mesh.js is already patched.');
    process.exit(0);
  }

  const patchCode = `\nif (typeof module !== 'undefined') { module.exports = { FaceMesh: typeof FaceMesh !== 'undefined' ? FaceMesh : (typeof self !== 'undefined' ? self.FaceMesh : (typeof globalThis !== 'undefined' ? globalThis.FaceMesh : null)) }; }\n`;
  
  content += patchCode;
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully patched face_mesh.js for Next.js Turbopack compatibility.');
} catch (err) {
  console.error('Failed to patch face_mesh.js:', err);
}
