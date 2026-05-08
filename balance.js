const fs = require('fs');
const html = fs.readFileSync('frontend/index.html', 'utf8');
const start = html.indexOf('<div id="candidates-detail-view"');
const end = html.indexOf('<!-- PAGE 4: INTERVIEWS -->');
const section = html.substring(start, end);
let balance = 0;
const tags = section.match(/<\/?div\b[^>]*>/g);
if (tags) {
    tags.forEach(t => {
        if (t.startsWith('</')) balance--;
        else if (!t.endsWith('/>')) balance++;
    });
}
console.log('Balance:', balance);
