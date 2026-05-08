const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace all dashed empty fields
const emptyRegex = /<div class="row-value editable-box">\s*<span[^>]*>&mdash;<\/span>\s*<i class="fas fa-pencil-alt edit-icon"><\/i>\s*<\/div>/g;
html = html.replace(emptyRegex, '<div class="row-value text-muted-value"><input type="text" class="inline-edit-input" placeholder="-" style="width: 250px;"></div>');

// Replace Email
html = html.replace(/<div class="row-value text-blue fw-600" id="detail-email-2">\s*dhanushtheofficial@gmail\.com<\/div>/g, '<div class="row-value text-blue fw-600" id="detail-email-2"><input type="text" class="inline-edit-input text-blue fw-600" value="dhanushtheofficial@gmail.com" style="width: 250px;"></div>');

// Replace ID
html = html.replace(/<div class="row-value fw-600" id="detail-id">ZR_190_CAND<\/div>/g, '<div class="row-value fw-600" id="detail-id"><input type="text" class="inline-edit-input fw-600" value="ZR_190_CAND" style="width: 250px;"></div>');

// Replace Candidate Name
html = html.replace(/<div class="row-value fw-600" id="detail-name-2">Mr\. DHANUSH S<\/div>/g, '<div class="row-value fw-600" id="detail-name-2"><input type="text" class="inline-edit-input fw-600" value="Mr. DHANUSH S" style="width: 250px;"></div>');

// Replace Mobile
const mobileRegex = /<div class="row-value editable-box"><span class="val text-blue fw-600"[\s\S]*?id="detail-mobile-2"[\s\S]*?\+91 86088[\s\S]*?39065[\s\S]*?fa-phone-alt[\s\S]*?<\/div>/;
html = html.replace(mobileRegex, '<div class="row-value text-blue fw-600" id="detail-mobile-2" style="position: relative;"><input type="text" class="inline-edit-input text-blue fw-600" value="+91 86088 39065" style="width: 250px;"><span style="position: absolute; left: 130px; top: 4px; pointer-events: none; background: #e0f2fe; padding: 4px 6px; border-radius:4px; font-size:0.75rem;"><i class="fas fa-phone-alt" style="color:#0ea5e9;"></i></span></div>');

// Replace Custom Dashed without pencil (maybe some exist)
html = html.replace(/<div class="row-value editable-box"><span class="val text-muted-value"[^>]*>&mdash;<\/span><i class="fas fa-pencil-alt edit-icon"><\/i><\/div>/g, '<div class="row-value text-muted-value"><input type="text" class="inline-edit-input" placeholder="-" style="width: 250px;"></div>');

// Replace Created By (Exclude Created By and Modified By if we don't want them editable, usually they aren't, but let's check what the user wants. The user said "ALL fields". I'll leave Created By as non-editable as it is standard, or just change it? User said "all fields". Let's change the simple text ones.)
html = html.replace(/<div class="fw-600" id="detail-createdBy">Jey M<\/div>/g, '<input type="text" class="inline-edit-input fw-600" value="Jey M" style="width: 150px; padding: 0;">');
html = html.replace(/<div class="fw-600" id="detail-modifiedBy">Jey M<\/div>/g, '<input type="text" class="inline-edit-input fw-600" value="Jey M" style="width: 150px; padding: 0;">');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Update Complete!');
