/* script.js */
window.onerror = function (msg, url, line, col, error) {
    alert("JS Error: " + msg + "\nAt: " + line + ":" + col);
    return false;
};

// Global State
const state = {
    user: {
        name: localStorage.getItem('recruitUserName') || "Admin",
        initials: (localStorage.getItem('recruitUserName') || 'A').charAt(0).toUpperCase()
    },
    users: (function() {
        const list = [{ name: "Jey M", email: "jey@example.com" }];
        const currentName = localStorage.getItem('recruitUserName') || "Admin";
        if (currentName !== "Jey M") {
            list.push({ name: currentName, email: currentName.toLowerCase().replace(/\s+/g, '') + "@example.com" });
        }
        return list;
    })(),
    noteSortOrder: 'recent_first',
    candidates: [],
    allCandidates: [],
    currentView: "All Candidates",

    departments: [],
    assessments: [],
    pincodes: {
        "110001": { city: "New Delhi", state: "Delhi", country: "India" },
        "400001": { city: "Mumbai", state: "Maharashtra", country: "India" },
        "560001": { city: "Bengaluru", state: "Karnataka", country: "India" },
        "600001": { city: "Chennai", state: "Tamil Nadu", country: "India" },
        "700001": { city: "Kolkata", state: "West Bengal", country: "India" }
    },
    filterOptions: [
        { label: "Assessment Name", icon: `<i class="fas fa-star" style="color:#f59e0b; font-size:0.7em;"></i>` },
        { label: "Candidate Stage" },
        { label: "Located within" },
        { label: "Rating" },
        { label: "First Name" },
        { label: "Last Name" },
        { label: "City" },
        { label: "Mobile" },
        { label: "Modified Time" },
        { label: "To-Dos" },
        { label: "Notes" },
        { label: "Attachment Category" },
        { label: "Additional Info" },
        { label: "Associated any Social Profiles" },
        { label: "Associated Tags" },
        { label: "Candidate ID" },
        { label: "Candidate Owner" },
        { label: "Candidate Status" },
        { label: "Career Page Invite Status" },
        { label: "Country" },
        { label: "Created By" },
        { label: "Created Time" },
        { label: "Current Employer" },
        { label: "Current Job Title" },
        { label: "Current Salary" },
        { label: "Email" },
        { label: "Email Opt Out" },
        { label: "Expected Salary" },
        { label: "Experience in Years" },
        { label: "Facebook" },
        { label: "Fax" },
        { label: "Fresh Candidate" },
        { label: "Highest Qualification Held" },
        { label: "Is Attachment Present" },
        { label: "Is Blocked" },
        { label: "Is Locked" },
        { label: "Is Unqualified" },
        { label: "Last Activity Time" },
        { label: "Last emailed" },
        { label: "LinkedIn" },
        { label: "Modified By" },
        { label: "Number of Applications" },
        { label: "Origin" },
        { label: "Phone" },
        { label: "Postal Code" },
        { label: "Province" },
        { label: "Salutation" },
        { label: "Secondary Email" },
        { label: "Skill Set" },
        { label: "Skype ID" },
        { label: "Source" },
        { label: "Street" },
        { label: "Twitter" },
        { label: "Website" }
    ],
    pipelineStages: ["New", "In Review", "Available", "Engaged", "Offered", "Hired", "Rejected"],
    currentCandidateId: null,
    isEditMode: false,
    candidatesPage: 1,
    candidatesPerPage: 100
};

// DOM Elements
const elements = {
    navAvatar: document.getElementById('nav-avatar'),
    welcomeMessage: document.getElementById('welcome-message'),
    navLinks: document.querySelectorAll('.nav-menu a[data-page]'),
    pages: document.querySelectorAll('.page-section'),

    // Candidates Module
    candidatesListView: document.getElementById('candidates-list-view'),
    candidatesCreateView: document.getElementById('candidates-create-view'),
    candidatesDetailView: document.getElementById('candidates-detail-view'),
    candidatesTableBody: document.querySelector('#candidates-table tbody'),
    btnToggleFilter: document.getElementById('btn-toggle-filter'),
    candidatesFilterSidebar: document.getElementById('candidates-filter-sidebar'),
    btnAddCandidate: document.getElementById('btn-add-candidate'),
    btnImportCandidate: document.getElementById('btn-import-candidate'),
    btnCancelCreate: document.getElementById('btn-cancel-create'),
    btnCancelCreate2: document.getElementById('btn-cancel-create-2'),
    btnSaveCandidate: document.getElementById('btn-save-candidate'),
    formCreateCandidate: document.getElementById('create-candidate-form'),
    btnBackDetail: document.getElementById('btn-back-detail'),

    // Tables
    departmentsTableBody: document.querySelector('#departments-table tbody'),
    assessmentsTableBody: document.querySelector('#assessments-table tbody'),

    // Form Inputs (Dynamic behavior)
    pinCodeInput: document.getElementById('pinCode'),
    cityInput: document.getElementById('city'),
    stateInput: document.getElementById('state'),
    countryInput: document.getElementById('country'),
    skillInput: document.getElementById('skill-input'),
    tagsList: document.getElementById('tags-list'),
    ownerSelect: document.getElementById('owner-select'),

    // Dynamic Blocks (Edu & Exp)
    btnAddEducation: document.getElementById('btn-add-education'),
    educationBlocks: document.getElementById('education-blocks'),
    btnAddExperience: document.getElementById('btn-add-experience'),
    experienceBlocks: document.getElementById('experience-blocks'),
    candidateFormTitle: document.getElementById('candidate-form-title'),
    btnEditCandidateDetail: document.getElementById('btn-edit-candidate-detail'),
    btnPrevCandidate: document.getElementById('btn-prev-candidate'),
    btnNextCandidate: document.getElementById('btn-next-candidate'),
};

let currentSkills = [];

async function init() {
    updateUserInfo();
    setupNavigation();
    renderDepartmentsTable();
    renderAssessmentsTable();
    renderFilters();
    populateSelects();
    initSearchableSelects();
    setupEventListeners();

    // Initial dynamic form blocks
    addEducationBlock();
    addExperienceBlock();

    // Fetch Candidates from Database and Render
    await loadCandidates();

    // Setup Choose Columns + Refresh listeners after DOM is ready
    setupChooseColumnsListeners();
    setupCommonViews();
    setupNotesListeners();
    setupInterviewListeners();
    setupEmailListeners();
    setupRelatedListNavigation();

    navigate('candidates');
}

function setupCommonViews() {
    const viewDropdown = document.querySelector('.module-view-dropdown');
    if (!viewDropdown) return;
    const viewLinks = viewDropdown.querySelectorAll('.dropdown-menu a');
    const viewLabel = viewDropdown.querySelector('.dropdown-toggle');

    viewLinks.forEach(link => {
        if (link.textContent.includes('Create View')) return;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Normalize whitespace to handle HTML newlines and spaces
            const viewName = link.textContent.replace(/\s+/g, ' ').trim();
            state.currentView = viewName;

            viewLabel.innerHTML = `${viewName} <i class="fas fa-caret-down" style="font-size: 0.8em; margin-left: 4px;"></i>`;
            applyFiltersToCandidates();
        });
    });
}

// Fetch from Backend
async function loadCandidates() {
    try {
        const response = await fetch('/api/candidates');
        const result = await response.json();
        if (result.message === "success") {
            state.candidates = result.data.map(c => ({
                ...c,
                id: c.id,
                rating: 0,
                name: `${c.firstName} ${c.lastName}`.trim(),
                city: c.city || '',
                mobile: c.mobile || '',
                stage: c.status || 'New',
                modifiedTime: new Date(c.modifiedTime || c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                email: c.email || '',
                mobile: c.mobile || '',
                phone: c.phone || '',
                secondaryEmail: c.secondaryEmail || '',
                address1: c.address1 || '',
                address2: c.address2 || '',
                pinCode: c.pinCode || '',
                state: c.state || '',
                country: c.country || '',
                experience: c.experience || '',
                qualification: c.qualification || '',
                jobTitle: c.jobTitle || '',
                employer: c.employer || '',
                expectedSalary: c.expectedSalary || '',
                currentSalary: c.currentSalary || '',
                skills: typeof c.skills === 'string' ? JSON.parse(c.skills) : (c.skills || []),
                additionalInfo: c.additionalInfo || '',
                skypeId: c.skypeId || '',
                linkedin: c.linkedin || '',
                twitter: c.twitter || '',
                source: c.source || '',
                owner: c.owner || '',
                emailOptOut: !!c.emailOptOut,
                education: typeof c.education === 'string' ? JSON.parse(c.education) : (c.education || []),
                experienceList: typeof c.experienceList === 'string' ? JSON.parse(c.experienceList) : (c.experienceList || []),
                attachments: typeof c.attachments === 'string' ? JSON.parse(c.attachments) : (c.attachments || []),
                notes: typeof c.notes === 'string' ? JSON.parse(c.notes) : (c.notes || []),
                rawModifiedTime: new Date(c.modifiedTime || c.createdAt).getTime()
            }));
            state.allCandidates = [...state.candidates];
            applyFiltersToCandidates();
        }
    } catch (error) {
        console.error("Error loading candidates from database", error);
    }
}

// User Info Updates
function updateUserInfo() {
    if (state.user.name === "Guest") {
        let pName = prompt("Please enter your full name for the dashboard:");
        if (pName && pName.trim() !== '') {
            state.user.name = pName.trim();
            localStorage.setItem('recruitUserName', state.user.name);
        } else {
            state.user.name = "Recruiter";
        }
    }

    // Dynamically calculate initials
    const words = state.user.name.split(' ');
    state.user.initials = words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : words[0][0].toUpperCase();

    if (elements.navAvatar) {
        elements.navAvatar.textContent = state.user.initials;
    }
    if (elements.welcomeMessage) {
        elements.welcomeMessage.textContent = `Welcome ${state.user.name}`;
    }
}

// Navigation / SPA Setup
function setupNavigation() {
    document.querySelector('.nav-menu').addEventListener('click', (e) => {
        const link = e.target.closest('a[data-page]');
        if (link) {
            // Handle dropdown parents carefully
            const isParent = link.parentElement.classList.contains('dropdown');
            if (isParent && link.getAttribute('data-page') === 'candidates' && e.target.classList.contains('nav-chevron')) {
                // Let the hover/CSS handle the menu, or toggle it if mobile
                return;
            }

            e.preventDefault();
            navigate(link.getAttribute('data-page'));
        }
    });
}

function navigate(pageId) {
    state.currentPage = pageId;

    // 1. Update Navigation Menu UI
    document.querySelectorAll('.nav-menu a[data-page]').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
            const parentDropdown = link.closest('.dropdown');
            if (parentDropdown) {
                const parentLink = parentDropdown.querySelector('a[data-page]');
                if (parentLink) parentLink.classList.add('active');
            }
        }
    });

    // 2. Switch Visibility of Sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        if (section.id === `page-${pageId}`) {
            section.classList.remove('hidden');
            section.style.setProperty('display', 'flex', 'important');
        } else {
            section.classList.add('hidden');
            section.style.setProperty('display', 'none', 'important');
        }
    });

    // 3. Special handling for Candidates Module
    if (pageId === 'candidates') {
        showCandidatesList();
    }
}

// --- Candidates Module Functions --- //

function showCandidatesList() {
    elements.candidatesListView.classList.remove('hidden');
    elements.candidatesCreateView.classList.add('hidden');
    elements.candidatesDetailView.classList.add('hidden');
    renderCandidatesTable();
}

function showCandidateCreate() {
    state.isEditMode = false;
    if (elements.candidateFormTitle) {
        elements.candidateFormTitle.innerHTML = `<i class="fas fa-arrow-left back-icon" id="btn-cancel-create"></i> Create Candidate`;
        const newBackIcon = document.getElementById('btn-cancel-create');
        if (newBackIcon) newBackIcon.onclick = showCandidatesList;
    }

    elements.candidatesListView.classList.add('hidden');
    elements.candidatesCreateView.classList.remove('hidden');
    elements.candidatesDetailView.classList.add('hidden');
    elements.formCreateCandidate.reset();
    currentSkills = [];
    renderSkills();

    // Reset dynamic blocks to 1
    elements.educationBlocks.innerHTML = '';
    elements.experienceBlocks.innerHTML = '';
    addEducationBlock();
    addExperienceBlock();

    // Reset searchable selects UI
    document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
        const select = wrapper.previousElementSibling;
        if (select && select.tagName === 'SELECT') {
            const display = wrapper.querySelector('.custom-select-value');
            if (display) display.textContent = select.options[0]?.text || 'None';
            const customInput = wrapper.querySelector('.custom-select-custom-input');
            if (customInput) customInput.classList.remove('visible');
        }
    });
}

