import fs from 'fs';
import path from 'path';

function fixLinks(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixLinks(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace `<Link to="` with `<Link href="`
      const transformed = content.replace(/<Link([^>]+)to=/g, '<Link$1href=');

      if (content !== transformed) {
        fs.writeFileSync(fullPath, transformed);
        console.log(`Fixed Link in ${fullPath}`);
      }
    }
  }
}

fixLinks(path.join(process.cwd(), 'src', 'app'));
fixLinks(path.join(process.cwd(), 'src', 'components'));
