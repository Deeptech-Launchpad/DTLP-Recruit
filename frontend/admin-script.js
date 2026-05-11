// ==========================================
// ADMIN AUTHENTICATION & MANAGEMENT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        verifyAdminToken(token);
    } else {
        const overlay = document.getElementById('admin-login-overlay');
        if (overlay) overlay.style.display = 'flex';
    }
});

// Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const errorEl = document.getElementById('login-error');

        try {
            const res = await fetch(`/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('adminToken', data.access_token);
                document.getElementById('admin-login-overlay').style.display = 'none';
                getCurrentAdminName();
                // We reload the page so the app initializes properly with the admin context
                window.location.reload();
            } else {
                errorEl.innerText = data.error || "Login failed";
            }
        } catch (err) {
            errorEl.innerText = "Network error";
        }
    });
}

// Verify Token
async function verifyAdminToken(token) {
    try {
        const res = await fetch(`/api/admin/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const overlay = document.getElementById('admin-login-overlay');
            if (overlay) overlay.style.display = 'none';
            const data = await res.json();
            const nameEl = document.getElementById('profile-admin-name');
            const emailEl = document.getElementById('profile-admin-email');
            const avatarCircle = document.getElementById('dropdown-avatar-circle');
            const topNavAvatar = document.getElementById('nav-avatar');

            if (nameEl) nameEl.innerText = data.username;
            if (emailEl) emailEl.innerText = data.email || 'No email provided';
            if (avatarCircle) avatarCircle.innerText = data.username.charAt(0).toUpperCase();
            if (topNavAvatar) topNavAvatar.innerText = data.username.charAt(0).toUpperCase();
        } else {
            localStorage.removeItem('adminToken');
            const overlay = document.getElementById('admin-login-overlay');
            if (overlay) overlay.style.display = 'flex';
        }
    } catch (err) {
        localStorage.removeItem('adminToken');
        const overlay = document.getElementById('admin-login-overlay');
        if (overlay) overlay.style.display = 'flex';
    }
}

async function getCurrentAdminName() {
    const token = localStorage.getItem('adminToken');
    if(!token) return;
    try {
        const res = await fetch(`/api/admin/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            const nameEl = document.getElementById('profile-admin-name');
            const emailEl = document.getElementById('profile-admin-email');
            const avatarCircle = document.getElementById('dropdown-avatar-circle');
            const topNavAvatar = document.getElementById('nav-avatar');

            if (nameEl) nameEl.innerText = data.username;
            if (emailEl) emailEl.innerText = data.email || 'No email provided';
            if (avatarCircle) avatarCircle.innerText = data.username.charAt(0).toUpperCase();
            if (topNavAvatar) topNavAvatar.innerText = data.username.charAt(0).toUpperCase();
        }
    } catch (err) {
        console.error(err);
    }
}

// Logout
window.adminLogout = function() {
    localStorage.removeItem('adminToken');
    window.location.reload();
};

// Show Admin Management Page
window.showAdminManagement = function() {
    // Hide all other pages
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.add('hidden');
        section.style.setProperty('display', 'none', 'important');
    });
    
    // Show the modal view over everything
    const adminModal = document.getElementById('admin-management-modal');
    if (adminModal) {
        adminModal.classList.remove('hidden');
        loadAdminsList();
    }
};

window.closeAdminManagement = function() {
    const adminModal = document.getElementById('admin-management-modal');
    if (adminModal) {
        adminModal.classList.add('hidden');
    }
    // Restore main application view
    if (typeof navigate === 'function' && typeof state !== 'undefined' && state.currentPage) {
        navigate(state.currentPage);
    } else {
        window.location.reload();
    }
};

// Load Admins for Management
async function loadAdminsList() {
    const token = localStorage.getItem('adminToken');
    try {
        const res = await fetch(`/api/admin/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        const tbody = document.getElementById('admins-list-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        const currentName = document.getElementById('profile-admin-name').innerText;

        json.data.forEach(admin => {
            const tr = document.createElement('tr');
            const isActive = admin.is_active;
            const isSelf = admin.username === currentName;

            tr.innerHTML = `
                <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b;">#${admin.id}</td>
                <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${admin.username} ${isSelf ? '<span style="font-size: 0.7rem; color: #0ea5e9; margin-left: 5px;">(You)</span>' : ''}</td>
                <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0;">${admin.email || '-'}</td>
                <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0;"><span style="padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; display: inline-block; ${isActive ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'}">${isActive ? 'Active' : 'Deactivated'}</span></td>
                <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    <button onclick="openResetPasswordModal(${admin.id}, '${admin.username}')" style="background: transparent; border: 1px solid #0ea5e9; color: #0ea5e9; padding: 4px 10px; font-size: 0.8rem; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-key"></i> Reset Password
                    </button>
                </td>
                <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        ${isSelf ? '' : `
                            <button onclick="toggleAdminStatus(${admin.id})" style="background: transparent; border: 1px solid ${isActive ? '#ef4444' : '#10b981'}; color: ${isActive ? '#ef4444' : '#10b981'}; padding: 4px 10px; font-size: 0.8rem; border-radius: 6px; cursor: pointer;">
                                <i class="fas ${isActive ? 'fa-ban' : 'fa-check'}"></i> ${isActive ? 'Deactivate' : 'Activate'}
                            </button>
                        `}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

// Toggle Admin Status
window.toggleAdminStatus = async (id) => {
    const token = localStorage.getItem('adminToken');
    try {
        const res = await fetch(`/api/admin/${id}/toggle-status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            loadAdminsList();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Network error");
    }
};

// Create Admin API
const createAdminForm = document.getElementById('create-admin-form');
if (createAdminForm) {
    createAdminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        const username = document.getElementById('new-admin-username').value;
        const email = document.getElementById('new-admin-email').value;
        const password = document.getElementById('new-admin-password').value;
        const errorEl = document.getElementById('create-admin-error');
        errorEl.innerText = '';

        try {
            const res = await fetch(`/api/admin/create`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                document.getElementById('create-admin-section').classList.add('hidden');
                createAdminForm.reset();
                loadAdminsList();
            } else {
                errorEl.innerText = data.error;
            }
        } catch (err) {
            errorEl.innerText = "Network error";
        }
    });
}
// Reset Password Modal
window.openResetPasswordModal = (id, username) => {
    const modal = document.getElementById('reset-password-modal');
    const idInput = document.getElementById('reset-admin-id');
    const nameDisplay = document.getElementById('reset-username-display');
    const form = document.getElementById('reset-password-form');
    const errorEl = document.getElementById('reset-password-error');

    if (modal && idInput && nameDisplay) {
        idInput.value = id;
        nameDisplay.innerText = username;
        errorEl.innerText = '';
        if (form) form.reset();
        modal.classList.remove('hidden');
    }
};

const resetPasswordForm = document.getElementById('reset-password-form');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        const id = document.getElementById('reset-admin-id').value;
        const newPassword = document.getElementById('reset-new-password').value;
        const confirmPassword = document.getElementById('reset-confirm-password').value;
        const errorEl = document.getElementById('reset-password-error');
        errorEl.innerText = '';

        if (newPassword !== confirmPassword) {
            errorEl.innerText = "Passwords do not match";
            return;
        }

        try {
            const res = await fetch(`/api/admin/${id}/reset-password`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ password: newPassword })
            });
            const data = await res.json();
            
            if (res.ok) {
                document.getElementById('reset-password-modal').classList.add('hidden');
                alert("Password updated successfully");
            } else {
                errorEl.innerText = data.error;
            }
        } catch (err) {
            errorEl.innerText = "Network error";
        }
    });
}
