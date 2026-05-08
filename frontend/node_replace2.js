const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace empty boxes containing mdash
const emptyRegex = /<div class="row-value editable-box">[\s\S]*?&mdash;[\s\S]*?<\/div>/g;
html = html.replace(emptyRegex, '<div class="row-value text-muted-value"><input type="text" class="inline-edit-input" placeholder="-" style="width: 250px;"></div>');

// Replace any remaining edit-icons that might have been populated strings wrapped in editable-box
const anyBoxRegex = /<div class="row-value editable-box">[\s\S]*?<span[^>]*>([^<]*)<\/span>[\s\S]*?<\/div>/g;
html = html.replace(anyBoxRegex, (match, p1) => {
    return '<div class="row-value"><input type="text" class="inline-edit-input fw-600" value="' + p1.trim() + '" style="width: 250px;"></div>';
});

// Since Name, ID, Email etc were previously handled without the editable-box maybe, let's make sure.
// Replace Candidate Name if not caught
html = html.replace(/<div class="row-value fw-600" id="detail-name-2">Mr\. DHANUSH S<\/div>/g, '<div class="row-value fw-600" id="detail-name-2"><input type="text" class="inline-edit-input fw-600" value="Mr. DHANUSH S" style="width: 250px;"></div>');

// Replace Employee fields
html = html.replace(/<div class="row-value text-blue fw-600" id="detail-email-2">\s*dhanushtheofficial@gmail\.com<\/div>/g, '<div class="row-value text-blue fw-600" id="detail-email-2"><input type="text" class="inline-edit-input text-blue fw-600" value="dhanushtheofficial@gmail.com" style="width: 250px;"></div>');

// Replace ID
html = html.replace(/<div class="row-value fw-600" id="detail-id">ZR_190_CAND<\/div>/g, '<div class="row-value fw-600" id="detail-id"><input type="text" class="inline-edit-input fw-600" value="ZR_190_CAND" style="width: 250px;"></div>');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Update Complete Part 2!');
