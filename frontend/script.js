let currentUser = null;
let allCourses = []; 
let allStaff = [];
let allAnnouncements = [];

function switchAuthTab(tab) {
    document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('tab-login').classList.toggle('active-tab', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active-tab', tab === 'register');
    document.getElementById('auth-error').textContent = '';
}

// 1. Auth
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        
        loginSuccess(data.user);
    } catch (err) {
        document.getElementById('auth-error').textContent = err.message;
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-user').value;
    const password = document.getElementById('reg-pass').value;
    const role = document.getElementById('reg-role').value;
    
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        
        loginSuccess(data.user);
    } catch (err) {
        document.getElementById('auth-error').textContent = err.message;
    }
});

function loginSuccess(user) {
    currentUser = user;
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    document.getElementById('current-user-role').textContent = `(${user.role})`;
    
    if (user.role === 'admin') {
        document.getElementById('nav-admin').style.display = 'inline-block';
    } else {
        document.getElementById('nav-admin').style.display = 'none';
    }
    
    showView('courses');
}

function logout() {
    currentUser = null;
    document.getElementById('auth-section').style.display = 'flex';
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    document.getElementById('auth-error').textContent = '';
}

function showView(viewId) {
    document.getElementById('courses-view').style.display = 'none';
    document.getElementById('staff-dir-view').style.display = 'none';
    document.getElementById('announcements-view').style.display = 'none';
    document.getElementById('admin-view').style.display = 'none';
    
    document.getElementById(`${viewId}-view`).style.display = 'block';
    
    if (viewId === 'courses') fetchCourses();
    if (viewId === 'staff-dir') fetchStaffDir();
    if (viewId === 'announcements') fetchAnnouncements();
    if (viewId === 'admin') fetchAdminData();
}

// ================= COURSES VIEW =================

async function fetchCourses() {
    try {
        const res = await fetch('/api/courses');
        allCourses = await res.json();
        renderCoursesGrid(allCourses);
    } catch (err) {
        console.error('Failed to fetch courses', err);
    }
}

function renderCoursesGrid(courses) {
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = courses.map(c => `
        <div class="course-card" onclick="openCourseModal(${c.id})">
            <div class="card-icon">${c.icon}</div>
            <h4>[${c.code}] ${c.title}</h4>
            <p>${c.description}</p>
            <div class="card-footer">
                <span>👨‍🏫 ${c.instructor}</span>
                <span>⭐ ${c.credits} Credits</span>
            </div>
        </div>
    `).join('');
}

function filterCourses() {
    const query = document.getElementById('course-search').value.toLowerCase();
    const filtered = allCourses.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.code.toLowerCase().includes(query)
    );
    renderCoursesGrid(filtered);
}

function openCourseModal(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;

    document.getElementById('modal-icon').textContent = course.icon;
    document.getElementById('modal-title').textContent = `[${course.code}] ${course.title}`;
    document.getElementById('modal-desc').textContent = course.description;
    document.getElementById('modal-instructor').textContent = course.instructor;
    document.getElementById('modal-department').textContent = course.department || 'N/A';
    document.getElementById('modal-prerequisites').textContent = course.prerequisites || 'None';
    document.getElementById('modal-credits').textContent = course.credits;
    document.getElementById('modal-schedule').textContent = course.schedule;

    document.getElementById('course-modal').style.display = 'flex';
}

function closeModal(event) {
    if (event && event.target.id !== 'course-modal') return;
    document.getElementById('course-modal').style.display = 'none';
}

// ================= STAFF DIRECTORY VIEW =================