function showCandidateEdit(id) {
    const candidate = state.candidates.find(c => c.id === id);
    if (!candidate) return;

    state.isEditMode = true;
    state.currentCandidateId = id;

    if (elements.candidateFormTitle) {
        elements.candidateFormTitle.innerHTML = `<i class="fas fa-arrow-left back-icon" id="btn-cancel-create"></i> Edit Candidate`;
        const newBackIcon = document.getElementById('btn-cancel-create');
        if (newBackIcon) newBackIcon.onclick = showCandidatesList;
    }

    elements.candidatesListView.classList.add('hidden');
    elements.candidatesCreateView.classList.remove('hidden');
    elements.candidatesDetailView.classList.add('hidden');

    // Reset form first
    elements.formCreateCandidate.reset();

    const form = elements.formCreateCandidate;

    if (form.elements['salutation']) {
        const nameParts = (candidate.firstName || '').split(' ');
        if (['Mr.', 'Ms.', 'Mrs.'].includes(nameParts[0])) {
            form.elements['salutation'].value = nameParts[0];
            form.elements['firstName'].value = nameParts.slice(1).join(' ');
        } else {
            form.elements['salutation'].value = '';
            form.elements['firstName'].value = candidate.firstName || '';
        }
    }

    if (form.elements['lastName']) form.elements['lastName'].value = candidate.lastName || '';
    if (form.elements['email']) form.elements['email'].value = candidate.email || '';
    if (form.elements['mobile']) form.elements['mobile'].value = candidate.mobile || '';
    if (form.elements['phone']) form.elements['phone'].value = candidate.phone || '';
    if (form.elements['secondaryEmail']) form.elements['secondaryEmail'].value = candidate.secondaryEmail || '';

    if (form.elements['address1']) form.elements['address1'].value = candidate.address1 || '';
    if (form.elements['address2']) form.elements['address2'].value = candidate.address2 || '';
    if (form.elements['pinCode']) form.elements['pinCode'].value = candidate.pinCode || '';
    if (form.elements['city']) form.elements['city'].value = candidate.city || '';
    if (form.elements['state']) form.elements['state'].value = candidate.state || '';
    if (form.elements['country']) form.elements['country'].value = candidate.country || '';

    if (form.elements['experience']) form.elements['experience'].value = candidate.experience || '';
    if (form.elements['qualification']) form.elements['qualification'].value = candidate.qualification || '';
    if (form.elements['jobTitle']) form.elements['jobTitle'].value = candidate.jobTitle || '';
    if (form.elements['employer']) form.elements['employer'].value = candidate.employer || '';
    if (form.elements['expectedSalary']) form.elements['expectedSalary'].value = candidate.expectedSalary || '';
    if (form.elements['currentSalary']) form.elements['currentSalary'].value = candidate.currentSalary || '';
    if (form.elements['additionalInfo']) form.elements['additionalInfo'].value = candidate.additionalInfo || '';
    if (form.elements['skypeId']) form.elements['skypeId'].value = candidate.skypeId || '';
    if (form.elements['linkedin']) form.elements['linkedin'].value = candidate.linkedin || '';
    if (form.elements['status']) form.elements['status'].value = candidate.status || '';
    if (form.elements['source']) form.elements['source'].value = candidate.source || '';
    if (form.elements['owner']) form.elements['owner'].value = candidate.owner || '';
    if (form.elements['emailOptOut']) form.elements['emailOptOut'].checked = !!candidate.emailOptOut;

    currentSkills = Array.isArray(candidate.skills) ? [...candidate.skills] : [];
    renderSkills();

    elements.educationBlocks.innerHTML = '';
    const eduData = Array.isArray(candidate.education) ? candidate.education : [];
    if (eduData.length > 0) {
        eduData.forEach(edu => {
            addEducationBlock();
            const lastBlock = elements.educationBlocks.lastElementChild;
            const inputs = lastBlock.querySelectorAll('input, select');
            inputs[0].value = edu.institute || '';
            inputs[1].value = edu.major || '';
            inputs[2].value = edu.degree || '';
            inputs[3].value = edu.fromMonth || 'Month';
            inputs[4].value = edu.fromYear || 'Year';
            inputs[5].value = edu.toMonth || 'Month';
            inputs[6].value = edu.toYear || 'Year';
            inputs[7].checked = !!edu.currentlyPursuing;
        });
    } else {
        addEducationBlock();
    }

    elements.experienceBlocks.innerHTML = '';
    const expData = Array.isArray(candidate.experienceList) ? candidate.experienceList : [];
    if (expData.length > 0) {
        expData.forEach(exp => {
            addExperienceBlock();
            const lastBlock = elements.experienceBlocks.lastElementChild;
            const inputs = lastBlock.querySelectorAll('input, select, textarea');
            inputs[0].value = exp.occupation || '';
            inputs[1].value = exp.company || '';
            inputs[2].value = exp.summary || '';
            inputs[3].value = exp.fromMonth || 'Month';
            inputs[4].value = exp.fromYear || 'Year';
            inputs[5].value = exp.toMonth || 'Month';
            inputs[6].value = exp.toYear || 'Year';
            inputs[7].checked = !!exp.currentlyWorking;
        });
    } else {
        addExperienceBlock();
    }

    document.querySelectorAll('select.searchable-select').forEach(select => {
        const wrapper = select.nextElementSibling;
        if (wrapper && wrapper.classList.contains('custom-select-wrapper')) {
            const display = wrapper.querySelector('.custom-select-value');
            if (display) display.textContent = select.options[select.selectedIndex]?.text || 'None';

            const customInput = wrapper.querySelector('.custom-select-custom-input');
            if (customInput) {
                if (select.options[select.selectedIndex]?.text === 'Custom') {
                    customInput.classList.add('visible');
                    customInput.value = select.options[select.selectedIndex].value;
                } else {
                    customInput.classList.remove('visible');
                    customInput.value = '';
                }
            }
        }
    });
}
function showCandidateDetail(id) {
    const candidate = state.candidates.find(c => c.id === id);
    if (!candidate) return;

    state.currentCandidateId = id;

    // Header
    const salutation = candidate.salutation || '';
    const fullName = (salutation ? salutation + ' ' : '') + candidate.name;
    const topNameEl = document.getElementById('detail-top-name');
    if (topNameEl) topNameEl.textContent = fullName;

    // Dynamic Candidate Stages
    let displayStages = [...state.pipelineStages];
    state.candidates.forEach(c => {
        const stage = c.stage || 'New';
        if (!displayStages.includes(stage)) {
            displayStages.push(stage);
        }
    });

    const boxesContainer = document.querySelector('.candidate-boxes-container');
    if (boxesContainer) {
        boxesContainer.innerHTML = displayStages.map((stage, idx) => `
            <div class="candidate-box ${candidate.stage === stage || (!candidate.stage && stage === 'New') ? 'active' : ''}">
                <div class="box-circle"></div>
                <div class="box-label">${stage}</div>
            </div>
        `).join('');
    }
    if (document.getElementById('detail-name-2')) document.getElementById('detail-name-2').textContent = fullName;
    if (document.getElementById('email-filter-candidate')) document.getElementById('email-filter-candidate').textContent = fullName;
    if (document.getElementById('email-filter-user')) document.getElementById('email-filter-user').textContent = state.user.name;

    document.getElementById('detail-avatar').textContent = candidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Fill Basic Values
    const mobile = candidate.mobile || '-';
    const email = candidate.email || '-';
    const jobTitle = candidate.jobTitle || '-';
    const city = candidate.city || '-';

    const safeUpdate = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        const input = el.querySelector('input');
        if (input) input.value = val;
        else el.textContent = val;
    };

    safeUpdate('detail-mobile', mobile);
    safeUpdate('detail-mobile-2', mobile);
    safeUpdate('detail-email', email);
    safeUpdate('detail-email-2', email);
    safeUpdate('detail-jobTitle', jobTitle);
    safeUpdate('detail-jobTitle-2', jobTitle);
    safeUpdate('detail-city-2', city);
    safeUpdate('detail-experience', candidate.experience ? candidate.experience + ' Years' : '-');
    safeUpdate('detail-name-2', fullName);

    // Populate new detail fields
    safeUpdate('detail-phone-2', candidate.phone || '-');
    safeUpdate('detail-secondaryEmail-2', candidate.secondaryEmail || '-');
    safeUpdate('detail-experience-2', candidate.experience ? candidate.experience + ' Years' : '-');
    safeUpdate('detail-qualification-2', candidate.qualification || '-');
    safeUpdate('detail-jobTitle-3', jobTitle);
    safeUpdate('detail-employer-2', candidate.employer || '-');
    safeUpdate('detail-expectedSalary-2', candidate.expectedSalary || '-');
    safeUpdate('detail-currentSalary-2', candidate.currentSalary || '-');
    safeUpdate('detail-skillSet-2', (candidate.skills && candidate.skills.length > 0) ? candidate.skills.join(', ') : '-');
    safeUpdate('detail-additionalInfo-2', candidate.additionalInfo || '-');
    safeUpdate('detail-skypeId-2', candidate.skypeId || '-');
    const linkedinVal = candidate.linkedin || '-';
    const linkedinEl = document.getElementById('detail-linkedin-2');
    if (linkedinEl) {
        if (linkedinVal !== '-' && (linkedinVal.startsWith('http') || linkedinVal.includes('linkedin.com'))) {
            linkedinEl.innerHTML = `<a href="${linkedinVal}" target="_blank" style="color: #0ea5e9; text-decoration: none;">${linkedinVal} <i class="fas fa-external-link-alt" style="font-size: 0.8em; margin-left: 5px;"></i></a>`;
        } else {
            linkedinEl.textContent = linkedinVal;
        }
    }

    // Address Information fields
    safeUpdate('detail-street-2', candidate.address1 || '-');
    safeUpdate('detail-city-2', candidate.city || '-');
    safeUpdate('detail-province-2', candidate.state || '-');
    safeUpdate('detail-pinCode-2', candidate.pinCode || '-');
    safeUpdate('detail-country-2', candidate.country || '-');

    // Generated Fields
    safeUpdate('detail-id', 'ZR_' + id + '_CAND');

    // Education Rendering
    const eduList = document.getElementById('detail-education-list');
    const eduTitle = document.getElementById('detail-education-title');
    if (eduList && eduTitle) {
        const eduData = candidate.education || [];
        if (eduData.length > 0) {
            eduTitle.textContent = 'Educational Details';
            eduList.innerHTML = eduData.map((edu, idx) => `
                <div class="timeline-item">
                    <div class="timeline-marker">${idx + 1}</div>
                    <div class="timeline-line"></div>
                    <div class="timeline-content">
                        <div class="timeline-field">
                            <div class="timeline-field-label">Institute / School</div>
                            <div class="timeline-field-value">${edu.school || edu.institute || '-'}</div>
                        </div>
                        <div class="timeline-field">
                            <div class="timeline-field-label">Major / Department</div>
                            <div class="timeline-field-value">${edu.major || '-'}</div>
                        </div>
                        <div class="timeline-field">
                            <div class="timeline-field-label">Degree</div>
                            <div class="timeline-field-value">${edu.degree || '-'}</div>
                        </div>
                        <div class="timeline-field">
                            <div class="timeline-field-label">Duration</div>
                            <div class="timeline-field-value">
                                ${(() => {
                    // Support both migrated format (durationFrom: "Jan-2021") and manual entry format (fromMonth/fromYear)
                    const from = edu.durationFrom
                        ? edu.durationFrom.replace('-', ' ')
                        : ((edu.fromMonth && edu.fromMonth !== 'Month') ? edu.fromMonth + ' ' : '') + ((edu.fromYear && edu.fromYear !== 'Year') ? edu.fromYear : '');
                    const to = edu.durationTo
                        ? edu.durationTo.replace('-', ' ')
                        : ((edu.toMonth && edu.toMonth !== 'Month') ? edu.toMonth + ' ' : '') + ((edu.toYear && edu.toYear !== 'Year') ? edu.toYear : '');
                    if (!from && !to) return '-';
                    return (from || '') + (to ? ' - ' + to : '');
                })()}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            eduTitle.textContent = 'Educational Details -';
            eduList.innerHTML = '';
        }
    }

    // Experience Rendering
    const expList = document.getElementById('detail-experience-list');
    const expTitle = document.getElementById('detail-experience-title');
    if (expList && expTitle) {
        const expData = candidate.experienceList || [];
        if (expData.length > 0) {
            expTitle.textContent = 'Experience Details';
            expList.innerHTML = expData.map((exp, idx) => `
                <div class="timeline-item">
                    <div class="timeline-marker">${idx + 1}</div>
                    <div class="timeline-line"></div>
                    <div class="timeline-content">
                        <div class="timeline-field">
                            <div class="timeline-field-label">Occupation / Title</div>
                            <div class="timeline-field-value">${exp.title || exp.occupation || '-'}</div>
                        </div>
                        <div class="timeline-field">
                            <div class="timeline-field-label">Company</div>
                            <div class="timeline-field-value">${exp.company || '-'}</div>
                        </div>
                        <div class="timeline-field">
                            <div class="timeline-field-label">Summary</div>
                            <div class="timeline-field-value muted">${exp.summary || '-'}</div>
                        </div>
                        <div class="timeline-field">
                            <div class="timeline-field-label">Duration</div>
                            <div class="timeline-field-value">
                                ${(() => {
                    // Support both migrated format (durationFrom: "Jan-2024") and manual entry format (fromMonth/fromYear)
                    const from = exp.durationFrom
                        ? exp.durationFrom.replace('-', ' ')
                        : ((exp.fromMonth && exp.fromMonth !== 'Month') ? exp.fromMonth + ' ' : '') + ((exp.fromYear && exp.fromYear !== 'Year') ? exp.fromYear : '');
                    const to = exp.durationTo
                        ? exp.durationTo.replace('-', ' ')
                        : ((exp.toMonth && exp.toMonth !== 'Month') ? exp.toMonth + ' ' : '') + ((exp.toYear && exp.toYear !== 'Year') ? exp.toYear : '');
                    if (!from && !to) return '-';
                    return (from || '') + (to ? ' - ' + to : '');
                })()}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            expTitle.textContent = 'Experience Details -';
            expList.innerHTML = '';
        }
    }

    const stageSelect = document.getElementById('detail-stage-select');
    if (stageSelect) {
        let found = false;
        for (let i = 0; i < stageSelect.options.length; i++) {
            if (stageSelect.options[i].value === candidate.stage || stageSelect.options[i].text === candidate.stage) {
                stageSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found && candidate.stage && stageSelect.options.length > 0) {
            stageSelect.options[stageSelect.options.length - 1].value = candidate.stage;
            stageSelect.selectedIndex = stageSelect.options.length - 1;
            const customInput = stageSelect.parentNode.querySelector('.custom-select-custom-input');
            if (customInput) customInput.value = candidate.stage;
        } else {
            const customInput = stageSelect.parentNode ? stageSelect.parentNode.querySelector('.custom-select-custom-input') : null;
            if (customInput) customInput.value = '';
        }
        stageSelect.dispatchEvent(new Event('change'));
    }

    // Update Source Select — normalize both sides (remove spaces, lowercase) for robust matching
    const sourceSelect = document.getElementById('detail-source-select');
    if (sourceSelect) {
        const sourceVal = candidate.source || '';
        const normalize = str => str.replace(/\s+/g, '').toLowerCase();
        const normalizedSource = normalize(sourceVal);
        let found = false;
        for (let i = 0; i < sourceSelect.options.length; i++) {
            const optText = normalize(sourceSelect.options[i].text);
            const optVal = normalize(sourceSelect.options[i].value);
            if (optText === normalizedSource || optVal === normalizedSource) {
                sourceSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        if (!found && sourceVal && sourceSelect.options.length > 0) {
            // Source not in list — add it as a new option before Custom
            const newOpt = document.createElement('option');
            newOpt.value = sourceVal;
            newOpt.text = sourceVal;
            sourceSelect.insertBefore(newOpt, sourceSelect.options[sourceSelect.options.length - 1]);
            sourceSelect.selectedIndex = sourceSelect.options.length - 2;
        }
        const customInput = sourceSelect.parentNode ? sourceSelect.parentNode.querySelector('.custom-select-custom-input') : null;
        if (customInput) customInput.classList.remove('visible');
        sourceSelect.dispatchEvent(new Event('change'));
    }

    // Update Owner Span (Clean text display)
    if (document.getElementById('detail-owner-val')) document.getElementById('detail-owner-val').textContent = candidate.owner || '-';

    if (document.getElementById('detail-createdBy')) document.getElementById('detail-createdBy').textContent = candidate.createdBy || '-';
    if (document.getElementById('detail-createdTime')) document.getElementById('detail-createdTime').textContent = candidate.createdAt || '-';
    if (document.getElementById('detail-modifiedBy')) document.getElementById('detail-modifiedBy').textContent = candidate.modifiedBy || '-';
    if (document.getElementById('detail-modifiedTime')) document.getElementById('detail-modifiedTime').textContent = candidate.modifiedTime || '-';

    // Update Email Section with candidate info
    const emailCandidateLabel = document.getElementById('email-filter-candidate');
    const emailUserLabel = document.getElementById('email-filter-user');
    if (emailCandidateLabel) emailCandidateLabel.textContent = (candidate.firstName + ' ' + (candidate.lastName || '')).toUpperCase();
    if (emailUserLabel) emailUserLabel.textContent = state.user.name;

    // Dynamic Lists (Notes, Attachments, etc)
    const notesContainer = document.getElementById('detail-notes-container');
    const notesSidebarCount = document.getElementById('sidebar-notes-count');
    if (notesContainer) {
        if (candidate.notes && candidate.notes.length > 0) {
            // Sort notes — support both 'timestamp' (manually added) and 'createdAt' (migrated)
            let sortedNotes = [...candidate.notes];
            const getNoteDate = n => new Date(n.timestamp || n.createdAt || 0);
            if (state.noteSortOrder === 'recent_first') {
                sortedNotes.sort((a, b) => getNoteDate(b) - getNoteDate(a));
            } else {
                sortedNotes.sort((a, b) => getNoteDate(a) - getNoteDate(b));
            }

            notesContainer.innerHTML = sortedNotes.map(note => {
                // Derive initials from author name dynamically
                const authorName = note.author || 'Unknown';
                const initials = note.authorInitials || authorName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                // Use createdAt (migrated) or timespan (manually added)
                const dateDisplay = note.timespan || note.createdAt || '';
                return `
                <div class="note-item" data-note-id="${note.id || ''}" style="display:flex; gap: 15px; margin-bottom: 25px;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; background: #3b82f6; color: #fff; display:flex; justify-content:center; align-items:center; font-weight:600; font-size:1rem; flex-shrink:0;">${initials}</div>
                    <div style="flex-grow: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                            <div style="font-size: 0.95rem;">
                                <span style="font-weight: 600; color:#111827;">${authorName}</span> <span style="color:#6b7280;">posted a note with the title</span> <span style="font-weight: 600; color:#111827;">"${note.title || 'Note'}"</span>
                            </div>
                            <div style="display: flex; gap: 12px; color: #9ca3af; font-size: 0.9rem;">
                                <i class="fas fa-pencil-alt" style="cursor: pointer;" onclick="event.stopPropagation(); editNote('${note.id || ''}')"></i>
                                <i class="fas fa-trash-alt" style="cursor: pointer;" onclick="event.stopPropagation(); deleteNote('${note.id || ''}')"></i>
                            </div>
                        </div>
                        <div style="font-size: 0.95rem; color: #374151; line-height: 1.5; margin-bottom: 6px;">${note.content || ''}</div>
                        ${note.attachments && note.attachments.length > 0 ? `
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                                ${note.attachments.map((att, attIdx) => `
                                    <div class="note-att-pill" onclick="previewNoteAttachment('${note.id || ''}', ${attIdx})" style="display: flex; align-items: center; gap: 6px; background: #f9fafb; padding: 4px 10px; border-radius: 4px; border: 1px solid #e5e7eb; font-size: 0.75rem; color: #4b5563; cursor: pointer; transition: 0.2s;">
                                        <i class="far fa-file-alt"></i> ${att.filename}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        <div style="font-size: 0.8rem; color: #9ca3af;">${dateDisplay}</div>
                    </div>
                </div>`;
            }).join('');
            if (notesSidebarCount) {
                notesSidebarCount.textContent = candidate.notes.length;
                notesSidebarCount.classList.remove('hidden');
            }
        } else {
            notesContainer.innerHTML = `<p style="color: #6b7280; font-size: 0.9rem; margin:0; text-align: center; font-weight: 500; margin-bottom: 20px;">No records found</p>`;
            if (notesSidebarCount) {
                notesSidebarCount.classList.add('hidden');
            }
        }
    }

    const attsTbody = document.getElementById('detail-attachments-tbody');
    const attsSidebarCount = document.getElementById('sidebar-atts-count');
    if (attsTbody) {
        if (candidate.attachments && candidate.attachments.length > 0) {
            attsTbody.innerHTML = candidate.attachments.map(att => `
                <tr class="attachment-row-item" data-category="${att.category || 'Others'}" style="border-bottom: 1px solid #e5e7eb; color: #111827;">
                    <td style="padding: 12px 20px;"><input type="checkbox"></td>
                    <td style="padding: 12px 20px; color: #2563eb; display:flex; align-items:center; gap:8px; cursor: pointer;"><i class="far fa-file-pdf" style="color:#ef4444; font-size:1.1rem;"></i> <span class="attachment-filename">${att.filename || att.fileName || '-'}</span></td>
                    <td style="padding: 12px 20px;">${att.attachedBy || '-'}</td>
                    <td style="padding: 12px 20px;">${att.dateCreated || '-'}</td>
                    <td style="padding: 12px 20px;">${att.modifiedBy || '-'}</td>
                    <td style="padding: 12px 20px;">${att.dateModified || '-'}</td>
                    <td style="padding: 12px 20px;">${att.size || '-'}</td>
                    <td style="padding: 12px 20px;"><span style="background: #f3f4f6; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; color: #4b5563;">${att.category || 'Others'}</span></td>
                </tr>
            `).join('');
            if (attsSidebarCount) {
                attsSidebarCount.textContent = candidate.attachments.length;
                attsSidebarCount.classList.remove('hidden');
            }
        } else {
            attsTbody.innerHTML = `<tr><td colspan="8" style="padding: 20px; text-align: center; color: #6b7280;">No records found</td></tr>`;
            if (attsSidebarCount) {
                attsSidebarCount.classList.add('hidden');
            }
        }
    }

    // Set Active Stage visually on the timeline tracker
    const stages = document.querySelectorAll('.stage-circle');
    let found = false;
    stages.forEach(el => {
        el.classList.remove('active');
        const label = el.querySelector('.stage-label');
        if (label && label.textContent === candidate.stage) {
            el.classList.add('active');
            found = true;
        } else if (!found) {
            // Can add 'completed' class if we want, currently just standard
        }
    });

    elements.candidatesListView.classList.add('hidden');
    elements.candidatesCreateView.classList.add('hidden');
    elements.candidatesDetailView.classList.remove('hidden');

    // Update navigation arrows state
    const currentIndex = state.candidates.findIndex(c => c.id === id);
    if (elements.btnPrevCandidate) {
        elements.btnPrevCandidate.style.opacity = currentIndex <= 0 ? '0.3' : '1';
        elements.btnPrevCandidate.style.cursor = currentIndex <= 0 ? 'default' : 'pointer';
    }
    if (elements.btnNextCandidate) {
        elements.btnNextCandidate.style.opacity = currentIndex >= state.candidates.length - 1 ? '0.3' : '1';
        elements.btnNextCandidate.style.cursor = currentIndex >= state.candidates.length - 1 ? 'default' : 'pointer';
    }
}

function navigateCandidate(dir) {
    if (!state.currentCandidateId) return;
    const currentIndex = state.candidates.findIndex(c => c.id === state.currentCandidateId);
    if (currentIndex === -1) return;

    const newIndex = currentIndex + dir;
    if (newIndex >= 0 && newIndex < state.candidates.length) {
        showCandidateDetail(state.candidates[newIndex].id);
    }
}

// --- Rendering Tables and Dynamic Elements --- //


// Field mapping: filter label → candidate object key
const FILTER_FIELD_MAP = {
    'First Name': c => c.firstName || '',
    'Last Name': c => c.lastName || '',
    'City': c => c.city || '',
    'Mobile': c => c.mobile || '',
    'Email': c => c.email || '',
    'Candidate Stage': c => c.stage || '',
    'Candidate Status': c => c.status || '',
    'Current Employer': c => c.employer || '',
    'Current Job Title': c => c.jobTitle || '',
    'Experience in Years': c => String(c.experience || ''),
    'Source': c => c.source || '',
    'Candidate Owner': c => c.owner || '',
    'Country': c => c.country || '',
    'Secondary Email': c => c.secondaryEmail || '',
    'Skill Set': c => (c.skills || []).join(', '),
    'Phone': c => c.phone || '',
    'Postal Code': c => c.pinCode || '',
    'Province': c => c.state || '',
    'Candidate ID': c => 'ZR_' + c.id + '_CAND',
    'LinkedIn': c => c.linkedin || '',
    'Twitter': c => c.twitter || '',
    'Skype ID': c => c.skypeId || '',
    'Additional Info': c => c.additionalInfo || '',
    'Expected Salary': c => c.expectedSalary || '',
    'Current Salary': c => c.currentSalary || '',
    'Highest Qualification Held': c => c.qualification || '',
    'Modified Time': c => c.modifiedTime || '',
    'Notes': c => (c.notes || []).map(n => (n.title || '') + ' ' + (n.content || '')).join(' '),
};

// Active filter state
let activeFilters = {}; // { "First Name": { operator: "contains", value: "praveen" } }
let allCandidatesBackup = null; // backup of full list before filtering

function renderFilters() {
    const filterContainer = document.getElementById('filter-checkbox-list');
    if (!filterContainer) return;
    filterContainer.innerHTML = '';

    state.filterOptions.forEach(opt => {
        const wrapper = document.createElement('div');
        wrapper.className = 'filter-item-wrapper';
        wrapper.style.cssText = 'border-bottom: 1px solid #f3f4f6; padding: 8px 0;';

        const label = document.createElement('label');
        label.style.cssText = 'display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.85rem; color:#374151; user-select:none;';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.cssText = 'width:14px; height:14px; cursor:pointer; accent-color:#2563eb;';
        // Restore checked state if filter is already active
        if (activeFilters[opt.label]) checkbox.checked = true;

        const span = document.createElement('span');
        span.textContent = opt.label;
        if (opt.icon) span.innerHTML += ' ' + opt.icon;

        label.appendChild(checkbox);
        label.appendChild(span);
        wrapper.appendChild(label);

        // Sub-filter row (contains + input)
        const subRow = document.createElement('div');
        subRow.className = 'filter-sub-row';
        subRow.style.cssText = `display:${activeFilters[opt.label] ? 'block' : 'none'}; margin-top:6px; padding-left:22px;`;

        const isMappable = !!FILTER_FIELD_MAP[opt.label];

        if (isMappable) {
            subRow.innerHTML = `
                <select class="filter-operator" style="font-size:0.78rem; border:1px solid #d1d5db; border-radius:4px; padding:3px 6px; color:#374151; width:100%; margin-bottom:5px; background:#f9fafb;">
                    <option value="contains">contains</option>
                    <option value="not_contains">doesn't contain</option>
                    <option value="equals">equals</option>
                    <option value="starts_with">starts with</option>
                </select>
                <input type="text" class="filter-value-input" placeholder="Enter value..." 
                    style="font-size:0.8rem; border:1px solid #d1d5db; border-radius:4px; padding:4px 8px; width:100%; box-sizing:border-box; color:#e84646; outline:none;"
                    value="${activeFilters[opt.label] ? activeFilters[opt.label].value : ''}">
            `;
            if (activeFilters[opt.label]) {
                subRow.querySelector('.filter-operator').value = activeFilters[opt.label].operator;
            }
        } else {
            subRow.innerHTML = `<span style="font-size:0.75rem; color:#9ca3af;">Advanced filter not available for this field.</span>`;
        }

        wrapper.appendChild(subRow);
        filterContainer.appendChild(wrapper);

        // Checkbox toggle shows/hides sub-row and action bar
        checkbox.addEventListener('change', () => {
            subRow.style.display = checkbox.checked ? 'block' : 'none';
            if (!checkbox.checked) {
                delete activeFilters[opt.label];
            }
            updateFilterActionBar();
        });
    });

    // Setup Apply + Clear button listeners
    const applyBtn = document.getElementById('btn-apply-filter');
    const clearBtn = document.getElementById('btn-clear-filter');

    if (applyBtn) {
        applyBtn.onclick = () => {
            // Collect all checked filters
            activeFilters = {};
            const wrappers = filterContainer.querySelectorAll('.filter-item-wrapper');
            wrappers.forEach((wrapper, i) => {
                const cb = wrapper.querySelector('input[type="checkbox"]');
                const label = state.filterOptions[i]?.label;
                if (cb && cb.checked && label && FILTER_FIELD_MAP[label]) {
                    const operator = wrapper.querySelector('.filter-operator')?.value || 'contains';
                    const value = (wrapper.querySelector('.filter-value-input')?.value || '').trim();
                    if (value) {
                        activeFilters[label] = { operator, value };
                    }
                }
            });
            applyFiltersToCandidates();
        };
    }

    if (clearBtn) {
        clearBtn.onclick = () => {
            activeFilters = {};
            applyFiltersToCandidates();
            renderFilters(); // re-render to uncheck all
            updateFilterActionBar();
        };
    }

    updateFilterActionBar();
}

function updateFilterActionBar() {
    const bar = document.getElementById('filter-action-bar');
    if (!bar) return;
    const anyChecked = document.querySelector('#filter-checkbox-list input[type="checkbox"]:checked');
    bar.style.display = anyChecked ? 'block' : 'none';
}

function applyFiltersToCandidates() {
    let filtered = [...state.allCandidates];

    // 0. Global Search Filter
    const searchInput = document.getElementById('global-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (query) {
        filtered = filtered.filter(c => {
            const name = (c.name || '').toLowerCase();
            const idStr = ('ZR_' + c.id + '_CAND').toLowerCase();
            const rawId = String(c.id).toLowerCase();
            return name.includes(query) || idStr.includes(query) || rawId.includes(query);
        });
    }

    // 1. Apply Common View Filter
    if (state.currentView && state.currentView !== "All Candidates") {
        filtered = filtered.filter(c => {
            switch (state.currentView) {
                case "Blocked Candidates":
                    return c.stage === "Blocked" || c.status === "Blocked";
                case "Converted to Employee":
                    return c.stage === "Converted to Employee" || c.stage === "Converted";
                case "Converted to Temp":
                    return c.stage === "Converted - Temp" || c.stage === "Converted to Temp";
                case "Hired Candidates":
                    return c.stage === "Hired";
                case "Invitation Expired Candidates":
                    return c.stage === "Invitation Expired";
                case "My Candidates":
                    return c.owner === state.user.name;
                case "Recent Candidates":
                    if (!c.modifiedTime && !c.createdTime) return true;
                    // Try to parse the date safely, default to 0 if invalid
                    let cDateStr = c.modifiedTime || c.createdTime;
                    let cDate = new Date(cDateStr);
                    if (isNaN(cDate.getTime()) && typeof cDateStr === 'string') {
                        // Handle "DD MMM YYYY" format from loadCandidates if needed
                        cDate = new Date(Date.now()); // fallback
                    }
                    const diffDays = (new Date() - cDate) / (1000 * 60 * 60 * 24);
                    return diffDays <= 7;
                case "Top Rated Candidates":
                    return c.rating >= 4;
                default:
                    return true;
            }
        });
    }

    // 2. Apply Sidebar Filters
    Object.entries(activeFilters).forEach(([label, { operator, value }]) => {
        const getter = FILTER_FIELD_MAP[label];
        if (!getter || !value) return;
        const lowerVal = value.toLowerCase();

        filtered = filtered.filter(c => {
            const fieldVal = getter(c).toLowerCase();
            switch (operator) {
                case 'contains': return fieldVal.includes(lowerVal);
                case 'not_contains': return !fieldVal.includes(lowerVal);
                case 'equals': return fieldVal === lowerVal;
                case 'starts_with': return fieldVal.startsWith(lowerVal);
                default: return true;
            }
        });
    });

    // 3. Apply sorting (Default: Recently modified first)
    filtered.sort((a, b) => {
        return (b.rawModifiedTime || 0) - (a.rawModifiedTime || 0);
    });

    state.candidates = filtered;
    state.candidatesPage = 1;
    renderCandidatesTable();
}


function renderCandidatesTable() {
    // 1. Update Pipeline counts (dynamically generated from javascript state)
    let counts = {};
    let displayStages = [...state.pipelineStages];

    state.candidates.forEach(c => {
        const stage = c.stage || 'New';
        if (!displayStages.includes(stage)) {
            displayStages.push(stage);
        }
    });

    displayStages.forEach(stage => counts[stage] = 0);

    state.candidates.forEach(c => {
        const stage = c.stage || 'New';
        counts[stage]++;
    });

    const trackerContainer = document.getElementById('pipeline-tracker-stats');
    if (trackerContainer) {
        trackerContainer.innerHTML = '';
        displayStages.forEach((stage, index) => {
            const div = document.createElement('div');
            // Make the first one slightly "active" colored per request or just standard
            div.className = index === 0 ? 'tracker-stat-item active-stage' : 'tracker-stat-item';
            div.innerHTML = `<div class="count">${counts[stage]}</div><div class="label">${stage}</div>`;
            trackerContainer.appendChild(div);
        });

        const totalCountEl = document.getElementById('total-count-footer');
        if (totalCountEl) totalCountEl.textContent = state.candidates.length;
    }

    // 2. Clear out candidate table body
    elements.candidatesTableBody.innerHTML = '';

    if (state.candidates.length === 0) {
        elements.candidatesTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 40px; color: var(--text-black); font-weight: 500;">No Records Found</td></tr>';
        const pageInfo = document.getElementById('pagination-info');
        if (pageInfo) pageInfo.textContent = '0 to 0';
        return;
    }

    const startIndex = (state.candidatesPage - 1) * state.candidatesPerPage;
    const endIndex = Math.min(startIndex + state.candidatesPerPage, state.candidates.length);
    const paginatedCandidates = state.candidates.slice(startIndex, endIndex);

    const pageInfo = document.getElementById('pagination-info');
    if (pageInfo) {
        pageInfo.textContent = `${startIndex + 1} to ${endIndex}`;
    }

    const prevBtn = document.getElementById('pagination-prev');
    if (prevBtn) {
        if (state.candidatesPage === 1) prevBtn.classList.add('text-muted');
        else prevBtn.classList.remove('text-muted');
    }

    const nextBtn = document.getElementById('pagination-next');
    if (nextBtn) {
        if (endIndex >= state.candidates.length) nextBtn.classList.add('text-muted');
        else nextBtn.classList.remove('text-muted');
    }

    paginatedCandidates.forEach(c => {
        const tr = document.createElement('tr');
        tr.onclick = () => showCandidateDetail(c.id);

        const initial = c.name.charAt(0).toUpperCase();
        const colors = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'];
        const color = colors[c.name.charCodeAt(0) % colors.length] || '#0ea5e9';

        const ratingStar = c.rating > 0 ? `<i class="fas fa-star" style="color:#4b5563"></i>` : `<i class="far fa-star"></i>`;
        const ratingHtml = `<span class="rating-pill">-- ${ratingStar}</span>`;

        tr.innerHTML = `
            <td style="width:70px; padding:0; display:table-cell; text-align:center;" onclick="event.stopPropagation()">
                <div style="display:flex; align-items:center; justify-content:center; gap:10px;">
                    <span style="width:16px; flex-shrink:0; display:inline-block;"></span>
                    <input type="checkbox" style="margin:0; cursor:pointer; flex-shrink:0;">
                </div>
            </td>
            <td style="width:36px; text-align:center; padding:0;" onclick="event.stopPropagation()">
                <span title="Quick View" class="quick-view-btn" onclick="showQuickView(event, ${c.id})" style="display:inline-flex; align-items:center; justify-content:center; cursor:pointer; padding:4px; border-radius:4px;">
                    <i class="fas fa-binoculars" style="font-size:0.8rem; color:#9ca3af; pointer-events:none;"></i>
                </span>
            </td>
            <td>${ratingHtml}</td>
            <td><div style="display:flex; align-items:center;"><span class="avatar-cell" style="background-color:${color};">${initial}</span> <a href="#" class="td-link" style="color: #0ea5e9;" onclick="event.stopPropagation(); window.showCandidateDetail(${c.id}); return false;">${c.name.toUpperCase()}</a></div></td>
            <td>${c.city}</td>
            <td>${c.mobile} <i class="fas fa-phone-alt" style="color:#d1d5db; margin-left:5px; font-size:0.8em;"></i></td>
            <td>${c.stage}</td>
            <td>${c.modifiedTime}</td>
        `;
        elements.candidatesTableBody.appendChild(tr);
    });
}

// Map the function globally to allow inline event handler execution from template
window.showCandidateDetail = showCandidateDetail;

function renderDepartmentsTable() {
    elements.departmentsTableBody.innerHTML = '';
    state.departments.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><a href="#" class="td-link">${d.name}</a></td>
            <td>${d.lead}</td>
        `;
        elements.departmentsTableBody.appendChild(tr);
    });
}

function renderAssessmentsTable() {
    elements.assessmentsTableBody.innerHTML = '';
    state.assessments.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><a href="#" class="td-link">${a.name}</a></td>
            <td>${a.questions}</td>
            <td>${a.owner}</td>
            <td>${a.modifiedTime}</td>
        `;
        elements.assessmentsTableBody.appendChild(tr);
    });
}

function populateSelects() {
    const option = document.createElement('option');
    option.value = state.user.name;
    option.textContent = state.user.name;
    elements.ownerSelect.insertBefore(option, elements.ownerSelect.children[1] || null);
}

function initSearchableSelects() {
    document.querySelectorAll('select.searchable-select').forEach(select => {
        // Build Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';

        // Build Display
        const display = document.createElement('div');
        display.className = 'custom-select-display';
        display.innerHTML = `<span class="custom-select-value">${select.options[select.selectedIndex]?.text || 'None'}</span><i class="fas fa-caret-down"></i>`;

        // Build Dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'custom-select-dropdown';

        // Build Search Box
        const searchBox = document.createElement('div');
        searchBox.className = 'custom-select-search';
        searchBox.innerHTML = `<i class="fas fa-search" style="color:#9ca3af; font-size:0.85em;"></i><input type="text" placeholder="Search...">`;
        const searchInput = searchBox.querySelector('input');

        // Build Options UI List
        const optionsList = document.createElement('ul');
        optionsList.className = 'custom-select-options';

        // Build Custom Input (hidden by default)
        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.className = 'custom-select-custom-input';
        customInput.style.cssText = "width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-family: 'Inter', sans-serif; font-size: 0.9rem; margin-top: 5px;";
        customInput.placeholder = 'Enter custom value...';

        // Render Options
        const renderOptions = (filter = '') => {
            optionsList.innerHTML = '';
            Array.from(select.options).forEach((opt, index) => {
                if (opt.text.toLowerCase().includes(filter.toLowerCase())) {
                    const li = document.createElement('li');
                    li.textContent = opt.text;
                    if (index === select.selectedIndex) li.classList.add('selected');

                    li.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Update original select
                        select.selectedIndex = index;
                        // Trigger event
                        select.dispatchEvent(new Event('change'));
                        // Close dropdown
                        wrapper.classList.remove('open');
                    });
                    optionsList.appendChild(li);
                }
            });
        };
        renderOptions();

        dropdown.appendChild(searchBox);
        dropdown.appendChild(optionsList);

        wrapper.appendChild(display);
        wrapper.appendChild(dropdown);
        wrapper.appendChild(customInput);

        // Bind UI Events
        display.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            document.querySelectorAll('.custom-select-wrapper.open').forEach(w => w.classList.remove('open')); // Close others
            if (!isOpen) {
                wrapper.classList.add('open');
                searchInput.value = '';
                renderOptions();
                setTimeout(() => searchInput.focus(), 10);
            }
        });

        searchInput.addEventListener('click', (e) => e.stopPropagation());
        searchInput.addEventListener('input', (e) => renderOptions(e.target.value));

        select.addEventListener('change', () => {
            const selectedText = select.options[select.selectedIndex].text;
            display.querySelector('.custom-select-value').textContent = selectedText;

            if (selectedText === 'Custom') {
                customInput.classList.add('visible');
                customInput.focus();
            } else {
                customInput.classList.remove('visible');
                customInput.value = '';
                // Dynamic reset if mapped locally
                select.options[select.selectedIndex].value = selectedText;
            }
        });

        // Store custom string directly into original select value
        customInput.addEventListener('input', (e) => {
            if (select.options[select.selectedIndex].text === 'Custom') {
                select.options[select.selectedIndex].value = e.target.value.trim();
            }
        });

        // Hide UI wrapper when clicking outside
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                wrapper.classList.remove('open');
            }
        });

        // Inject Custom UI and hide native
        select.parentNode.insertBefore(wrapper, select.nextSibling);
    });
}

