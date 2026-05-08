const fs = require('fs');

// 1. Add Toast HTML to index.html
let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('<div id="zoho-toast"')) {
    html = html.replace('</body>', <div id="zoho-toast" class="zoho-toast hidden"><i class="fas fa-check-circle"></i> <span id="zoho-toast-msg">Candidate updated successfully</span></div>\n</body>);
    fs.writeFileSync('index.html', html, 'utf8');
}

// 2. Add Toast CSS to style.css
let css = fs.readFileSync('style.css', 'utf8');
if (!css.includes('.zoho-toast')) {
    css += \n/* Built-in Auto-Save Toast */
.zoho-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #10b981;
    color: white;
    padding: 10px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    z-index: 9999;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease, top 0.3s ease;
}
.zoho-toast.show {
    opacity: 1;
    visibility: visible;
    top: 30px;
}
;
    fs.writeFileSync('style.css', css, 'utf8');
}

// 3. Add JS Logic for Auto-Save
let js = fs.readFileSync('script.js', 'utf8');
if (!js.includes('function showToast')) {
    const autoSaveJS = 
// Universal Inline Auto-Save Logic
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('inline-edit-input')) {
        const input = e.target;
        const parentId = input.parentElement.id;
        
        // Map UI IDs to Candidate Data Model
        let fieldName = null;
        if (parentId.includes('mobile')) fieldName = 'mobile';
        else if (parentId.includes('email')) fieldName = 'email';
        else if (parentId.includes('jobTitle')) fieldName = 'jobTitle';
        else if (parentId.includes('name')) fieldName = 'name';
        else if (parentId.includes('city')) fieldName = 'city';
        
        if (fieldName && state.currentCandidateId) {
            const candidate = state.candidates.find(c => c.id === state.currentCandidateId);
            if (candidate) {
                candidate[fieldName] = input.value;
                showToast(fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' updated successfully!');
                
                // Keep UI elements in sync (e.g. updating mobile updates both mobile fields)
                showCandidateDetail(state.currentCandidateId);
                renderCandidatesList(); 
            }
        }
    }
});

function showToast(msg) {
    const toast = document.getElementById('zoho-toast');
    const toastMsg = document.getElementById('zoho-toast-msg');
    if (!toast) return;
    if (msg) toastMsg.textContent = msg;
    
    toast.classList.remove('hidden');
    // slight delay for transition
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}
;
    js = js + \n\n + autoSaveJS;
    fs.writeFileSync('script.js', js, 'utf8');
}

console.log("Auto-save Toast UI and Listener Added");
