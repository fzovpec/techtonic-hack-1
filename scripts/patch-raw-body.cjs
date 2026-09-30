const fs = require('fs');
const path = require('path');

const rawBodyDir = path.resolve(__dirname, '..', 'node_modules', 'raw-body');
const pkgPath = path.join(rawBodyDir, 'package.json');
const distCjsPath = path.join(rawBodyDir, 'dist', 'index.cjs');

if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (pkg.version && pkg.version.startsWith('4.')) {
      // Create CommonJS bridge file
      const cjsContent = "const esm = require('./index.js');\nconst getRawBody = esm.default || esm.getRawBody;\nmodule.exports = Object.assign(getRawBody, esm);\n";
      fs.writeFileSync(distCjsPath, cjsContent, 'utf-8');

      // Update package.json exports to support both CommonJS (require) and ESM (import)
      delete pkg.type;
      pkg.main = './dist/index.cjs';
      pkg.exports = {
        import: './dist/index.js',
        require: './dist/index.cjs',
        default: './dist/index.js'
      };
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8');
      console.log('Successfully configured raw-body 4.0.0 dual CJS/ESM compatibility.');
    }
  } catch (err) {
    console.warn('Could not patch raw-body for CJS compatibility:', err.message);
  }
}