// --- Event Listeners and Dynamic Behaviours --- //

function setupEventListeners() {
    if (elements.btnToggleFilter && elements.candidatesFilterSidebar) {
        elements.btnToggleFilter.addEventListener('click', () => {
            elements.candidatesFilterSidebar.classList.toggle('collapsed');
        });
    }

    if (elements.btnAddCandidate) elements.btnAddCandidate.addEventListener('click', showCandidateCreate);
    if (elements.btnCancelCreate) elements.btnCancelCreate.addEventListener('click', showCandidatesList);
    if (elements.btnCancelCreate2) elements.btnCancelCreate2.addEventListener('click', showCandidatesList);
    if (elements.btnBackDetail) elements.btnBackDetail.addEventListener('click', showCandidatesList);

    if (elements.btnEditCandidateDetail) {
        elements.btnEditCandidateDetail.addEventListener('click', () => {
            if (state.currentCandidateId) {
                showCandidateEdit(state.currentCandidateId);
            }
        });
    }

    const prevBtn = document.getElementById('pagination-prev');
    const nextBtn = document.getElementById('pagination-next');
    const limitSelect = document.getElementById('pagination-limit');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (state.candidatesPage > 1) {
                state.candidatesPage--;
                renderCandidatesTable();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(state.candidates.length / state.candidatesPerPage);
            if (state.candidatesPage < totalPages) {
                state.candidatesPage++;
                renderCandidatesTable();
            }
        });
    }

    if (limitSelect) {
        limitSelect.addEventListener('change', (e) => {
            state.candidatesPerPage = parseInt(e.target.value);
            state.candidatesPage = 1;
            renderCandidatesTable();
        });
    }

    const printBtn = document.getElementById('btn-print-candidates');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    const exportBtn = document.getElementById('btn-export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                // Ensure we get the absolute latest data from backend if needed, or use state.allCandidates
                const response = await fetch('/api/candidates');
                const data = await response.json();

                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `zoho_candidates_export_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                if (typeof showToast === 'function') showToast("Data exported successfully!");
            } catch (err) {
                console.error("Export failed:", err);
                alert("Failed to export data. See console for details.");
            }
        });
    }

    if (elements.btnPrevCandidate) {
        elements.btnPrevCandidate.addEventListener('click', () => navigateCandidate(-1));
    }
    if (elements.btnNextCandidate) {
        elements.btnNextCandidate.addEventListener('click', () => navigateCandidate(1));
    }



    const globalSearch = document.getElementById('global-search-input');
    if (globalSearch) {
        globalSearch.addEventListener('input', () => {
            state.candidatesPage = 1; // Reset to page 1 on search
            applyFiltersToCandidates();
        });
    }

    // Save New Candidate Submission
    if (elements.btnSaveCandidate) {
        elements.btnSaveCandidate.addEventListener('click', (e) => {
            e.preventDefault();
            saveCandidate();
        });
    }

    // Inline edit functionality for Detail View (.row-value click)
    if (elements.candidatesDetailView) {
        elements.candidatesDetailView.addEventListener('click', (e) => {
            const rowValue = e.target.closest('.row-value');
            if (rowValue && !rowValue.querySelector('input') && !rowValue.classList.contains('readonly')) {
                const currentText = rowValue.textContent.trim();

                // Allow user to click to edit it
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'inline-edit-input';
                // Remove the dash placeholder if it enters edit
                input.value = currentText === '-' ? '' : currentText;

                rowValue.innerHTML = '';
                rowValue.appendChild(input);
                input.focus();

                const restoreVal = () => {
                    const newVal = input.value.trim();
                    rowValue.innerHTML = '';
                    rowValue.textContent = newVal === '' ? '-' : newVal;
                    if (newVal === '') {
                        rowValue.classList.add('text-muted-value');
                    } else {
                        rowValue.classList.remove('text-muted-value');
                    }
                    // Real app: trigger API to hit PATCH /api/candidates/:id
                };

                input.addEventListener('blur', restoreVal);
                input.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') input.blur();
                });
            }
        });
    }

    // Pincode Autofill Logic
    elements.pinCodeInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (state.pincodes[val]) {
            elements.cityInput.value = state.pincodes[val].city;
            elements.stateInput.value = state.pincodes[val].state;
            elements.countryInput.value = state.pincodes[val].country;
        } else if (val === '') {
            elements.cityInput.value = '';
            elements.stateInput.value = '';
            elements.countryInput.value = '';
        }
    });

    // Skill Tags Handling
    elements.skillInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const skill = e.target.value.trim();
            if (skill && !currentSkills.includes(skill)) {
                currentSkills.push(skill);
                renderSkills();
                e.target.value = '';
            }
        }
    });

    // Experience & Education Expandable Blocks
    elements.btnAddEducation.addEventListener('click', addEducationBlock);
    elements.btnAddExperience.addEventListener('click', addExperienceBlock);

    // Attachments Filter Dropdown Logic
    const attachmentsFilterMenu = document.getElementById('attachments-filter-menu');
    const attachmentsFilterBtn = document.getElementById('attachments-filter-btn');
    if (attachmentsFilterMenu && attachmentsFilterBtn) {
        attachmentsFilterMenu.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            e.preventDefault();

            // Update active styling
            attachmentsFilterMenu.querySelectorAll('a').forEach(a => {
                a.style.background = 'transparent';
                a.style.fontWeight = 'normal';
                a.style.color = '#4b5563';
            });
            link.style.background = '#e2e8f0';
            link.style.fontWeight = '500';
            link.style.color = 'var(--text-black)';

            // Update button text
            const selectedCategory = link.getAttribute('data-value');
            attachmentsFilterBtn.innerHTML = `${selectedCategory} <i class="fas fa-caret-down" style="margin-left:5px;"></i>`;

            // Filter rows
            const rows = document.querySelectorAll('.attachment-row-item');
            let visibleCount = 0;
            rows.forEach(row => {
                const rowCat = row.getAttribute('data-category');
                if (selectedCategory === 'All' || rowCat === selectedCategory) {
                    row.style.display = 'table-row';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            // Handle empty state
            let noRecordsRow = document.getElementById('attachments-no-records');
            if (visibleCount === 0 && rows.length > 0) {
                if (!noRecordsRow) {
                    const tbody = document.getElementById('detail-attachments-tbody');
                    noRecordsRow = document.createElement('tr');
                    noRecordsRow.id = 'attachments-no-records';
                    noRecordsRow.innerHTML = '<td colspan="8" style="padding: 20px; text-align: center; color: #6b7280;">No records found for ' + selectedCategory + '</td>';
                    tbody.appendChild(noRecordsRow);
                } else {
                    noRecordsRow.style.display = 'table-row';
                    noRecordsRow.innerHTML = '<td colspan="8" style="padding: 20px; text-align: center; color: #6b7280;">No records found for ' + selectedCategory + '</td>';
                }
            } else if (noRecordsRow) {
                noRecordsRow.style.display = 'none';
            }
        });
    }
}

// Skills Tag Component Logic
function renderSkills() {
    elements.tagsList.innerHTML = '';
    currentSkills.forEach((skill, index) => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.innerHTML = `${skill} <i class="fas fa-times remove-tag" onclick="removeSkill(${index})" title="Remove Skill"></i>`;
        elements.tagsList.appendChild(span);
    });
}

// Global removal function accessible from dynamic innerHTML
window.removeSkill = function (index) {
    currentSkills.splice(index, 1);
    renderSkills();
};

// Form Add/Remove Logic
function updateTimelineNumbers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const steps = container.querySelectorAll('.timeline-step');
    steps.forEach((step, index) => {
        step.textContent = index + 1;
    });
}

function addEducationBlock() {
    const months = `<option>Month</option><option>Jan</option><option>Feb</option><option>Mar</option><option>Apr</option><option>May</option><option>Jun</option><option>Jul</option><option>Aug</option><option>Sep</option><option>Oct</option><option>Nov</option><option>Dec</option>`;
    const years = `<option>Year</option><option>2026</option><option>2025</option><option>2024</option><option>2023</option><option>2022</option><option>2021</option><option>2020</option><option>2019</option><option>2018</option>`;

    const div = document.createElement('div');
    div.className = 'timeline-block';
    div.innerHTML = `
        <div class="timeline-left">
            <div class="timeline-step">1</div>
            <div class="timeline-line"></div>
            <div class="timeline-delete" onclick="this.closest('.timeline-block').remove(); updateTimelineNumbers('education-blocks');"><i class="fas fa-trash-alt"></i></div>
        </div>
        <div class="timeline-right">
            <div class="timeline-row">
                <div class="timeline-label">Institute / School</div>
                <div class="timeline-input"><input type="text"></div>
            </div>
            <div class="timeline-row">
                <div class="timeline-label">Major / Department</div>
                <div class="timeline-input"><input type="text"></div>
            </div>
            <div class="timeline-row">
                <div class="timeline-label">Degree</div>
                <div class="timeline-input"><input type="text"></div>
            </div>
            <div class="timeline-row">
                <div class="timeline-label">Duration</div>
                <div class="timeline-input">
                    <div class="duration-container">
                        <select>${months}</select>
                        <select>${years}</select>
                        <span class="duration-sep">To</span>
                        <select>${months}</select>
                        <select>${years}</select>
                    </div>
                </div>
            </div>
            <div class="timeline-row" style="align-items: center;">
                <div class="timeline-label">Currently pursuing</div>
                <div class="timeline-input"><input type="checkbox" style="width: auto; height: 16px;"></div>
            </div>
        </div>
    `;
    elements.educationBlocks.appendChild(div);
    updateTimelineNumbers('education-blocks');
}

function addExperienceBlock() {
    const months = `<option>Month</option><option>Jan</option><option>Feb</option><option>Mar</option><option>Apr</option><option>May</option><option>Jun</option><option>Jul</option><option>Aug</option><option>Sep</option><option>Oct</option><option>Nov</option><option>Dec</option>`;
    const years = `<option>Year</option><option>2026</option><option>2025</option><option>2024</option><option>2023</option><option>2022</option><option>2021</option><option>2020</option><option>2019</option><option>2018</option>`;

    const div = document.createElement('div');
    div.className = 'timeline-block';
    div.innerHTML = `
        <div class="timeline-left">
            <div class="timeline-step">1</div>
            <div class="timeline-line"></div>
            <div class="timeline-delete" onclick="this.closest('.timeline-block').remove(); updateTimelineNumbers('experience-blocks');"><i class="fas fa-trash-alt"></i></div>
        </div>
        <div class="timeline-right">
            <div class="timeline-row">
                <div class="timeline-label">Occupation / Title</div>
                <div class="timeline-input"><input type="text"></div>
            </div>
            <div class="timeline-row">
                <div class="timeline-label">Company</div>
                <div class="timeline-input"><input type="text"></div>
            </div>
            <div class="timeline-row">
                <div class="timeline-label">Summary</div>
                <div class="timeline-input"><textarea></textarea></div>
            </div>
            <div class="timeline-row">
                <div class="timeline-label">Work Duration</div>
                <div class="timeline-input">
                    <div class="duration-container">
                        <select>${months}</select>
                        <select>${years}</select>
                        <span class="duration-sep">To</span>
                        <select>${months}</select>
                        <select>${years}</select>
                    </div>
                </div>
            </div>
            <div class="timeline-row" style="align-items: center;">
                <div class="timeline-label">I currently work here</div>
                <div class="timeline-input"><input type="checkbox" style="width: auto; height: 16px;"></div>
            </div>
        </div>
    `;
    elements.experienceBlocks.appendChild(div);
    updateTimelineNumbers('experience-blocks');
}

// Save Candidate Data Processing
async function saveCandidate() {
    // Custom UI Validation Handling
    const requiredInputs = elements.formCreateCandidate.querySelectorAll(':required');
    requiredInputs.forEach(input => {
        if (!input.checkValidity()) {
            input.classList.add('validation-error');
        } else {
            input.classList.remove('validation-error');
        }
    });

    // Basic HTML5 validation trigger (to show bubbles)
    if (!elements.formCreateCandidate.checkValidity()) {
        elements.formCreateCandidate.reportValidity();
        return;
    }

    const formData = new FormData(elements.formCreateCandidate);

    // Education
    const education = [];
    const eduBlocks = elements.educationBlocks.querySelectorAll('.timeline-block');
    eduBlocks.forEach(block => {
        const inputs = block.querySelectorAll('input, select');
        const edu = {
            institute: inputs[0].value,
            major: inputs[1].value,
            degree: inputs[2].value,
            fromMonth: inputs[3].value,
            fromYear: inputs[4].value,
            toMonth: inputs[5].value,
            toYear: inputs[6].value,
            currentlyPursuing: inputs[7].checked
        };
        if (edu.institute || edu.degree) education.push(edu);
    });

    // Experience
    const experienceList = [];
    const expBlocks = elements.experienceBlocks.querySelectorAll('.timeline-block');
    expBlocks.forEach(block => {
        const inputs = block.querySelectorAll('input, select, textarea');
        const exp = {
            occupation: inputs[0].value,
            company: inputs[1].value,
            summary: inputs[2].value,
            fromMonth: inputs[3].value,
            fromYear: inputs[4].value,
            toMonth: inputs[5].value,
            toYear: inputs[6].value,
            currentlyWorking: inputs[7].checked
        };
        if (exp.occupation || exp.company) experienceList.push(exp);
    });

    // Prepare API Payload for Database
    const payload = {
        firstName: (formData.get('salutation') || '') + ' ' + (formData.get('firstName') || ''),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        mobile: formData.get('mobile'),
        phone: formData.get('phone'),
        secondaryEmail: formData.get('secondaryEmail'),
        address1: formData.get('address1'),
        address2: formData.get('address2'),
        pinCode: formData.get('pinCode'),
        city: formData.get('city'),
        state: formData.get('state'),
        country: formData.get('country'),
        experience: formData.get('experience') ? parseInt(formData.get('experience'), 10) : null,
        qualification: formData.get('qualification'),
        jobTitle: formData.get('jobTitle') === 'Custom' ? formData.get('jobTitle-custom') : (formData.get('jobTitle') || ''),
        employer: formData.get('employer'),
        expectedSalary: formData.get('expectedSalary'),
        currentSalary: formData.get('currentSalary'),
        skills: currentSkills,
        additionalInfo: formData.get('additionalInfo'),
        skypeId: formData.get('skypeId'),
        linkedin: formData.get('linkedin'),
        twitter: formData.get('twitter'),
        status: formData.get('status') === 'Custom' ? formData.get('status-custom') : (formData.get('status') || 'New'),
        source: formData.get('source') === 'Custom' ? formData.get('source-custom') : (formData.get('source') || 'Added by User'),
        owner: formData.get('owner') === 'Custom' ? formData.get('owner-custom') : (formData.get('owner') || state.user.name),
        emailOptOut: formData.get('emailOptOut') === 'on',
        education: education,
        experienceList: experienceList,
        modifiedBy: state.user.name,
        createdBy: state.isEditMode ? undefined : state.user.name,
        notes: state.isEditMode ? (state.candidates.find(c => c.id === state.currentCandidateId)?.notes || []) : [],
        attachments: (() => {
            const existing = state.isEditMode ? (state.candidates.find(c => c.id === state.currentCandidateId)?.attachments || []) : [];
            const temp = (window._tempAttachments && window._tempAttachments['_all']) ? window._tempAttachments['_all'] : [];
            // Merge them (favoring temp if same category/filename)
            const merged = [...existing];
            temp.forEach(t => {
                const idx = merged.findIndex(m => m.category === t.category && m.filename === t.filename);
                if (idx > -1) merged[idx] = t;
                else merged.push(t);
            });
            return merged;
        })()
    };

    try {
        const url = state.isEditMode ? `/api/candidates/${state.currentCandidateId}` : '/api/candidates';
        const response = await fetch(url, {
            method: state.isEditMode ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error (${response.status}): ${errorText}`);
        }

        const result = await response.json();

        if (result.message === "success") {
            const newId = result.data.id;

            // Reload the candidates to include the new one from DB
            await loadCandidates();

            // Clear temporary uploads so next creation is clean
            window._tempAttachments = {};

            // Display result logic
            if (state.isEditMode) {
                showCandidateDetail(newId);
                alert("Candidate updated successfully!");
            } else {
                showCandidatesList();
                alert("Candidate added successfully!");
            }
        } else {
            alert("Error saving: " + result.error);
        }
    } catch (error) {
        console.error("Error saving candidate", error);
        alert("Failed to save candidate: " + error.message);
    }
}

