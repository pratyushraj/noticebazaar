import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('src/index.ts', 'utf8');
const imports = content.match(/import .* from '\.\/(.*)\.js'/g);

if (imports) {
  imports.forEach(imp => {
    const relativePath = imp.match(/'\.\/(.*)\.js'/)[1];
    const tsPath = path.join('src', relativePath + '.ts');
    if (!fs.existsSync(tsPath)) {
      console.log(`❌ Missing: ${tsPath}`);
    } else {
      console.log(`✅ Found: ${tsPath}`);
    }
  });
}
