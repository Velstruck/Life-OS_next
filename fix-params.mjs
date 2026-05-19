import fs from 'fs';
import path from 'path';

function fixParamsTypes(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixParamsTypes(fullPath);
    } else if (fullPath.endsWith('route.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const modifiedContent = content.replace(/params\s*:\s*\{\s*([^}]+)\s*\}/g, 'params: Promise<{ $1 }>');
      if (content !== modifiedContent) {
        fs.writeFileSync(fullPath, modifiedContent);
        console.log(`Fixed params in ${fullPath}`);
      }
    }
  }
}

fixParamsTypes(path.join(process.cwd(), 'src', 'app', 'api'));
