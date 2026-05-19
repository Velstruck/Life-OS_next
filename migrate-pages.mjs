import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src', 'pages');
const appDir = path.join(process.cwd(), 'src', 'app');

const routes = {
  'LandingPage.tsx': 'page.tsx',
  'Login.tsx': 'login/page.tsx',
  'Register.tsx': 'register/page.tsx',
  'Home.tsx': '(main)/home/page.tsx',
  'StreaksPage.tsx': '(main)/streaks/page.tsx',
  'StreakDetail.tsx': '(main)/streaks/[habitId]/page.tsx',
  'KhataPage.tsx': '(main)/khata/page.tsx',
  'GroupDetail.tsx': '(main)/khata/[groupId]/page.tsx',
  'MemoryLanePage.tsx': '(main)/memories/page.tsx',
  'Profile.tsx': '(main)/profile/page.tsx',
};

function transformContent(content) {
  let transformed = content;
  transformed = `"use client";\n\n` + transformed;
  
  // Replace react-router-dom imports
  transformed = transformed.replace(/import\s+{([^}]*)}\s+from\s+['"]react-router-dom['"];/g, (match, importsStr) => {
    const imports = importsStr.split(',').map(i => i.trim());
    let nextNavigationImports = [];
    let nextLinkImport = false;

    if (imports.includes('useNavigate')) {
      nextNavigationImports.push('useRouter');
      transformed = transformed.replace(/useNavigate\(\)/g, 'useRouter()');
    }
    if (imports.includes('useLocation')) {
      nextNavigationImports.push('usePathname');
      transformed = transformed.replace(/useLocation\(\)/g, 'usePathname()');
    }
    if (imports.includes('useParams')) {
      nextNavigationImports.push('useParams');
    }
    if (imports.includes('Link')) {
      nextLinkImport = true;
    }

    let replacements = [];
    if (nextNavigationImports.length > 0) {
      replacements.push(`import { ${nextNavigationImports.join(', ')} } from 'next/navigation';`);
    }
    if (nextLinkImport) {
      replacements.push(`import Link from 'next/link';`);
    }
    return replacements.join('\n');
  });

  // some files might use `navigate('/somepath')` which maps to `router.push('/somepath')`
  transformed = transformed.replace(/const navigate = useRouter\(\);/g, 'const router = useRouter();');
  transformed = transformed.replace(/navigate\(/g, 'router.push(');

  return transformed;
}

for (const [filename, routePath] of Object.entries(routes)) {
  const sourcePath = path.join(pagesDir, filename);
  const destPath = path.join(appDir, routePath);

  if (fs.existsSync(sourcePath)) {
    const content = fs.readFileSync(sourcePath, 'utf8');
    const transformed = transformContent(content);

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, transformed);
    console.log(`Migrated ${filename} to ${routePath}`);
  } else {
    console.warn(`File not found: ${sourcePath}`);
  }
}

// Transform components and layouts
const componentsDir = path.join(process.cwd(), 'src', 'components');
const layoutsDir = path.join(process.cwd(), 'src', 'layouts');

function transformDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      transformDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('react-router-dom')) {
        let transformed = `"use client";\n\n` + transformContent(content);
        fs.writeFileSync(fullPath, transformed);
        console.log(`Transformed component: ${file}`);
      }
    }
  }
}

transformDir(componentsDir);
transformDir(layoutsDir);