// ============================================================
// CHOOSE COLUMNS – TABULAR VIEW
// ============================================================

const CC = {
    // ALL available columns (not yet selected)
    allAvailable: [
        'Additional Info', 'Associated Tags', 'Candidate ID', 'Candidate Owner',
        'Candidate Status', 'Country', 'Created By', 'Created Time', 'Current Employer',
        'Current Job Title', 'Current Salary', 'Email', 'Email Opt Out',
        'Expected Salary', 'Experience in Years', 'Facebook', 'Fax', 'Fresh Candidate',
        'Highest Qualification Held', 'Last Activity Time', 'Last Emailed', 'LinkedIn',
        'Modified By', 'Number of Applications', 'Origin', 'Phone', 'Postal Code',
        'Province', 'Salutation', 'Secondary Email', 'Skill Set', 'Skype ID',
        'Source', 'Street', 'Twitter', 'Website'
    ],
    // Default selected columns (these map to the table headers)
    defaultSelected: [
        { label: 'First Name', key: 'firstName', required: false },
        { label: 'Last Name', key: 'lastName', required: true },
        { label: 'City', key: 'city', required: false },
        { label: 'Mobile', key: 'mobile', required: false },
        { label: 'Candidate Stage', key: 'stage', required: true },
        { label: 'Modified Time', key: 'modifiedTime', required: false },
    ],
    // Working copies during modal session
    available: [],
    selected: [],

    // Drag state
    dragSrc: null,
};

function ccInit() {
    // Deep-copy defaults for working state
    CC.selected = CC.defaultSelected.map(c => ({ ...c }));
    CC.available = CC.allAvailable.filter(
        a => !CC.selected.find(s => s.label === a)
    );
}

function ccOpen() {
    ccInit();
    ccRenderAvailable();
    ccRenderSelected();

    // Switch to full-page Choose Columns view
    navigate('choose-columns');
}

// Global functions for inline HTML onclick handlers
window.ccOpen = ccOpen;
window.ccRefresh = async function () {
    const icon = document.querySelector('#btn-refresh-candidates i');
    if (icon) {
        icon.classList.remove('spinning');
        void icon.offsetWidth;
        icon.classList.add('spinning');
        icon.addEventListener('animationend', () => icon.classList.remove('spinning'), { once: true });
    }
    await loadCandidates();
};

function ccClose() {
    // Return to the Candidates view
    navigate('candidates');
}

function ccRenderAvailable(filter = '') {
    const list = document.getElementById('cc-available-list');
    const count = document.getElementById('cc-available-count');
    const q = filter.toLowerCase();
    const items = CC.available.filter(a => a.toLowerCase().includes(q));

    list.innerHTML = '';
    items.forEach(label => {
        const li = document.createElement('li');
        li.className = 'cc-list-item';
        li.innerHTML = `
            <span>${label}</span>
            <button class="cc-add-btn" title="Add column"><i class="fas fa-plus"></i></button>
        `;
        li.querySelector('.cc-add-btn').addEventListener('click', () => {
            ccMoveToSelected(label);
        });
        list.appendChild(li);
    });
    count.textContent = CC.available.length;
}

function ccRenderSelected() {
    const list = document.getElementById('cc-selected-list');
    const count = document.getElementById('cc-selected-count');
    list.innerHTML = '';

    CC.selected.forEach((col, idx) => {
        const li = document.createElement('li');
        li.className = 'cc-list-item';
        li.draggable = !col.required;
        li.dataset.idx = idx;

        li.innerHTML = `
            <span class="cc-drag-handle" title="Drag to reorder"><i class="fas fa-grip-vertical"></i></span>
            <span style="flex:1;">${col.label}${col.required ? '<span class="cc-required-badge">required</span>' : ''}</span>
            ${col.required
                ? '<span style="width:22px;"></span>'
                : `<button class="cc-remove-btn" title="Remove"><i class="fas fa-times"></i></button>`
            }
        `;

        if (!col.required) {
            li.querySelector('.cc-remove-btn').addEventListener('click', () => {
                ccMoveToAvailable(idx);
            });
            // Drag-to-reorder
            li.addEventListener('dragstart', e => {
                CC.dragSrc = idx;
                li.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            li.addEventListener('dragend', () => {
                li.classList.remove('dragging');
                list.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            });
        }

        li.addEventListener('dragover', e => {
            e.preventDefault();
            list.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            if (CC.dragSrc !== null && CC.dragSrc !== idx) {
                li.classList.add('drag-over');
            }
        });
        li.addEventListener('drop', e => {
            e.preventDefault();
            if (CC.dragSrc !== null && CC.dragSrc !== idx) {
                const moved = CC.selected.splice(CC.dragSrc, 1)[0];
                CC.selected.splice(idx, 0, moved);
                CC.dragSrc = null;
                ccRenderSelected();
            }
        });

        list.appendChild(li);
    });
    count.textContent = CC.selected.length;
}

function ccMoveToSelected(label) {
    const idx = CC.available.indexOf(label);
    if (idx === -1) return;
    CC.available.splice(idx, 1);
    CC.selected.push({ label, key: label.toLowerCase().replace(/\s+/g, ''), required: false });
    const searchVal = document.getElementById('cc-search-input').value;
    ccRenderAvailable(searchVal);
    ccRenderSelected();
}

function ccMoveToAvailable(selectedIdx) {
    const col = CC.selected[selectedIdx];
    if (col.required) return; // Can't remove required
    CC.selected.splice(selectedIdx, 1);
    CC.available.push(col.label);
    CC.available.sort();
    const searchVal = document.getElementById('cc-search-input').value;
    ccRenderAvailable(searchVal);
    ccRenderSelected();
}

function ccSave() {
    // Apply selected columns to the table header
    const thead = document.getElementById('candidates-thead');
    if (!thead) return;

    const headerRow = document.getElementById('candidates-header-row');
    // Remove all resizable-th columns (keep first 3 fixed)
    const allThs = Array.from(headerRow.querySelectorAll('th'));
    const fixedThs = allThs.filter(th => th.classList.contains('col-fixed'));
    // Rebuild
    allThs.filter(th => !th.classList.contains('col-fixed')).forEach(th => th.remove());

    CC.selected.forEach(col => {
        const th = document.createElement('th');
        th.className = 'resizable-th';
        th.textContent = col.label.toUpperCase();
        const handle = document.createElement('span');
        handle.className = 'col-resize-handle';
        th.appendChild(handle);
        headerRow.appendChild(th);
    });

    // Re-attach hover listeners (since new elements)
    setupColResizeHoverEdit();

    // Store the new selected columns in CC default
    CC.defaultSelected = CC.selected.map(c => ({ ...c }));

    // Re-render table rows to match new columns
    renderCandidatesTable();

    ccClose();
}

// JS-based hover visibility removed in favor of pure CSS

function setupChooseColumnsListeners() {
    // Only keeping internal event listeners that aren't inline
    const overlay = document.getElementById('choose-columns-overlay');
    const btnClose = document.getElementById('cc-close-btn');
    const btnCancel = document.getElementById('cc-cancel-btn');
    const btnSave = document.getElementById('cc-save-btn');
    const searchIn = document.getElementById('cc-search-input');

    if (btnClose) btnClose.addEventListener('click', ccClose);
    if (btnCancel) btnCancel.addEventListener('click', ccClose);
    if (btnSave) btnSave.addEventListener('click', ccSave);

    // Close on overlay background click
    if (overlay) {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) ccClose();
        });
    }

    // Search filter in available list
    if (searchIn) {
        searchIn.addEventListener('input', e => ccRenderAvailable(e.target.value));
    }

    // Close on Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const page = document.getElementById('page-choose-columns');
            if (page && !page.classList.contains('hidden')) ccClose();
        }
    });

    // (Hover logic is now entirely handled by CSS #candidates-thead:hover .header-edit-btn)
}

