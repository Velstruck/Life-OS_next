import fs from 'fs';
import path from 'path';

function fixNavigate(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixNavigate(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let transformed = content.replace(/useNavigate/g, 'useRouter');
      transformed = transformed.replace(/const navigate = useRouter\(\);/g, 'const router = useRouter();');
      // Look for `navigate('/something')` or `navigate(-1)`
      // Instead of writing a complex regex, we can just replace `navigate(` with `router.push(` (though `navigate(-1)` should ideally be `router.back()`).
      transformed = transformed.replace(/navigate\(\-1\)/g, 'router.back()');
      transformed = transformed.replace(/navigate\(/g, 'router.push(');

      if (content !== transformed) {
        fs.writeFileSync(fullPath, transformed);
        console.log(`Fixed navigate in ${fullPath}`);
      }
    }
  }
}

fixNavigate(path.join(process.cwd(), 'src', 'app'));
