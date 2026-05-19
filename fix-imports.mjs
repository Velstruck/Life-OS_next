import fs from 'fs';
import path from 'path';

function fixImportsInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImportsInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let transformed = content;
      
      // Fix relative paths that go up directories
      transformed = transformed.replace(/from\s+['"]\.\.\/\.\.\/stores/g, "from '@/stores");
      transformed = transformed.replace(/from\s+['"]\.\.\/stores/g, "from '@/stores");
      transformed = transformed.replace(/from\s+['"]\.\.\/\.\.\/api/g, "from '@/api");
      transformed = transformed.replace(/from\s+['"]\.\.\/api/g, "from '@/api");
      transformed = transformed.replace(/from\s+['"]\.\.\/\.\.\/hooks/g, "from '@/hooks");
      transformed = transformed.replace(/from\s+['"]\.\.\/hooks/g, "from '@/hooks");
      transformed = transformed.replace(/from\s+['"]\.\.\/\.\.\/types/g, "from '@/types");
      transformed = transformed.replace(/from\s+['"]\.\.\/types/g, "from '@/types");
      transformed = transformed.replace(/from\s+['"]\.\.\/\.\.\/components/g, "from '@/components");
      transformed = transformed.replace(/from\s+['"]\.\.\/components/g, "from '@/components");

      if (content !== transformed) {
        fs.writeFileSync(fullPath, transformed);
        console.log(`Fixed imports in ${fullPath}`);
      }
    }
  }
}

fixImportsInDir(path.join(process.cwd(), 'src', 'app'));