// Start application
document.addEventListener('DOMContentLoaded', init);

// ============================================================
// INLINE ADD COLUMNS DROPDOWN
// ============================================================

window.toggleAddColumnsDropdown = function (e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('inline-add-columns');
    if (!dropdown) return;

    const isHidden = dropdown.classList.contains('hidden');

    if (isHidden) {
        // Position the fixed dropdown below the clicked icon
        const icon = e.currentTarget || e.target;
        const rect = icon.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + 6) + 'px';
        dropdown.style.left = rect.left + 'px';

        dropdown.classList.remove('hidden');
        renderInlineColumnsDropdown();
    } else {
        // Remove injected search wrap so it resets on next open
        const existingSearch = dropdown.querySelector('div[style*="align-items:center"]');
        if (existingSearch) existingSearch.remove();
        dropdown.classList.add('hidden');
    }
};

document.addEventListener('click', function (e) {
    const dropdown = document.getElementById('inline-add-columns');
    const icon = document.querySelector('.add-col-icon');
    if (dropdown && !dropdown.classList.contains('hidden')) {
        if (!dropdown.contains(e.target) && e.target !== icon) {
            // Remove injected search wrap so it resets on next open
            const existingSearch = dropdown.querySelector('div[style*="align-items:center"]');
            if (existingSearch) existingSearch.remove();
            dropdown.classList.add('hidden');
        }
    }
});

function renderInlineColumnsDropdown(filter = '') {
    const dropdown = document.getElementById('inline-add-columns');
    const list = document.getElementById('inline-columns-list');
    if (!list || !dropdown) return;

    // --- Inject search box once (between header and list) ---
    if (!document.getElementById('inline-col-search')) {
        const searchWrap = document.createElement('div');
        searchWrap.style.cssText = 'display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid #e5e7eb; background:#f9fafb;';

        const icon = document.createElement('i');
        icon.className = 'fas fa-search';
        icon.style.cssText = 'color:#9ca3af; font-size:0.8rem;';

        const input = document.createElement('input');
        input.id = 'inline-col-search';
        input.type = 'text';
        input.placeholder = 'Search columns...';
        input.autocomplete = 'off';
        input.style.cssText = 'border:none; outline:none; font-size:0.82rem; font-family:\'Inter\',sans-serif; color:#111827; background:transparent; flex:1;';

        input.addEventListener('input', (e) => {
            e.stopPropagation();
            renderInlineColumnsDropdown(e.target.value.trim());
        });
        input.addEventListener('click', (e) => e.stopPropagation());

        searchWrap.appendChild(icon);
        searchWrap.appendChild(input);

        // Insert between the header div and the ul list
        dropdown.insertBefore(searchWrap, list);

        // Focus the search input after short delay
        setTimeout(() => input.focus(), 50);
    }

    // --- Build column data ---
    const q = filter.toLowerCase();
    const selectedLabels = CC.defaultSelected.map(c => c.label);
    const allCols = [];

    CC.defaultSelected.forEach(c => {
        allCols.push({ label: c.label, required: c.required, selected: true });
    });
    CC.allAvailable.forEach(a => {
        if (!selectedLabels.includes(a)) {
            allCols.push({ label: a, required: false, selected: false });
        }
    });

    // Apply search filter
    const filtered = q ? allCols.filter(c => c.label.toLowerCase().includes(q)) : allCols;

    // --- Render list items ---
    list.innerHTML = '';

    if (filtered.length === 0) {
        const empty = document.createElement('li');
        empty.style.cssText = 'padding:12px; text-align:center; color:#9ca3af; font-size:0.8rem;';
        empty.textContent = 'No columns found';
        list.appendChild(empty);
        return;
    }

    filtered.forEach(col => {
        const li = document.createElement('li');
        li.style.cssText = 'padding:7px 12px; display:flex; align-items:center; gap:9px; font-size:0.82rem; color:#333; cursor:' + (col.required ? 'default' : 'pointer') + '; transition:background 0.15s;';

        if (!col.required) {
            li.onmouseover = () => li.style.backgroundColor = '#f0f7ff';
            li.onmouseout = () => li.style.backgroundColor = 'transparent';
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = col.selected;
        checkbox.style.margin = '0';
        checkbox.style.accentColor = '#CC3A3A';
        if (col.required) checkbox.disabled = true;
        li.appendChild(checkbox);

        const span = document.createElement('span');
        span.style.flex = '1';
        if (col.required) {
            span.innerHTML = col.label + ' <span style="color:#ef4444; margin-left:3px; font-weight:bold;">*</span>';
        } else {
            span.textContent = col.label;
        }
        li.appendChild(span);

        if (!col.required) {
            li.onclick = (e) => {
                if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
                toggleColumnInline(col.label, checkbox.checked);
            };
            checkbox.onclick = (e) => {
                e.stopPropagation();
                toggleColumnInline(col.label, checkbox.checked);
            };
        }

        list.appendChild(li);
    });
}

function toggleColumnInline(label, isChecked) {
    if (isChecked) {
        if (!CC.defaultSelected.find(c => c.label === label)) {
            CC.defaultSelected.push({ label, key: label.toLowerCase().replace(/\s+/g, ''), required: false });
        }
    } else {
        const idx = CC.defaultSelected.findIndex(c => c.label === label);
        if (idx > -1 && !CC.defaultSelected[idx].required) {
            CC.defaultSelected.splice(idx, 1);
        }
    }

    // Sync with global state
    CC.selected = CC.defaultSelected.map(c => ({ ...c }));
    CC.available = CC.allAvailable.filter(a => !CC.selected.find(s => s.label === a));

    ccSaveInline();
}

function ccSaveInline() {
    const thead = document.getElementById('candidates-thead');
    if (!thead) return;

    const headerRow = document.getElementById('candidates-header-row');
    const allThs = Array.from(headerRow.querySelectorAll('th'));
    // Remove dynamic headers, keep first 3 Fixed
    allThs.filter(th => !th.classList.contains('col-fixed')).forEach(th => th.remove());

    CC.defaultSelected.forEach(col => {
        const th = document.createElement('th');
        th.className = 'resizable-th';
        th.textContent = col.label.toUpperCase();
        const handle = document.createElement('span');
        handle.className = 'col-resize-handle';
        th.appendChild(handle);
        headerRow.appendChild(th);
    });

    if (typeof setupColResizeHoverEdit === 'function') {
        setupColResizeHoverEdit();
    }

    renderCandidatesTable();
}

let qvCurrentIndex = -1;

const AVATAR_COLORS_QV = ['#f97316', '#8b5cf6', '#0ea5e9', '#10b981', '#ef4444', '#f59e0b', '#6366f1', '#14b8a6'];
function getQVColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS_QV[Math.abs(hash) % AVATAR_COLORS_QV.length];
}

function populateQVPanel(c) {
    if (!c) return;
    const initial = c.name ? c.name.charAt(0).toUpperCase() : '?';
    const color = getQVColor(c.name || '');
    const nameParts = (c.name || '').trim().split(' ');
    const fname = nameParts[0] || '-';
    const lname = nameParts.slice(1).join(' ') || '-';

    document.getElementById('qv-avatar').textContent = initial;
    document.getElementById('qv-avatar').style.backgroundColor = color;
    document.getElementById('qv-name').textContent = c.name ? c.name.toUpperCase() : '-';
    document.getElementById('qv-stage-badge').textContent = c.stage || c.status || '-';
    document.getElementById('qv-mobile-val').textContent = c.mobile || '-';
    document.getElementById('qv-email-val').textContent = c.email || '-';

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '-'; };
    setVal('qf-id', 'ZR-' + c.id + '_CAND');
    setVal('qf-fname', fname);
    setVal('qf-lname', lname);
    setVal('qf-fullname', c.name || '-');
    const emailEl = document.getElementById('qf-email'); if (emailEl) emailEl.textContent = c.email || '-';
    setVal('qf-mobile', c.mobile || '-');
    setVal('qf-phone', c.phone || '-');
    setVal('qf-fax', c.fax || '-');
    setVal('qf-website', c.website || '-');
    setVal('qf-secondary-email', c.secondaryEmail || '-');
    setVal('qf-street', c.street || '-');
    setVal('qf-city', c.city || '-');
    setVal('qf-province', c.province || '-');
    setVal('qf-postal', c.postalCode || '-');
    setVal('qf-country', c.country || '-');
    setVal('qf-experience', c.experience || '-');
    setVal('qf-qualification', c.qualification || c.highestQualification || '-');
    setVal('qf-jobtitle', c.jobTitle || '-');
    setVal('qf-employer', c.employer || c.currentEmployer || '-');
    setVal('qf-expected-salary', c.expectedSalary || '-');
    setVal('qf-current-salary', c.currentSalary || '-');
    setVal('qf-skype', c.skypeId || '-');
    setVal('qf-additional-info', c.additionalInfo || '-');
    setVal('qf-status', c.stage || c.status || '-');
    setVal('qf-source', c.source || '-');
    setVal('qf-owner', c.owner || (state && state.user && state.user.name) || '-');
    setVal('qf-email-opt', c.emailOptOut ? 'Yes' : '-');

    // SKILLS TAB
    const skillsContent = document.getElementById('qv-skills-content');
    if (skillsContent) { const sk = c.skills || []; skillsContent.innerHTML = sk.length > 0 ? '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:16px 0;">' + sk.map(s => '<span style="background:#e0eaff;color:#1a6bbf;padding:4px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;">' + s + '</span>').join('') + '</div>' : '<div class="qv-empty-section" style="padding:40px 0;">No skills recorded</div>'; }

    // RESUME TAB
    let resumeObj = null;
    if (c.attachments && Array.isArray(c.attachments)) {
        // Find category containing 'resume' (like 'Zrecruit_Resume' or 'Resume')
        let found = c.attachments.find(a => a.category && a.category.toLowerCase().includes('resume'));

        // Fallback to pdf/docx
        if (!found) {
            found = c.attachments.find(a => a.filename && (a.filename.toLowerCase().endsWith('.pdf') || a.filename.toLowerCase().endsWith('.docx')));
        }
        // Final fallback to first attachment
        if (!found && c.attachments.length > 0) {
            found = c.attachments[0];
        }

        if (found) {
            let fileUrl = found.content;
            if (!fileUrl || fileUrl.trim() === '' || fileUrl.startsWith('/Attachments/')) {
                fileUrl = `/api/attachments/file/${encodeURIComponent(found.filename)}`;
            }
            resumeObj = { name: found.filename, url: fileUrl };
        }
    }
    if (!resumeObj) {
        const ext = window._candidateResumes || {};
        resumeObj = ext[c.id];
    }

    const re = document.getElementById('qv-resume-empty');
    const rv = document.getElementById('qv-resume-viewer');
    const ri = document.getElementById('qv-resume-iframe');
    const rf = document.getElementById('qv-resume-filename');

    if (resumeObj && rv && re) {
        re.style.display = 'none';
        rv.style.display = 'flex';
        if (rf) rf.textContent = resumeObj.name || 'Resume';
        if (ri) ri.src = resumeObj.url;
    } else if (rv && re) {
        re.style.display = 'block';
        rv.style.display = 'none';
        if (ri) ri.src = '';
    }

    // NOTES TAB
    const nl = document.getElementById('qv-notes-list');
    if (nl) { const notes = c.notes || []; nl.innerHTML = notes.length > 0 ? notes.map(n => '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f0f4ff;"><div style="width:34px;height:34px;border-radius:50%;background:#1a6bbf;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;">' + ((n.author || 'U')[0].toUpperCase()) + '</div><div><div style="font-size:0.85rem;"><strong>' + (n.author || 'User') + '</strong> - <strong>' + (n.title || 'Note') + '</strong></div><div style="font-size:0.83rem;color:#374151;margin-top:4px;">' + (n.body || '') + '</div><div style="font-size:0.75rem;color:#9ca3af;margin-top:4px;">' + (n.date || '') + '</div></div></div>').join('') : '<div class="qv-empty-section">No notes added</div>'; }

    // TIMELINE TAB
    const tl = document.getElementById('qv-timeline-list');
    if (tl) { const evs = [{ icon: 'fa-user-plus', text: 'Candidate <strong>' + (c.name || '') + '</strong> created', date: c.createdTime || '' }, ...(c.timeline || [])]; tl.innerHTML = evs.map(ev => '<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f0f4ff;font-size:0.85rem;"><div style="width:30px;height:30px;border-radius:50%;background:#e0eaff;color:#1a6bbf;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.78rem;"><i class="fas ' + (ev.icon || 'fa-circle') + '\"></i></div><div><div>' + (ev.text || ev.description || '') + '</div><div style="font-size:0.75rem;color:#9ca3af;margin-top:4px;">' + (ev.date || '') + '</div></div></div>').join(''); }

    // ATTACHMENTS TAB
    const al = document.getElementById('qv-attachments-list');
    if (al) { const dynA = (window._candidateAttachments || {})[c.id] || []; const allA = [...(c.attachments || []), ...dynA]; al.innerHTML = allA.length > 0 ? allA.map(a => '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0f4ff;"><i class="fas fa-paperclip" style="color:#1a6bbf;"></i><span style="font-size:0.85rem;color:#374151;">' + (a.name || a) + '</span><span style="margin-left:auto;font-size:0.75rem;color:#9ca3af;">' + (a.type || '') + '</span></div>').join('') : '<div class="qv-empty-section" style="padding:40px 0;">No attachments found</div>'; }

    switchQVTab('details', document.querySelector('.qv-tab[data-tab="details"]'));
}
window.showQuickView = function (event, candidateId) {
    event.stopPropagation();
    const idx = state.candidates.findIndex(x => x.id === candidateId);
    if (idx === -1) return;
    qvCurrentIndex = idx;
    populateQVPanel(state.candidates[idx]);

    document.getElementById('quick-view-panel').classList.add('open');
    document.getElementById('qv-backdrop').classList.add('open');
};

window.closeQuickView = function () {
    document.getElementById('quick-view-panel').classList.remove('open');
    document.getElementById('qv-backdrop').classList.remove('open');
};

window.navigateQuickView = function (dir) {
    const newIdx = qvCurrentIndex + dir;
    if (newIdx < 0 || newIdx >= state.candidates.length) return;
    qvCurrentIndex = newIdx;
    populateQVPanel(state.candidates[qvCurrentIndex]);
};

window.switchQVTab = function (tabName, btn) {
    document.querySelectorAll('.qv-tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.qv-tab').forEach(t => t.classList.remove('active'));
    const pane = document.getElementById('qv-tab-' + tabName);
    if (pane) pane.classList.add('active');
    if (btn) btn.classList.add('active');
};

// ===== ATTACHMENT BROWSE DROPDOWN (click toggle) =====
document.addEventListener('click', function (e) {
    // Toggle dropdown on caret click
    if (e.target.closest('.btn-attach-caret')) {
        e.preventDefault();
        e.stopPropagation();
        const caret = e.target.closest('.btn-attach-caret');
        const dropdown = caret.closest('.dropdown');
        const menu = dropdown ? dropdown.querySelector('.dropdown-menu') : null;
        if (!menu) return;
        const isOpen = menu.style.display === 'block';
        // Close all other attachment dropdowns first
        document.querySelectorAll('.attachment-input-group .dropdown-menu').forEach(m => m.style.display = 'none');
        menu.style.display = isOpen ? 'none' : 'block';
        return;
    }
    // Close all attachment dropdowns on outside click
    if (!e.target.closest('.attachment-input-group')) {
        document.querySelectorAll('.attachment-input-group .dropdown-menu').forEach(m => m.style.display = 'none');
    }
});

// ===== BROWSE BUTTON ? opens file explorer =====
window._tempAttachments = {};
window._candidateResumes = window._candidateResumes || {};
window._candidateAttachments = window._candidateAttachments || {};

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-attach-browse')) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';
        input.onchange = function () {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const row = e.target.closest('.attachment-row');
                const display = row ? row.querySelector('.attachment-file-display') : null;
                if (display) display.textContent = file.name;
                // Determine attachment type
                const labelEl = row ? row.querySelector('.attachment-label') : null;
                const atype = labelEl ? labelEl.textContent.trim() : 'Other';

                // Use FileReader to get DataURL for persistent storage
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    const dataUrl = readerEvent.target.result;
                    const newAtt = {
                        filename: file.name,
                        attachedBy: state.user.name,
                        date: new Date().toLocaleDateString('en-GB'),
                        size: (file.size / 1024).toFixed(2) + ' KB',
                        category: atype,
                        content: dataUrl
                    };

                    // Store in temp (before candidate is saved)
                    if (!window._tempAttachments['_all']) window._tempAttachments['_all'] = [];
                    // Update if category already exists, or just push
                    window._tempAttachments['_all'] = window._tempAttachments['_all'].filter(a => a.category !== atype);
                    window._tempAttachments['_all'].push(newAtt);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }
});

// ===== CANDIDATE OWNER: Populate with logged-in user =====
(function populateOwnerDropdown() {
    const sel = document.getElementById('owner-select');
    if (!sel) return;
    // Get user name from state
    const userName = (state && state.user && state.user.name) ? state.user.name : (localStorage.getItem('recruitUserName') || 'Recruiter');
    const userEmail = localStorage.getItem('recruitUserEmail') || '';
    const label = userEmail ? `${userName} (${userEmail})` : userName;
    // Remove any previous dynamic option
    const existing = sel.querySelector('.owner-dynamic');
    if (existing) existing.remove();
    // Insert logged-in user as second option (after None)
    const opt = document.createElement('option');
    opt.value = userName;
    opt.textContent = label;
    opt.className = 'owner-dynamic';
    sel.insertBefore(opt, sel.options[1]);
    // Auto-select this user by default
    sel.value = userName;
})();
window.qvResumePrint = function () {
    const iframe = document.getElementById('qv-resume-iframe');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.print();
    } else {
        alert("Resume not fully loaded or cross-origin restrictions apply.");
    }
};

