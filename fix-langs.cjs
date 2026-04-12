const fs = require('fs');
let content = fs.readFileSync('src/app/admin/TempleArchitectureAdmin.tsx', 'utf8');

// Inject getLang
if (!content.includes('function getLang')) {
    content = content.replace(
        /import \{ ensureMultilingual \} from .*?;/g,
        match => match + '\n\nfunction getLang(field: any, lang: string = "en") {\n  return field?.[lang] || "";\n}'
    );
}

// 1. Replace [activeLang] with getLang
content = content.replace(/(\w+)\.title\[activeLang\]/g, 'getLang($1.title, activeLang)');
content = content.replace(/(\w+)\.description\[activeLang\]/g, 'getLang($1.description, activeLang)');
content = content.replace(/(\w+)\.sthanPothiDescription\[activeLang\]/g, 'getLang($1.sthanPothiDescription, activeLang)');

// Replace .content[activeLang] for custom blocks
content = content.replace(/(\w+)\.content\[activeLang\]/g, 'getLang($1.content, activeLang)');

// Update onChange to be safe when setting title/description if the original object is undefined
content = content.replace(/title: \{ \.\.\.(\w+)\.title, \[activeLang\]: ([^ ]+) \}/g, 'title: { ...($1.title || { en: "", hi: "", mr: "" }), [activeLang]: $2 }');
content = content.replace(/description: \{ \.\.\.(\w+)\.description, \[activeLang\]: ([^ ]+) \}/g, 'description: { ...($1.description || { en: "", hi: "", mr: "" }), [activeLang]: $2 }');
content = content.replace(/sthanPothiDescription: \{ \.\.\.(\w+)\.sthanPothiDescription, \[activeLang\]: ([^ ]+) \}/g, 'sthanPothiDescription: { ...($1.sthanPothiDescription || { en: "", hi: "", mr: "" }), [activeLang]: $2 }');
content = content.replace(/content: \{ \.\.\.(\w+)\.content, \[activeLang\]: ([^ ]+) \}/g, 'content: { ...($1.content || { en: "", hi: "", mr: "" }), [activeLang]: $2 }');

fs.writeFileSync('src/app/admin/TempleArchitectureAdmin.tsx', content);
console.log("Safe getters injected.");