async function fetchStaffDir() {
    try {
        const res = await fetch('/api/staff');
        allStaff = await res.json();
        const grid = document.getElementById('staff-dir-grid');
        grid.innerHTML = allStaff.map(s => `
            <div class="course-card">
                <h4>${s.name}</h4>
                <p style="margin-bottom: 5px;"><strong>${s.role}</strong> - ${s.department}</p>
                <div style="font-size: 0.9em; color: #64748b; margin-bottom: 15px; flex-grow: 1;">
                    <div>📧 ${s.email || 'N/A'}</div>
                    <div>📍 ${s.contact || 'N/A'}</div>
                    <div>🕒 ${s.office_hours || 'N/A'}</div>
                </div>
                <div class="card-footer">
                    <span>📚 ${s.assigned_courses || 'None'}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Failed to fetch staff', err);
    }
}

// ================= ANNOUNCEMENTS VIEW =================

async function fetchAnnouncements() {
    try {
        const res = await fetch('/api/announcements');
        allAnnouncements = await res.json();
        renderAnnouncementsGrid();
    } catch (err) {
        console.error('Failed to fetch announcements', err);
    }
}

function renderAnnouncementsGrid() {
    const grid = document.getElementById('announcements-grid');
    grid.innerHTML = allAnnouncements.map(a => `
        <div class="course-card">
            <h4 style="color: #0f172a; margin-bottom: 5px;">${a.title}</h4>
            <p style="margin-top: 10px; margin-bottom: 15px; white-space: pre-wrap;">${a.body}</p>
            <div class="card-footer" style="font-size: 0.85em; color: #64748b;">
                <span>📅 ${new Date(a.date).toLocaleDateString()}</span>
                <span>👤 ${a.postedBy}</span>
            </div>
        </div>
    `).join('');
}

// ================= ADMIN DASHBOARD =================

async function fetchAdminData() {
    try {
        const [resCourses, resStaff, resAnnouncements] = await Promise.all([
            fetch('/api/courses'),
            fetch('/api/staff'),
            fetch('/api/announcements')
        ]);
        allCourses = await resCourses.json();
        allStaff = await resStaff.json();
        allAnnouncements = await resAnnouncements.json();
        
        renderAdminCourses();
        renderAdminStaff();
        renderAdminAnnouncements();
    } catch (err) {
        console.error('Failed to fetch admin data', err);
    }
}

// Admin Courses
function renderAdminCourses() {
    const tbody = document.getElementById('admin-courses-tbody');
    tbody.innerHTML = allCourses.map(c => `
        <tr>
            <td>${c.code}</td>
            <td>${c.title}</td>
            <td>${c.credits}</td>
            <td>${c.instructor}</td>
            <td>
                <button class="action-btn edit" onclick="editCourseBtn(${c.id})">Edit</button>
                <button class="action-btn delete" onclick="deleteCourseBtn(${c.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function saveCourse(e) {
    e.preventDefault();
    const id = document.getElementById('course-id').value;
    
    const payload = {
        title: document.getElementById('course-title').value,
        code: document.getElementById('course-code').value,
        department: document.getElementById('course-dept').value,
        prerequisites: document.getElementById('course-prereq').value,
        description: document.getElementById('course-desc').value,
        icon: document.getElementById('course-icon').value,
        instructor: document.getElementById('course-instructor').value,
        credits: parseInt(document.getElementById('course-credits').value) || 3,
        schedule: document.getElementById('course-schedule').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/courses/${id}` : '/api/courses';

    try {
        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        resetCourseForm();
        fetchAdminData();
    } catch (err) {
        console.error('Failed to save course', err);
    }
}

function editCourseBtn(id) {
    const c = allCourses.find(c => c.id === id);
    if (!c) return;
    
    document.getElementById('course-id').value = c.id;
    document.getElementById('course-title').value = c.title;
    document.getElementById('course-code').value = c.code || '';
    document.getElementById('course-dept').value = c.department || '';
    document.getElementById('course-prereq').value = c.prerequisites || '';
    document.getElementById('course-desc').value = c.description;
    document.getElementById('course-icon').value = c.icon;
    document.getElementById('course-instructor').value = c.instructor;
    document.getElementById('course-credits').value = c.credits;
    document.getElementById('course-schedule').value = c.schedule;
    
    document.getElementById('course-submit-btn').textContent = 'Update Course';
    document.getElementById('course-cancel-btn').style.display = 'inline-block';
}

function resetCourseForm() {
    document.getElementById('course-form').reset();
    document.getElementById('course-id').value = '';
    document.getElementById('course-submit-btn').textContent = 'Add Course';
    document.getElementById('course-cancel-btn').style.display = 'none';
}

async function deleteCourseBtn(id) {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
        await fetch(`/api/courses/${id}`, { method: 'DELETE' });
        fetchAdminData();
    } catch (err) {
        console.error('Failed to delete course', err);
    }
}

// Admin Staff
function renderAdminStaff() {
    const tbody = document.getElementById('admin-staff-tbody');
    tbody.innerHTML = allStaff.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.role}</td>
            <td>${s.department}</td>
            <td>
                <button class="action-btn edit" onclick="editStaffBtn(${s.id})">Edit</button>
                <button class="action-btn delete" onclick="deleteStaffBtn(${s.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function saveStaff(e) {
    e.preventDefault();
    const id = document.getElementById('staff-id').value;
    
    const payload = {
        name: document.getElementById('staff-name').value,
        role: document.getElementById('staff-role').value,
        department: document.getElementById('staff-dept').value,
        email: document.getElementById('staff-email').value,
        office_hours: document.getElementById('staff-office').value,
        contact: document.getElementById('staff-contact').value,
        assigned_courses: document.getElementById('staff-courses').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/staff/${id}` : '/api/staff';

    try {
        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        resetStaffForm();
        fetchAdminData();
    } catch (err) {
        console.error('Failed to save staff', err);
    }
}

function editStaffBtn(id) {
    const s = allStaff.find(s => s.id === id);
    if (!s) return;
    
    document.getElementById('staff-id').value = s.id;
    document.getElementById('staff-name').value = s.name;
    document.getElementById('staff-role').value = s.role;
    document.getElementById('staff-dept').value = s.department || '';
    document.getElementById('staff-email').value = s.email || '';
    document.getElementById('staff-office').value = s.office_hours || '';
    document.getElementById('staff-contact').value = s.contact || '';
    document.getElementById('staff-courses').value = s.assigned_courses || '';
    
    document.getElementById('staff-submit-btn').textContent = 'Update Staff';
    document.getElementById('staff-cancel-btn').style.display = 'inline-block';
}

function resetStaffForm() {
    document.getElementById('staff-form').reset();
    document.getElementById('staff-id').value = '';
    document.getElementById('staff-submit-btn').textContent = 'Add Staff';
    document.getElementById('staff-cancel-btn').style.display = 'none';
}

async function deleteStaffBtn(id) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
        await fetch(`/api/staff/${id}`, { method: 'DELETE' });
        fetchAdminData();
    } catch (err) {
        console.error('Failed to delete staff', err);
    }
}

// Admin Announcements
function renderAdminAnnouncements() {
    const tbody = document.getElementById('admin-announcements-tbody');
    tbody.innerHTML = allAnnouncements.map(a => `
        <tr>
            <td>${new Date(a.date).toLocaleDateString()}</td>
            <td>${a.title}</td>
            <td>${a.postedBy}</td>
            <td>
                <button class="action-btn delete" onclick="deleteAnnouncementBtn(${a.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function saveAnnouncement(e) {
    e.preventDefault();
    const payload = {
        title: document.getElementById('announcement-title').value,
        body: document.getElementById('announcement-body').value,
        postedBy: currentUser.username
    };

    try {
        await fetch('/api/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        document.getElementById('announcement-form').reset();
        fetchAdminData();
    } catch (err) {
        console.error('Failed to save announcement', err);
    }
}

async function deleteAnnouncementBtn(id) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
        await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
        fetchAdminData();
    } catch (err) {
        console.error('Failed to delete announcement', err);
    }
}