window.qvResumeDownload = function () {
    const iframe = document.getElementById('qv-resume-iframe');
    if (iframe && iframe.src) {
        const link = document.createElement('a');
        link.href = iframe.src;
        link.download = document.getElementById('qv-resume-filename').textContent || 'Resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

window.qvResumeFullPage = function () {
    const viewer = document.getElementById('qv-resume-viewer');
    if (viewer) {
        if (!document.fullscreenElement) {
            viewer.requestFullscreen().catch(err => {
                alert(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
};

window.qvResumeHalfPage = function () {
    // This assumes we have a dual-pane setup or similar. 
    // For a side panel, toggling width is a decent simulation of "Half Page" vs "Standard View"
    const panel = document.getElementById('quick-view-panel');
    if (panel.style.width === '85%') {
        panel.style.width = '700px'; // Revert to original width (adjust if original is different)
    } else {
        panel.style.width = '85%';
    }
};

// Universal Inline Auto-Save Logic
document.addEventListener('change', function (e) {
    if (e.target.classList.contains('inline-edit-input')) {
        const input = e.target;
        const parentEl = input.parentElement;
        const parentId = parentEl ? (parentEl.id || '') : '';

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

                // Immediately refresh view
                showCandidateDetail(state.currentCandidateId);
                // Also update the list view in case name/mobile changed
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
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

// --- Attachments Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const docBtn = document.getElementById('attach-doc-btn');
    const uploadBtn = document.getElementById('attach-upload-btn');
    const linkBtn = document.getElementById('attach-link-btn');
    const hiddenFileInput = document.getElementById('hidden-file-upload');
    const modalBackdrop = document.getElementById('attach-link-modal-backdrop');
    const cancelBtn = document.getElementById('attach-link-cancel');
    const submitBtn = document.getElementById('attach-link-submit');
    const urlInput = document.getElementById('attach-link-url');
    const categorySelect = document.getElementById('attach-link-category');

    function triggerFileUpload(e) {
        if (e) e.preventDefault();
        if (hiddenFileInput) hiddenFileInput.click();
    }

    if (docBtn) docBtn.addEventListener('click', triggerFileUpload);
    if (uploadBtn) uploadBtn.addEventListener('click', triggerFileUpload);

    let pendingFile = null;
    const fileModal = document.getElementById('upload-file-modal-backdrop');
    const fileNameDisplay = document.getElementById('upload-file-name');
    const fileCategorySelect = document.getElementById('upload-file-category');
    const fileCancelBtn = document.getElementById('upload-file-cancel');
    const fileSubmitBtn = document.getElementById('upload-file-submit');

    if (hiddenFileInput) {
        hiddenFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                pendingFile = e.target.files[0];
                if (fileNameDisplay) fileNameDisplay.textContent = `File: ${pendingFile.name}`;
                if (fileModal) fileModal.style.display = 'flex';
                hiddenFileInput.value = ''; // Reset for next use
            }
        });
    }

    if (fileCancelBtn) {
        fileCancelBtn.addEventListener('click', () => {
            if (fileModal) fileModal.style.display = 'none';
            pendingFile = null;
        });
    }

    if (fileSubmitBtn) {
        fileSubmitBtn.addEventListener('click', async () => {
            if (!pendingFile) return;

            try {
                // 1. Upload file to Database
                const formData = new FormData();
                formData.append('file', pendingFile);
                formData.append('filename', pendingFile.name);

                const uploadRes = await fetch('/api/attachments/upload', {
                    method: 'POST',
                    body: formData
                });
                const uploadResult = await uploadRes.json();

                if (uploadResult.message !== 'success') throw new Error(uploadResult.error);

                // 2. Add metadata to candidate
                const newAtt = {
                    filename: pendingFile.name,
                    attachedBy: state.user.name,
                    date: new Date().toLocaleDateString('en-GB'),
                    size: (pendingFile.size / 1024).toFixed(2) + ' KB',
                    category: fileCategorySelect.value,
                    content: '' // No need to store content in candidate JSON, it's in DB
                };

                const candidate = state.candidates.find(c => c.id === state.currentCandidateId);
                if (candidate) {
                    if (!candidate.attachments) candidate.attachments = [];
                    candidate.attachments.unshift(newAtt);

                    // 3. Save candidate state to server
                    await updateCandidateOnServer(candidate);

                    showCandidateDetail(state.currentCandidateId);
                    if (fileModal) fileModal.style.display = 'none';
                    pendingFile = null;
                    if (typeof showToast === 'function') showToast('Attachment saved to Database successfully!');
                }
            } catch (err) {
                console.error("Upload failed:", err);
                alert("Failed to upload file to database: " + err.message);
            }
        });
    }

    function dataURLtoBlob(dataurl) {
        const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        let i = n;
        while (i--) { u8arr[i] = bstr.charCodeAt(i); }
        return new Blob([u8arr], { type: mime });
    }


    if (linkBtn) {
        linkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (modalBackdrop) {
                modalBackdrop.style.display = 'flex';
                urlInput.value = '';
                categorySelect.value = 'Cover Letter'; // default
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (modalBackdrop) modalBackdrop.style.display = 'none';
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (!urlInput.value.trim()) {
                alert('Please enter a URL');
                return;
            }
            const newAtt = {
                filename: urlInput.value.trim(),
                attachedBy: 'You',
                date: new Date().toLocaleDateString('en-GB'),
                size: '-',
                category: categorySelect.value
            };
            addAttachmentToCandidate(newAtt);
            if (modalBackdrop) modalBackdrop.style.display = 'none';
        });
    }

    function addAttachmentToCandidate(att) {
        if (!state.currentCandidateId) return;
        const candidate = state.candidates.find(c => c.id === state.currentCandidateId);
        if (candidate) {
            if (!candidate.attachments) candidate.attachments = [];
            candidate.attachments.unshift(att);
            showCandidateDetail(state.currentCandidateId);
            if (typeof showToast === 'function') showToast('Attachment added successfully!');
        }
    }

    // --- Selection Toolbar Logic ---
    const selectionToolbar = document.getElementById('attachments-selection-toolbar');
    const selectionCountText = document.getElementById('selection-count-text');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const downloadBtn = document.getElementById('download-selected-btn');
    const deleteBtn = document.getElementById('delete-selected-btn');

    function updateSelectionToolbar() {
        const attsTbody = document.getElementById('detail-attachments-tbody');
        if (!attsTbody || !selectionToolbar) return;
        const selectedCheckboxes = attsTbody.querySelectorAll('input[type="checkbox"]:checked');
        const count = selectedCheckboxes.length;

        if (count > 0) {
            selectionToolbar.style.display = 'flex';
            selectionCountText.textContent = `${count} Attachments selected`;
        } else {
            selectionToolbar.style.display = 'none';
        }
    }

    // Use event delegation for checkboxes in the dynamically rendered table
    document.addEventListener('change', (e) => {
        if (e.target.closest('#detail-attachments-tbody') && e.target.type === 'checkbox') {
            updateSelectionToolbar();
        }

        // Header "Select All" checkbox
        if (e.target.closest('thead') && e.target.type === 'checkbox' && e.target.closest('.zoho-card-body')) {
            const tbody = e.target.closest('table').querySelector('tbody');
            const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                // Only toggle visible rows (for filtering support)
                if (cb.closest('tr').style.display !== 'none') {
                    cb.checked = e.target.checked;
                }
            });
            updateSelectionToolbar();
        }
    });

    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const attsTbody = document.getElementById('detail-attachments-tbody');
            if (attsTbody) {
                const checkboxes = attsTbody.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(cb => cb.checked = false);

                // Also uncheck the header checkbox
                const headerCheckbox = document.querySelector('thead input[type="checkbox"]');
                if (headerCheckbox) headerCheckbox.checked = false;

                updateSelectionToolbar();
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const attsTbody = document.getElementById('detail-attachments-tbody');
            if (!attsTbody) return;
            const selectedCheckboxes = attsTbody.querySelectorAll('input[type="checkbox"]:checked');

            if (selectedCheckboxes.length === 0) return;

            if (typeof showToast === 'function') showToast(`Downloading ${selectedCheckboxes.length} file(s)...`);

            selectedCheckboxes.forEach((cb, index) => {
                const row = cb.closest('tr');
                const filenameCell = row.querySelector('td:nth-child(2)');
                let filename = filenameCell ? filenameCell.textContent.trim() : `attachment_${index + 1}.pdf`;

                // Use the DB endpoint for downloading
                const fileUrl = `/api/attachments/file/${encodeURIComponent(filename)}`;

                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = fileUrl;
                a.download = filename;
                document.body.appendChild(a);

                setTimeout(() => {
                    a.click();
                    document.body.removeChild(a);
                }, index * 300);
            });
        });
    }

    // --- Attachment Quick View Logic ---
    document.addEventListener('click', (e) => {
        const fileLink = e.target.closest('.attachment-filename');
        if (fileLink) {
            e.preventDefault();
            const filename = fileLink.textContent.trim();
            const fileUrl = `/api/attachments/file/${encodeURIComponent(filename)}`;
            window.open(fileUrl, '_blank');
        }
    });

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const attsTbody = document.getElementById('detail-attachments-tbody');
            if (!attsTbody) return;
            const selectedCheckboxes = attsTbody.querySelectorAll('input[type="checkbox"]:checked');

            if (selectedCheckboxes.length > 0 && confirm(`Are you sure you want to delete ${selectedCheckboxes.length} attachment(s)?`)) {
                const candidate = state.candidates.find(c => c.id === state.currentCandidateId);
                if (candidate && candidate.attachments) {
                    const filenamesToDelete = Array.from(selectedCheckboxes).map(cb => {
                        const row = cb.closest('tr');
                        const filenameCell = row.querySelector('.attachment-filename');
                        return filenameCell ? filenameCell.textContent.trim() : null;
                    }).filter(Boolean);

                    // Remove from state
                    candidate.attachments = candidate.attachments.filter(att => !filenamesToDelete.includes(att.filename));

                    // Re-render the details view
                    showCandidateDetail(state.currentCandidateId);

                    if (typeof showToast === 'function') showToast(`${selectedCheckboxes.length} attachment(s) deleted successfully!`);

                    // Hide the selection toolbar
                    if (selectionToolbar) selectionToolbar.style.display = 'none';
                }
            }
        });
    }
});

// ===== NOTES LOGIC =====
function setupNotesListeners() {
    const collapsedView = document.getElementById('note-collapsed-view');
    const expandedView = document.getElementById('note-expanded-view');
    const btnCancel = document.getElementById('btn-cancel-note');
    const btnSave = document.getElementById('btn-save-note');
    const btnSort = document.getElementById('btn-note-sort');
    const sortMenu = document.getElementById('note-sort-menu');
    const btnAttach = document.getElementById('btn-note-attach');
    const fileInput = document.getElementById('note-file-input');

    // Custom Title Toggling
    const titleSelect = document.getElementById('new-note-title');
    const titleSelectWrapper = document.getElementById('note-title-select-wrapper');
    const titleCustomWrapper = document.getElementById('note-title-custom-wrapper');
    const customTitleInput = document.getElementById('new-note-title-custom');
    const btnCloseCustomTitle = document.getElementById('btn-close-custom-note-title');

    if (titleSelect) {
        titleSelect.onchange = () => {
            if (titleSelect.value === 'Custom') {
                titleSelectWrapper.style.display = 'none';
                titleCustomWrapper.style.display = 'flex';
                customTitleInput.focus();
            }
        };
    }

    if (btnCloseCustomTitle) {
        btnCloseCustomTitle.onclick = () => {
            titleCustomWrapper.style.display = 'none';
            titleSelectWrapper.style.display = 'block';
            titleSelect.value = 'Call';
            customTitleInput.value = '';
        };
    }

    // Attachment State
    if (!window._noteAttachments) window._noteAttachments = [];

    if (fileInput) {
        fileInput.onchange = (e) => {
            console.log("File input changed, files selected:", e.target.files.length);
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (rev) => {
                    console.log("File read successfully:", file.name);
                    window._noteAttachments.push({
                        filename: file.name,
                        content: rev.target.result,
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        timestamp: new Date().toISOString()
                    });
                    renderNoteAttachmentPreviews();
                };
                reader.onerror = (err) => console.error("FileReader error:", err);
                reader.readAsDataURL(file);
            });
            // Reset input so same file can be re-selected if needed
            fileInput.value = '';
        };
    }

    function renderNoteAttachmentPreviews() {
        const previewContainer = document.getElementById('note-attachment-previews');
        if (!previewContainer) return;
        previewContainer.innerHTML = window._noteAttachments.map((att, idx) => `
            <div style="display: flex; align-items: center; gap: 8px; background: #f9fafb; padding: 4px 10px; border-radius: 4px; border: 1px solid #e5e7eb; font-size: 0.85rem; color: #374151;">
                <i class="far fa-file-alt" style="color: #6b7280; font-size: 0.9rem;"></i>
                <span style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; text-decoration: underline;" onclick="previewNoteAttachment(null, ${idx}, true)">${att.filename}</span>
                <i class="fas fa-times" style="color: #9ca3af; cursor: pointer; margin-left: 5px; font-size: 0.8rem;" onclick="removeNoteAttachment(${idx})"></i>
            </div>
        `).join('');
    }

    window.previewNoteAttachment = (noteId, attIdx, isNew = false) => {
        let att;
        if (isNew) {
            att = window._noteAttachments[attIdx];
        } else {
            const candidate = state.candidates.find(c => c.id === state.currentCandidateId);
            if (!candidate || !candidate.notes) return;
            const note = candidate.notes.find(n => n.id === noteId);
            if (!note || !note.attachments) return;
            att = note.attachments[attIdx];
        }

        if (att && att.content) {
            const newTab = window.open();
            if (newTab) {
                newTab.document.title = att.filename;
                if (att.content.startsWith('data:')) {
                    fetch(att.content)
                        .then(res => res.blob())
                        .then(blob => {
                            const blobUrl = URL.createObjectURL(blob);
                            newTab.location.href = blobUrl;
                        })
                        .catch(err => {
                            console.error('Error opening note attachment:', err);
                            if (att.content.includes('pdf')) {
                                newTab.document.body.innerHTML = `<embed src="${att.content}" width="100%" height="100%">`;
                            } else {
                                newTab.document.body.innerHTML = `<img src="${att.content}" style="max-width: 100%;">`;
                            }
                        });
                } else {
                    newTab.location.href = att.content;
                }
            } else {
                alert("Please allow popups to preview the file.");
            }
        }
    };

    window.removeNoteAttachment = (idx) => {
        window._noteAttachments.splice(idx, 1);
        renderNoteAttachmentPreviews();
    };

    if (collapsedView && expandedView) {
        collapsedView.onclick = () => {
            collapsedView.style.display = 'none';
            expandedView.style.display = 'block';
            const textarea = document.getElementById('new-note-content');
            if (textarea) textarea.focus();
        };
    }

    if (btnAttach && fileInput) {
        btnAttach.onclick = (e) => {
            fileInput.click();
        };
    }

    if (btnCancel) {
        btnCancel.onclick = () => {
            expandedView.style.display = 'none';
            collapsedView.style.display = 'block';
            const textarea = document.getElementById('new-note-content');
            if (textarea) textarea.value = '';
            // Reset title
            titleCustomWrapper.style.display = 'none';
            titleSelectWrapper.style.display = 'block';
            titleSelect.value = 'Call';
            customTitleInput.value = '';
            // Reset attachments
            window._noteAttachments = [];
            renderNoteAttachmentPreviews();
        };
    }

    if (btnSave) {
        btnSave.onclick = async () => {
            console.log("Save Note clicked");
            let title = titleSelect.value;
            if (title === 'Custom') {
                title = customTitleInput.value.trim() || 'Others';
            }

            const content = document.getElementById('new-note-content').value;
            if (!content.trim()) return alert("Please enter note content.");

            const candidate = state.candidates.find(c => c.id === state.currentCandidateId);
            if (!candidate) {
                console.error("Candidate not found for ID:", state.currentCandidateId);
                return;
            }

            const newNote = {
                id: Date.now(),
                title: title,
                content: content,
                author: state.user.name,
                authorInitials: state.user.initials,
                timestamp: new Date().toISOString(),
                timespan: new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
                attachments: [...window._noteAttachments]
            };

            if (!candidate.notes) candidate.notes = [];
            candidate.notes.unshift(newNote);

            console.log("Saving note to server...", newNote);

            // Save to server
            try {
                const result = await updateCandidateOnServer(candidate);
                console.log("Note saved successfully:", result);

                // Re-render
                showCandidateDetail(candidate.id);

                // Reset form
                expandedView.style.display = 'none';
                collapsedView.style.display = 'block';
                document.getElementById('new-note-content').value = '';
                // Reset title
                titleCustomWrapper.style.display = 'none';
                titleSelectWrapper.style.display = 'block';
                titleSelect.value = 'Call';
                customTitleInput.value = '';
                // Reset attachments
                window._noteAttachments = [];
                renderNoteAttachmentPreviews();

                if (typeof showToast === 'function') showToast("Note added successfully!");
            } catch (err) {
                console.error("Failed to save note:", err);
                alert("Failed to save note: " + err.message);
                // Remove the locally added note if save failed
                candidate.notes.shift();
            }
        };
    }


    if (btnSort && sortMenu) {
        btnSort.onclick = (e) => {
            e.stopPropagation();
            sortMenu.style.display = sortMenu.style.display === 'block' ? 'none' : 'block';
        };

        sortMenu.querySelectorAll('li').forEach(li => {
            li.onclick = () => {
                const sort = li.getAttribute('data-sort');
                state.noteSortOrder = sort;
                document.getElementById('note-sort-label').textContent = li.textContent;
                sortMenu.style.display = 'none';
                showCandidateDetail(state.currentCandidateId);
            };
        });
    }

    // Close sort menu on outside click
    document.addEventListener('click', () => {
        if (sortMenu) sortMenu.style.display = 'none';
    });
}

async function updateCandidateOnServer(candidate) {
    const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate)
    });
    const result = await response.json();
    if (result.message !== 'success') throw new Error(result.error);
    return result.data;
}

window.deleteNote = async function (noteId) {
    if (!confirm("Are you sure you want to delete this note?")) return;
    const candidate = state.candidates.find(c => c.id === state.currentCandidateId);
    if (!candidate || !candidate.notes) return;

    candidate.notes = candidate.notes.filter(n => String(n.id) !== String(noteId));
    try {
        await updateCandidateOnServer(candidate);
        showCandidateDetail(candidate.id);
    } catch (err) {
        alert("Failed to delete note: " + err.message);
    }
};

window.editNote = function (noteId) {
    const candidate = state.candidates.find(c => c.id === state.currentCandidateId);
    if (!candidate || !candidate.notes) return;
    const note = candidate.notes.find(n => String(n.id) === String(noteId));
    if (!note) return;

    // Find the note container in the DOM
    const notesContainer = document.getElementById('detail-notes-container');
    const noteItems = notesContainer.querySelectorAll('.note-item');
    let targetItem = null;

    targetItem = Array.from(noteItems).find(item => item.getAttribute('data-note-id') == noteId);
    if (!targetItem) {
        return;
    }

    const originalHTML = targetItem.innerHTML;
    targetItem.setAttribute('data-original-html', originalHTML);

    targetItem.innerHTML = `
        <div style="width: 38px; height: 38px; border-radius: 50%; background: #3b82f6; color: #fff; display:flex; justify-content:center; align-items:center; font-weight:600; font-size:1rem; flex-shrink:0;">${note.authorInitials || 'U'}</div>
        <div style="flex-grow: 1; border: 1px solid #d1d5db; border-radius: 4px; padding: 15px; background: #fff;">
            <textarea id="edit-note-content-${noteId}" style="width: 100%; border: none; outline: none; font-size: 0.95rem; color: #111827; resize: none; min-height: 80px;">${note.content}</textarea>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 1px solid #f3f4f6; padding-top: 12px;">
                <div onclick="document.getElementById('note-file-input').click()" style="display: flex; align-items: center; gap: 15px; color: #2563eb; font-size: 0.85rem; font-weight: 500; cursor: pointer;">
                    <i class="fas fa-paperclip"></i> Attach Files
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="cancelEditNote(${noteId})" class="btn-outline" style="padding: 6px 15px; font-size: 0.9rem; color: #374151; border: 1px solid #d1d5db; background: #fff; border-radius: 4px; cursor: pointer;">Cancel</button>
                    <button onclick="saveEditNote(${noteId})" class="btn-primary" style="padding: 6px 20px; font-size: 0.9rem; background: #2563eb; color: #fff; border: none; border-radius: 4px; font-weight: 500; cursor: pointer;">Save</button>
                </div>
            </div>
        </div>
    `;
    const textarea = targetItem.querySelector('textarea');
    textarea.focus();
    // Move cursor to end
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
};

