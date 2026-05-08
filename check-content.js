const fs = require('fs');
const html = fs.readFileSync('frontend/index.html', 'utf8');
const start = html.indexOf('<div id="candidates-detail-view"');
const end = html.indexOf('<!-- PAGE 4: INTERVIEWS -->');
const section = html.substring(start, end);
console.log('Includes FILTER APPLICATIONS BY:', section.includes('FILTER APPLICATIONS BY'));
console.log('Includes rocket_envelope.png:', section.includes('rocket_envelope.png'));
console.log('Includes Create Offer button:', section.includes('Create Offer'));