window.cancelEditNote = function (noteId) {
    const notesContainer = document.getElementById('detail-notes-container');
    const targetItem = Array.from(notesContainer.querySelectorAll('.note-item')).find(item => item.getAttribute('data-note-id') == noteId);
    if (targetItem && targetItem.getAttribute('data-original-html')) {
        targetItem.innerHTML = targetItem.getAttribute('data-original-html');
    }
};

window.saveEditNote = async function (noteId) {
    const textarea = document.getElementById(`edit-note-content-${noteId}`);
    if (!textarea) return;

    const newContent = textarea.value.trim();
    if (!newContent) return alert("Please enter note content.");

    const candidate = state.candidates.find(c => c.id === state.currentCandidateId);
    if (!candidate || !candidate.notes) return;
    const note = candidate.notes.find(n => String(n.id) === String(noteId));
    if (!note) return;

    note.content = newContent;

    try {
        await updateCandidateOnServer(candidate);
        showCandidateDetail(candidate.id);
    } catch (err) {
        alert("Failed to update note: " + err.message);
    }
};

// ===== INTERVIEW LOGIC =====
function setupInterviewListeners() {
    const btnAdd = document.getElementById('btn-add-interview');
    const modal = document.getElementById('modal-create-interview-type');
    const btnClose = document.getElementById('btn-close-interview-modal');
    const btnFilter = document.getElementById('btn-interview-filter');
    const filterMenu = document.getElementById('interview-filter-menu');
    const btnColumns = document.getElementById('btn-interview-columns');
    const columnsMenu = document.getElementById('interview-columns-dropdown');

    if (btnAdd && modal) {
        btnAdd.onclick = () => {
            modal.classList.remove('hidden');
        };
    }

    if (btnClose && modal) {
        btnClose.onclick = () => {
            modal.classList.add('hidden');
        };
    }

    // Filter Dropdown
    if (btnFilter && filterMenu) {
        btnFilter.onclick = (e) => {
            e.stopPropagation();
            if (columnsMenu) columnsMenu.style.display = 'none'; // Close other
            filterMenu.style.display = filterMenu.style.display === 'block' ? 'none' : 'block';
        };

        filterMenu.querySelectorAll('li').forEach(li => {
            li.onclick = () => {
                const val = li.getAttribute('data-value');
                document.getElementById('interview-filter-label').textContent = val;
                filterMenu.style.display = 'none';
            };
        });
    }

    // Columns Dropdown
    if (btnColumns && columnsMenu) {
        btnColumns.onclick = (e) => {
            e.stopPropagation();
            if (filterMenu) filterMenu.style.display = 'none'; // Close other
            columnsMenu.style.display = columnsMenu.style.display === 'block' ? 'none' : 'block';
        };
    }

    // Close menus on outside click
    document.addEventListener('click', () => {
        if (filterMenu) filterMenu.style.display = 'none';
        if (columnsMenu) columnsMenu.style.display = 'none';
    });

    // Prevent closing when clicking inside the menus
    if (filterMenu) {
        filterMenu.onclick = (e) => e.stopPropagation();
    }
    if (columnsMenu) {
        columnsMenu.onclick = (e) => e.stopPropagation();
    }

    const btnColCancel = document.getElementById('btn-interview-columns-cancel');
    const btnColSave = document.getElementById('btn-interview-columns-save');

    if (btnColCancel) {
        btnColCancel.onclick = () => {
            if (columnsMenu) columnsMenu.style.display = 'none';
        };
    }

    if (btnColSave) {
        btnColSave.onclick = () => {
            // Save logic would go here
            if (columnsMenu) columnsMenu.style.display = 'none';
            if (typeof showToast === 'function') {
                showToast('Interview columns updated successfully');
            }
        };
    }

    // Close modal on background click
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        };
    }
}

window.selectInterviewType = (type) => {
    console.log('Selected interview type:', type);
    const modal = document.getElementById('modal-create-interview-type');
    if (modal) modal.classList.add('hidden');

    if (typeof showToast === 'function') {
        showToast('Scheduled ' + type + ' interview creation started...');
    }
};


function renderEmailUsers() {
    const menu = document.getElementById('email-user-filter-menu');
    const label = document.getElementById('email-filter-user');
    if (!menu) return;

    if (label) label.textContent = state.user.name;

    menu.innerHTML = state.users.map(u => `
        <li style="padding: 10px 15px; font-size: 0.9rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: space-between;">
            ${u.name}
            ${u.name === state.user.name ? '<i class="fas fa-check" style="color: #10b981; font-size: 0.8rem;"></i>' : ''}
        </li>
    `).join('');

    menu.querySelectorAll('li').forEach((li, idx) => {
        li.onclick = () => {
            state.user = state.users[idx];
            localStorage.setItem('recruitUserName', state.user.name);
            renderEmailUsers();
            menu.style.display = 'none';
            // Also update other places where user name is shown if needed
            updateUserInfo();
        };
    });
}

// ===== EMAIL LOGIC =====
function setupEmailListeners() {
    const btnSend = document.getElementById('btn-send-mail');
    const btnFilter = document.getElementById('btn-email-filter');
    const filterMenu = document.getElementById('email-filter-menu');
    const btnUserFilter = document.getElementById('btn-email-user-filter');
    const userFilterMenu = document.getElementById('email-user-filter-menu');

    renderEmailUsers();

    if (btnSend) {
        btnSend.onclick = () => {
            const candidate = state.candidates.find(c => c.id === state.currentCandidateId);
            if (!candidate || !candidate.email) {
                alert('Candidate email not found.');
                return;
            }
            // Opening Gmail Compose window in a new tab
            const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(candidate.email);
            window.open(gmailUrl, '_blank');
        };
    }

    if (btnFilter && filterMenu) {
        btnFilter.onclick = (e) => {
            e.stopPropagation();
            if (userFilterMenu) userFilterMenu.style.display = 'none';
            filterMenu.style.display = filterMenu.style.display === 'block' ? 'none' : 'block';
        };

        filterMenu.querySelectorAll('li').forEach(li => {
            li.onclick = () => {
                const val = li.getAttribute('data-value');
                const label = document.getElementById('email-filter-label');
                if (label) label.textContent = val;
                filterMenu.style.display = 'none';
            };
        });
    }

    if (btnUserFilter && userFilterMenu) {
        btnUserFilter.onclick = (e) => {
            e.stopPropagation();
            if (filterMenu) filterMenu.style.display = 'none';
            userFilterMenu.style.display = userFilterMenu.style.display === 'block' ? 'none' : 'block';
        };
    }

    // Stop propagation for clicks inside email filter menu
    if (filterMenu) {
        filterMenu.onclick = (e) => e.stopPropagation();
    }
    if (userFilterMenu) {
        userFilterMenu.onclick = (e) => e.stopPropagation();
    }
}


// ===== RELATED LIST NAVIGATION =====
function setupRelatedListNavigation() {
    const sidebarLinks = document.querySelectorAll('.detail-sidebar-links li');
    const scrollContainer = document.querySelector('.main-content'); // Main scrollable area

    sidebarLinks.forEach(link => {
        const text = link.querySelector('span') ? link.querySelector('span').textContent.trim() : link.textContent.trim();

        link.addEventListener('click', () => {
            let targetId = '';
            if (text.includes('Notes')) targetId = 'notes-card';
            else if (text.includes('Ratings')) targetId = 'ratings-card';
            else if (text.includes('Attachments')) targetId = 'attachments-card';
            else if (text.includes('Interviews')) targetId = 'interviews-card';
            else if (text.includes('Emails')) targetId = 'emails-card';
            else if (text.includes('Hiring Manager')) targetId = 'hiring-manager-card';
            else if (text.includes('Offer Letters')) targetId = 'offer-letters-card';
            else if (text.includes('Invited Events')) targetId = 'invited-events-card';
            else if (text.includes('Campaigns')) targetId = 'campaigns-card';
            else if (text.includes('To-Dos')) targetId = 'todos-card';
            else if (text.includes('Answered Assess')) targetId = 'assessments-card';

            if (targetId) {
                const targetElement = document.getElementById(targetId);
                if (targetElement && scrollContainer) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}


// ===== APPLICATIONS VIEW DROPDOWN =====
document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('apps-view-trigger');
    const menu = document.getElementById('apps-view-menu');

    if (trigger && menu) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
            document.getElementById('apps-columns-menu')?.classList.remove('show');
        });

        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target)) {
                menu.classList.remove('show');
            }
        });

        menu.querySelectorAll('.view-item').forEach(item => {
            item.addEventListener('click', () => {
                const viewName = item.textContent.trim();
                trigger.innerHTML = `${viewName} <i class="fas fa-caret-down"></i>`;
                menu.querySelectorAll('.view-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                menu.classList.remove('show');

                const toast = document.getElementById('zoho-toast');
                const toastMsg = document.getElementById('zoho-toast-msg');
                if (toast && toastMsg) {
                    toastMsg.textContent = 'View changed to ' + viewName;
                    toast.classList.remove('hidden');
                    setTimeout(() => toast.classList.add('hidden'), 2000);
                }
            });
        });
    }

    // Add Columns Dropdown Logic
    const colTrigger = document.getElementById('apps-add-columns-trigger');
    const colMenu = document.getElementById('apps-columns-menu');

    if (colTrigger && colMenu) {
        colTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            colMenu.classList.toggle('show');
            document.getElementById('apps-view-menu')?.classList.remove('show');
        });

        document.addEventListener('click', (e) => {
            if (!colMenu.contains(e.target) && e.target !== colTrigger) {
                colMenu.classList.remove('show');
            }
        });

        colMenu.querySelector('.btn-cancel')?.addEventListener('click', () => {
            colMenu.classList.remove('show');
        });

        colMenu.querySelector('.btn-save-blue')?.addEventListener('click', () => {
            colMenu.classList.remove('show');
            const toast = document.getElementById('zoho-toast');
            const toastMsg = document.getElementById('zoho-toast-msg');
            if (toast && toastMsg) {
                toastMsg.textContent = 'Columns updated successfully';
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('hidden'), 2000);
            }
        });
    }
});


// ===== APPLICATIONS REFRESH & EDIT =====
function refreshApplications() {
    const refreshBtn = document.getElementById('apps-refresh-btn');
    const refreshIcon = refreshBtn?.querySelector('i');

    if (refreshIcon) {
        refreshIcon.classList.add('spin-animation');

        // Show a small toast to confirm refresh
        const toast = document.getElementById('zoho-toast');
        const toastMsg = document.getElementById('zoho-toast-msg');
        if (toast && toastMsg) {
            toastMsg.textContent = 'Refreshing applications...';
            toast.classList.remove('hidden');
        }

        // Simulate data reload
        setTimeout(() => {
            refreshIcon.classList.remove('spin-animation');
            if (toast) toast.classList.add('hidden');

            // Show completion toast
            if (toast && toastMsg) {
                toastMsg.textContent = 'Applications refreshed successfully';
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('hidden'), 2000);
            }
        }, 1500);
    }
}


// ===== EDIT VIEW COLUMN MANAGEMENT =====
document.addEventListener('DOMContentLoaded', () => {
    const editPage = document.getElementById('page-edit-applications');
    if (!editPage) return;

    const availableList = editPage.querySelector('.scrollable-list');
    const selectedList = editPage.querySelector('.selected-column-item').parentElement;

    editPage.addEventListener('click', (e) => {
        const availableItem = e.target.closest('.scrollable-list-item');
        const selectedItem = e.target.closest('.selected-column-item');

        // Move from Available to Selected
        if (availableItem && availableList.contains(availableItem)) {
            const name = availableItem.textContent.trim();

            const div = document.createElement('div');
            div.className = 'selected-column-item';
            div.innerHTML = name;
            selectedList.appendChild(div);
            availableItem.remove();
        }

        // Move from Selected to Available
        if (selectedItem && selectedList.contains(selectedItem)) {
            // Check if it's a required field (don't allow removing if it has a star)
            if (selectedItem.querySelector('.required-star')) {
                const toast = document.getElementById('zoho-toast');
                const toastMsg = document.getElementById('zoho-toast-msg');
                if (toast && toastMsg) {
                    toastMsg.textContent = 'Required fields cannot be removed';
                    toast.classList.remove('hidden');
                    setTimeout(() => toast.classList.add('hidden'), 2000);
                }
                return;
            }

            const name = selectedItem.textContent.trim();
            const div = document.createElement('div');
            div.className = 'scrollable-list-item';
            div.textContent = name;
            availableList.appendChild(div);
            selectedItem.remove();

            // Sort available list alphabetically
            Array.from(availableList.children)
                .sort((a, b) => a.textContent.localeCompare(b.textContent))
                .forEach(node => availableList.appendChild(node));
        }
    });
});


// ===== EDIT VIEW SEARCH LOGIC =====
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('edit-columns-search');
    const availableList = document.querySelector('#page-edit-applications .scrollable-list');

    if (searchInput && availableList) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const items = availableList.querySelectorAll('.scrollable-list-item');

            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
});


// Toast Notification System
function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `background: #1e293b; color: white; padding: 12px 24px; border-radius: 8px; margin-top: 10px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; animation: slideIn 0.3s ease-out; border-left: 4px solid ${type === 'success' ? '#10b981' : '#ef4444'};`;

    const icon = type === 'success' ? '<i class="fas fa-check-circle" style="color:#10b981"></i>' : '<i class="fas fa-exclamation-circle" style="color:#ef4444"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add Keyframes for animation
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.innerHTML = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    `;
    document.head.appendChild(style);
}

// ============================================================
// IMPORT FROM SPREADSHEET / DOCUMENT  –  Modal + Logic
// ============================================================

/* ---- Shared modal overlay helper ---- */
function _importModalOverlay(id) {
    let ov = document.getElementById(id);
    if (ov) { ov.style.display = 'flex'; return ov; }
    ov = document.createElement('div');
    ov.id = id;
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:10000;';
    document.body.appendChild(ov);
    return ov;
}
function _closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

/* ============================================================
   IMPORT FROM SPREADSHEET  (CSV)
   ============================================================ */
const CANDIDATE_FIELDS = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'pinCode', label: 'Pin Code' },
    { key: 'experience', label: 'Experience (Years)' },
    { key: 'qualification', label: 'Highest Qualification' },
    { key: 'jobTitle', label: 'Current Job Title' },
    { key: 'employer', label: 'Current Employer' },
    { key: 'expectedSalary', label: 'Expected Salary' },
    { key: 'currentSalary', label: 'Current Salary' },
    { key: 'skills', label: 'Skill Set (comma separated)' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'status', label: 'Candidate Status' },
    { key: 'source', label: 'Source' },
    { key: 'owner', label: 'Candidate Owner' },
    { key: 'additionalInfo', label: 'Additional Info' },
];

let _csvHeaders = [];
let _csvRows = [];

function openImportSpreadsheetModal() {
    const ovId = 'import-spreadsheet-overlay';
    const ov = _importModalOverlay(ovId);

    ov.innerHTML = `
    <div style="background:#fff;border-radius:12px;width:820px;max-width:96vw;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fas fa-file-csv" style="color:#16a34a;font-size:1.4rem;"></i>
          <span style="font-size:1.1rem;font-weight:700;color:#111827;">Import Candidates from Spreadsheet</span>
        </div>
        <button onclick="_closeModal('${ovId}')" style="border:none;background:none;font-size:1.3rem;color:#6b7280;cursor:pointer;">&times;</button>
      </div>

      <div id="ss-step1" style="padding:28px 28px 0;">
        <p style="color:#374151;margin:0 0 16px;font-size:.93rem;">Upload a <strong>CSV file</strong> (.csv). The first row must contain column headers.</p>
        <label id="ss-drop-zone" style="display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed #d1d5db;border-radius:10px;padding:36px 20px;cursor:pointer;transition:.2s;background:#f9fafb;">
          <i class="fas fa-cloud-upload-alt" style="font-size:2.4rem;color:#9ca3af;margin-bottom:12px;"></i>
          <span style="font-size:.95rem;color:#4b5563;font-weight:500;">Click to choose file or drag &amp; drop</span>
          <span style="font-size:.8rem;color:#9ca3af;margin-top:4px;">Supports .csv files</span>
          <input type="file" id="ss-file-input" accept=".csv,text/csv" style="display:none;">
        </label>
        <div id="ss-file-name" style="margin-top:10px;font-size:.85rem;color:#2563eb;font-weight:500;"></div>
      </div>

      <div id="ss-step2" style="display:none;padding:24px 28px 0;flex:1;overflow-y:auto;">
        <p style="color:#374151;margin:0 0 14px;font-size:.93rem;">Match your spreadsheet columns to the candidate fields below.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;" id="ss-column-map"></div>
      </div>

      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;background:#f8fafc;margin-top:16px;">
        <span id="ss-status" style="font-size:.85rem;color:#6b7280;"></span>
        <div style="display:flex;gap:10px;">
          <button onclick="_closeModal('${ovId}')" style="padding:8px 20px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;cursor:pointer;font-weight:500;">Cancel</button>
          <button id="ss-import-btn" onclick="submitSpreadsheetImport()" style="padding:8px 22px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;display:none;">
            <i class="fas fa-file-import" style="margin-right:6px;"></i>Import Candidates
          </button>
        </div>
      </div>
    </div>`;

    const fileInput = document.getElementById('ss-file-input');
    const dropZone = document.getElementById('ss-drop-zone');
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = '#2563eb'; });
    dropZone.addEventListener('dragleave', () => dropZone.style.borderColor = '#d1d5db');
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.style.borderColor = '#d1d5db';
        if (e.dataTransfer.files[0]) processSpreadsheetFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) processSpreadsheetFile(fileInput.files[0]);
    });
}

function processSpreadsheetFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showToast('Please upload a valid .csv file.', 'error'); return;
    }
    document.getElementById('ss-file-name').textContent = '\uD83D\uDCC4 ' + file.name;
    const reader = new FileReader();
    reader.onload = e => {
        const { headers, rows } = parseCSV(e.target.result);
        _csvHeaders = headers;
        _csvRows = rows;
        if (headers.length === 0) { showToast('CSV appears empty or invalid.', 'error'); return; }
        document.getElementById('ss-status').textContent = rows.length + ' row(s) detected, ' + headers.length + ' column(s).';
        renderColumnMapper(headers);
        document.getElementById('ss-step1').style.display = 'none';
        document.getElementById('ss-step2').style.display = 'block';
        document.getElementById('ss-import-btn').style.display = 'inline-flex';
    };
    reader.readAsText(file, 'UTF-8');
}

function parseCSV(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    const splitLine = raw => {
        const result = [];
        let cur = '', inQ = false;
        for (let i = 0; i < raw.length; i++) {
            const ch = raw[i];
            if (ch === '"') { inQ = !inQ; }
            else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
            else { cur += ch; }
        }
        result.push(cur.trim());
        return result;
    };

    const headers = splitLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const vals = splitLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
        if (vals.every(v => v === '')) continue;
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
        rows.push(obj);
    }
    return { headers, rows };
}

function autoMatchField(colHeader) {
    const h = colHeader.toLowerCase().replace(/[\s_\-]/g, '');
    for (const f of CANDIDATE_FIELDS) {
        const k = f.key.toLowerCase();
        const l = f.label.toLowerCase().replace(/[\s_\-()/]/g, '');
        if (h === k || h === l || h.includes(k) || k.includes(h)) return f.key;
    }
    return '';
}

function renderColumnMapper(headers) {
    const container = document.getElementById('ss-column-map');
    const fieldOptions = CANDIDATE_FIELDS.map(f => '<option value="' + f.key + '">' + f.label + '</option>').join('');
    container.innerHTML = headers.map((col, idx) => `
        <div style="display:flex;align-items:center;gap:8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:.75rem;color:#6b7280;margin-bottom:3px;">CSV Column</div>
            <div style="font-weight:600;font-size:.88rem;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${col}">${col}</div>
          </div>
          <i class="fas fa-arrow-right" style="color:#9ca3af;font-size:.75rem;flex-shrink:0;"></i>
          <div style="flex:1;">
            <div style="font-size:.75rem;color:#6b7280;margin-bottom:3px;">Map to Field</div>
            <select id="map-col-${idx}" style="width:100%;padding:5px 8px;border:1px solid #d1d5db;border-radius:5px;font-size:.83rem;color:#111827;">
              <option value="">-- Skip --</option>
              ${fieldOptions}
            </select>
          </div>
        </div>`).join('');

    headers.forEach((col, idx) => {
        const sel = document.getElementById('map-col-' + idx);
        const matched = autoMatchField(col);
        if (sel && matched) sel.value = matched;
    });
}

async function submitSpreadsheetImport() {
    const btn = document.getElementById('ss-import-btn');
    const statusEl = document.getElementById('ss-status');

    const mapping = {};
    _csvHeaders.forEach((col, idx) => {
        const val = document.getElementById('map-col-' + idx) && document.getElementById('map-col-' + idx).value;
        if (val) mapping[col] = val;
    });

    if (Object.keys(mapping).length === 0) {
        showToast('Please map at least one column.', 'error'); return;
    }

    const candidates = _csvRows.map(row => {
        const c = {};
        for (const col in mapping) {
            const field = mapping[col];
            if (field === 'skills') {
                c[field] = (row[col] || '').split(',').map(s => s.trim()).filter(Boolean);
            } else {
                c[field] = row[col] || '';
            }
        }
        return c;
    });

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Importing\u2026';
    statusEl.textContent = 'Sending data to server\u2026';

    try {
        const res = await fetch('/api/candidates/bulk-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidates })
        });
        const result = await res.json();
        if (result.message === 'success') {
            _closeModal('import-spreadsheet-overlay');
            await loadCandidates();
            showToast('\u2705 Import complete! ' + result.successCount + ' added, ' + result.failCount + ' failed.', 'success');
        } else {
            showToast('Import failed: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-file-import" style="margin-right:6px;"></i>Import Candidates';
    }
}

/* ============================================================
   IMPORT FROM DOCUMENT  (text extraction)
   ============================================================ */
function openImportDocumentModal() {
    const ovId = 'import-document-overlay';
    const ov = _importModalOverlay(ovId);

    ov.innerHTML = `
    <div style="background:#fff;border-radius:12px;width:700px;max-width:96vw;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fas fa-file-alt" style="color:#7c3aed;font-size:1.4rem;"></i>
          <span style="font-size:1.1rem;font-weight:700;color:#111827;">Import Candidate from Document</span>
        </div>
        <button onclick="_closeModal('${ovId}')" style="border:none;background:none;font-size:1.3rem;color:#6b7280;cursor:pointer;">&times;</button>
      </div>

      <div style="padding:26px 28px;flex:1;overflow-y:auto;">
        <p style="color:#374151;margin:0 0 16px;font-size:.93rem;">
          Paste the candidate details below. The system will extract key information and pre-fill the form.
        </p>
        <label id="doc-drop-zone" style="display:flex;align-items:center;gap:12px;border:2px dashed #d1d5db;border-radius:10px;padding:14px 20px;cursor:pointer;transition:.2s;background:#f9fafb;margin-bottom:14px;">
          <i class="fas fa-paperclip" style="font-size:1.4rem;color:#9ca3af;"></i>
          <div>
            <div style="font-size:.88rem;font-weight:600;color:#374151;">Attach a .txt file (optional)</div>
            <div style="font-size:.77rem;color:#9ca3af;">Content will be pasted below automatically</div>
          </div>
          <input type="file" id="doc-file-input" accept=".txt,text/plain" style="display:none;">
        </label>
        <textarea id="doc-text-area" placeholder="Paste candidate details here&#10;&#10;Example:&#10;Name: Ravi Kumar&#10;Email: ravi@example.com&#10;Mobile: 9876543210&#10;Job Title: Software Engineer&#10;Skills: Java, Spring, SQL&#10;City: Chennai&#10;Experience: 4&#10;Company: TCS"
          style="width:100%;height:190px;border:1px solid #d1d5db;border-radius:8px;padding:12px;font-size:.88rem;line-height:1.6;resize:vertical;font-family:'Inter',sans-serif;box-sizing:border-box;color:#111827;"></textarea>

        <div id="doc-preview" style="display:none;margin-top:18px;">
          <div style="font-size:.85rem;font-weight:700;color:#4b5563;margin-bottom:10px;"><i class="fas fa-magic" style="color:#7c3aed;margin-right:6px;"></i>Extracted Fields Preview</div>
          <div id="doc-preview-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.83rem;"></div>
        </div>
      </div>

      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:10px;background:#f8fafc;">
        <button onclick="_closeModal('${ovId}')" style="padding:8px 20px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;cursor:pointer;font-weight:500;">Cancel</button>
        <button onclick="previewDocumentImport()" style="padding:8px 20px;border:none;border-radius:6px;background:#7c3aed;color:#fff;cursor:pointer;font-weight:600;">
          <i class="fas fa-eye" style="margin-right:6px;"></i>Extract &amp; Preview
        </button>
        <button id="doc-import-btn" onclick="submitDocumentImport()" style="padding:8px 22px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;display:none;">
          <i class="fas fa-user-plus" style="margin-right:6px;"></i>Add Candidate
        </button>
      </div>
    </div>`;

    const fileInput = document.getElementById('doc-file-input');
    document.getElementById('doc-drop-zone').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (!fileInput.files[0]) return;
        const reader = new FileReader();
        reader.onload = e => { document.getElementById('doc-text-area').value = e.target.result; };
        reader.readAsText(fileInput.files[0], 'UTF-8');
    });
}

function extractCandidateFromText(text) {
    const get = patterns => {
        for (const p of patterns) {
            const m = text.match(p);
            if (m && m[1] && m[1].trim()) return m[1].trim();
        }
        return '';
    };

    const name = get([/(?:full[\s-]?name|name)\s*[:\-]\s*(.+)/i]);
    let firstName = '', lastName = '';
    if (name) {
        const parts = name.split(/\s+/);
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
    } else {
        firstName = get([/first[\s-]?name\s*[:\-]\s*(.+)/i]);
        lastName = get([/last[\s-]?name\s*[:\-]\s*(.+)/i, /surname\s*[:\-]\s*(.+)/i]);
    }

    const skillsRaw = get([/skills?\s*[:\-]\s*(.+)/i, /skill[\s-]?set\s*[:\-]\s*(.+)/i]);
    const skills = skillsRaw ? skillsRaw.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [];

    return {
        firstName,
        lastName,
        email: get([/e-?mail\s*[:\-]\s*([\w.\-+]+@[\w.\-]+\.\w+)/i]),
        mobile: get([/mobile\s*[:\-]\s*([\d\s\-+()]{7,15})/i, /phone\s*[:\-]\s*([\d\s\-+()]{7,15})/i]),
        city: get([/city\s*[:\-]\s*(.+)/i, /location\s*[:\-]\s*(.+)/i]),
        state: get([/state\s*[:\-]\s*(.+)/i]),
        country: get([/country\s*[:\-]\s*(.+)/i]),
        experience: get([/experience\s*[:\-]\s*(\d+(?:\.\d+)?)/i]),
        qualification: get([/qualification\s*[:\-]\s*(.+)/i, /education\s*[:\-]\s*(.+)/i, /degree\s*[:\-]\s*(.+)/i]),
        jobTitle: get([/job\s+title\s*[:\-]\s*(.+)/i, /designation\s*[:\-]\s*(.+)/i, /role\s*[:\-]\s*(.+)/i, /position\s*[:\-]\s*(.+)/i]),
        employer: get([/(?:employer|company|organization|organisation)\s*[:\-]\s*(.+)/i]),
        expectedSalary: get([/expected\s+(?:salary|ctc)\s*[:\-]\s*(.+)/i]),
        currentSalary: get([/current\s+(?:salary|ctc)\s*[:\-]\s*(.+)/i]),
        linkedin: get([/linkedin\s*[:\-]\s*(https?:\/\/[\S]+)/i]),
        skills,
        status: 'New',
        source: 'Imported by Parser',
    };
}

let _extractedCandidate = null;

function previewDocumentImport() {
    const text = document.getElementById('doc-text-area').value.trim();
    if (!text) { showToast('Please enter or paste candidate text first.', 'error'); return; }

    _extractedCandidate = extractCandidateFromText(text);

    const displayFields = [
        ['First Name', _extractedCandidate.firstName],
        ['Last Name', _extractedCandidate.lastName],
        ['Email', _extractedCandidate.email],
        ['Mobile', _extractedCandidate.mobile],
        ['City', _extractedCandidate.city],
        ['State', _extractedCandidate.state],
        ['Experience', _extractedCandidate.experience ? _extractedCandidate.experience + ' yrs' : ''],
        ['Job Title', _extractedCandidate.jobTitle],
        ['Employer', _extractedCandidate.employer],
        ['Qualification', _extractedCandidate.qualification],
        ['Skills', Array.isArray(_extractedCandidate.skills) ? _extractedCandidate.skills.join(', ') : ''],
        ['LinkedIn', _extractedCandidate.linkedin],
    ];

    document.getElementById('doc-preview-grid').innerHTML = displayFields.map(function (pair) {
        const label = pair[0], val = pair[1];
        return '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 12px;">' +
            '<div style="font-size:.72rem;color:#6b7280;margin-bottom:2px;">' + label + '</div>' +
            '<div style="font-weight:600;color:' + (val ? '#111827' : '#d1d5db') + ';">' + (val || '\u2014') + '</div></div>';
    }).join('');

    document.getElementById('doc-preview').style.display = 'block';
    document.getElementById('doc-import-btn').style.display = 'inline-flex';

    const hasData = _extractedCandidate.firstName || _extractedCandidate.lastName || _extractedCandidate.email;
    if (!hasData) {
        showToast('Could not extract key fields. Check the format (e.g. Name: John Doe).', 'error');
    } else {
        showToast('Fields extracted! Review and click "Add Candidate".', 'success');
    }
}

async function submitDocumentImport() {
    if (!_extractedCandidate) return;
    const btn = document.getElementById('doc-import-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Adding\u2026';

    try {
        const res = await fetch('/api/candidates/bulk-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidates: [_extractedCandidate] })
        });
        const result = await res.json();
        if (result.message === 'success' && result.successCount > 0) {
            _closeModal('import-document-overlay');
            _extractedCandidate = null;
            await loadCandidates();
            showToast('\u2705 Candidate added successfully!', 'success');
        } else {
            showToast('Import failed: ' + ((result.errors && result.errors[0] && result.errors[0].error) || result.error || 'Unknown'), 'error');
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus" style="margin-right:6px;"></i>Add Candidate';
    }
}

/* ---- Wire up dropdown click events (runs after DOM ready) ---- */
document.addEventListener('DOMContentLoaded', function () {
    var elSS = document.getElementById('btn-import-spreadsheet');
    var elDoc = document.getElementById('btn-import-document');
    var elPaste = document.getElementById('btn-paste-resume');
    var elExtract = document.getElementById('btn-extract-resumes');
    var elNotes = document.getElementById('btn-import-notes');

    if (elSS) elSS.addEventListener('click', function (e) { e.preventDefault(); openImportSpreadsheetModal(); });
    if (elDoc) elDoc.addEventListener('click', function (e) { e.preventDefault(); openImportDocumentModal(); });
    if (elPaste) elPaste.addEventListener('click', function (e) { e.preventDefault(); openPasteResumeModal(); });
    if (elExtract) elExtract.addEventListener('click', function (e) { e.preventDefault(); openExtractResumesModal(); });
    if (elNotes) elNotes.addEventListener('click', function (e) { e.preventDefault(); openImportNotesModal(); });

    // Also handle the main Import button click to toggle dropdown (if not already handled by CSS)
    var btnImport = document.getElementById('btn-import-candidate');
    if (btnImport) {
        btnImport.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var menu = this.nextElementSibling;
            if (menu) {
                const isVisible = menu.style.display === 'block';
                // Close all other dropdowns first
                document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = 'none');
                menu.style.display = isVisible ? 'none' : 'block';
            }
        });
    }
});

/* ============================================================
   PASTE RESUME MODAL
   ============================================================ */
function openPasteResumeModal() {
    const ovId = 'paste-resume-overlay';
    const ov = _importModalOverlay(ovId);

    ov.innerHTML = `
    <div style="background:#fff;border-radius:12px;width:700px;max-width:96vw;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fas fa-paste" style="color:#f59e0b;font-size:1.4rem;"></i>
          <span style="font-size:1.1rem;font-weight:700;color:#111827;">Paste the Resume</span>
        </div>
        <button onclick="_closeModal('${ovId}')" style="border:none;background:none;font-size:1.3rem;color:#6b7280;cursor:pointer;">&times;</button>
      </div>

      <div style="padding:26px 28px;flex:1;overflow-y:auto;">
        <p style="color:#374151;margin:0 0 16px;font-size:.93rem;">Paste the full text of the resume below to extract candidate details.</p>
        <textarea id="paste-text-area" placeholder="Paste resume content here..."
          style="width:100%;height:300px;border:1px solid #d1d5db;border-radius:8px;padding:12px;font-size:.88rem;line-height:1.6;resize:vertical;font-family:'Inter',sans-serif;box-sizing:border-box;color:#111827;"></textarea>
      </div>

      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:10px;background:#f8fafc;">
        <button onclick="_closeModal('${ovId}')" style="padding:8px 20px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;cursor:pointer;font-weight:500;">Cancel</button>
        <button onclick="processPasteResume()" style="padding:8px 22px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;">
          <i class="fas fa-magic" style="margin-right:6px;"></i>Extract Details
        </button>
      </div>
    </div>`;
}

function processPasteResume() {
    const text = document.getElementById('paste-text-area').value.trim();
    if (!text) { showToast('Please paste resume text first.', 'error'); return; }

    // Reuse the extraction logic from Import Document
    _extractedCandidate = extractCandidateFromText(text);
    _closeModal('paste-resume-overlay');

    // Open the Document Modal to show preview
    openImportDocumentModal();
    document.getElementById('doc-text-area').value = text;
    previewDocumentImport();
}

/* ============================================================
   EXTRACT RESUMES (Bulk Upload)
   ============================================================ */
function openExtractResumesModal() {
    const ovId = 'extract-resumes-overlay';
    const ov = _importModalOverlay(ovId);

    ov.innerHTML = `
    <div style="background:#fff;border-radius:12px;width:600px;max-width:96vw;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fas fa-file-export" style="color:#0ea5e9;font-size:1.4rem;"></i>
          <span style="font-size:1.1rem;font-weight:700;color:#111827;">Extract Resumes</span>
        </div>
        <button onclick="_closeModal('${ovId}')" style="border:none;background:none;font-size:1.3rem;color:#6b7280;cursor:pointer;">&times;</button>
      </div>

      <div style="padding:28px;">
        <p style="color:#374151;margin:0 0 20px;font-size:.93rem;">Upload multiple resume files (PDF, DOCX, TXT) for automated extraction.</p>
        <label id="extract-drop-zone" style="display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed #d1d5db;border-radius:10px;padding:40px 20px;cursor:pointer;transition:.2s;background:#f9fafb;">
          <i class="fas fa-files-medical" style="font-size:2.6rem;color:#9ca3af;margin-bottom:14px;"></i>
          <span style="font-size:1rem;color:#4b5563;font-weight:600;">Select Multiple Files</span>
          <span style="font-size:.8rem;color:#9ca3af;margin-top:6px;">Supported: PDF, DOCX, TXT</span>
          <input type="file" id="extract-file-input" multiple style="display:none;">
        </label>
        <div id="extract-file-list" style="margin-top:15px;max-height:150px;overflow-y:auto;font-size:.85rem;"></div>
      </div>

      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:10px;background:#f8fafc;">
        <button onclick="_closeModal('${ovId}')" style="padding:8px 20px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;cursor:pointer;font-weight:500;">Cancel</button>
        <button id="btn-start-extract" style="padding:8px 22px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;" onclick="startBulkExtraction()">
          Start Extraction
        </button>
      </div>
    </div>`;

    const fileInput = document.getElementById('extract-file-input');
    const dropZone = document.getElementById('extract-drop-zone');
    const list = document.getElementById('extract-file-list');

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = () => {
        list.innerHTML = Array.from(fileInput.files).map(f => `<div style="padding:4px 0;color:#2563eb;"><i class="far fa-file-alt"></i> ${f.name}</div>`).join('');
    };
}

function startBulkExtraction() {
    const files = document.getElementById('extract-file-input').files;
    if (files.length === 0) { showToast('Please select files first.', 'error'); return; }

    showToast(`Processing ${files.length} files... This might take a moment.`, 'success');
    _closeModal('extract-resumes-overlay');

    // In a real app, we'd upload these to a parser. For now, we simulate.
    setTimeout(() => {
        showToast(`Extraction simulated. In a production environment, we'd use an AI parsing service.`, 'success');
    }, 2000);
}

/* ============================================================
   IMPORT NOTES
   ============================================================ */
function openImportNotesModal() {
    const ovId = 'import-notes-overlay';
    const ov = _importModalOverlay(ovId);

    ov.innerHTML = `
    <div style="background:#fff;border-radius:12px;width:600px;max-width:96vw;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fas fa-sticky-note" style="color:#eab308;font-size:1.4rem;"></i>
          <span style="font-size:1.1rem;font-weight:700;color:#111827;">Import Notes</span>
        </div>
        <button onclick="_closeModal('${ovId}')" style="border:none;background:none;font-size:1.3rem;color:#6b7280;cursor:pointer;">&times;</button>
      </div>

      <div style="padding:28px;">
        <p style="color:#374151;margin:0 0 16px;font-size:.93rem;">Import notes from a CSV file. Columns must include: CandidateID/Email, Title, Content.</p>
        <input type="file" id="notes-file-input" accept=".csv" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;">
      </div>

      <div style="padding:16px 24px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:10px;background:#f8fafc;">
        <button onclick="_closeModal('${ovId}')" style="padding:8px 20px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;cursor:pointer;font-weight:500;">Cancel</button>
        <button style="padding:8px 22px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;" onclick="showToast('Notes import logic pending backend support', 'error')">
          Import Notes
        </button>
      </div>
    </div>`;
}
