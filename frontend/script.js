let currentUser = null;
let allCourses = []; 
let allStaff = [];
let allAnnouncements = [];
let allSchedules = [];
let currentChatUser = null;
let chatInterval = null;

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
    
    // Role-based Navigation
    if (user.role === 'admin') {
        document.getElementById('nav-admin').style.display = 'inline-block';
        document.getElementById('nav-my-courses').style.display = 'none';
        if (document.getElementById('enrollment-requests-panel')) document.getElementById('enrollment-requests-panel').style.display = 'block';
        if (document.getElementById('admin-gradebook-section')) document.getElementById('admin-gradebook-section').style.display = 'none';
    } else if (user.role === 'student') {
        document.getElementById('nav-admin').style.display = 'none';
        document.getElementById('nav-my-courses').style.display = 'inline-block';
    } else if (user.role === 'professor' || user.role === 'Teaching Assistant') {
        document.getElementById('nav-admin').style.display = 'inline-block';
        document.getElementById('nav-admin').textContent = 'Professor Dashboard';
        document.getElementById('nav-my-courses').style.display = 'none';
        if (document.getElementById('admin-gradebook-section')) document.getElementById('admin-gradebook-section').style.display = 'block';
        if (document.getElementById('enrollment-requests-panel')) document.getElementById('enrollment-requests-panel').style.display = 'none';
    } else {
        document.getElementById('nav-admin').style.display = 'none';
        document.getElementById('nav-my-courses').style.display = 'none';
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
    document.getElementById('timetable-view').style.display = 'none';
    document.getElementById('admin-view').style.display = 'none';
    document.getElementById('messages-view').style.display = 'none';
    if (document.getElementById('my-courses-view')) document.getElementById('my-courses-view').style.display = 'none';
    
    if (viewId === 'my-courses') {
        document.getElementById('my-courses-view').style.display = 'flex';
        fetchMyCourses();
        return;
    }

    document.getElementById(`${viewId}-view`).style.display = 'block';
    
    if (viewId === 'courses') fetchCourses();
    if (viewId === 'staff-dir') fetchStaffDir();
    if (viewId === 'announcements') fetchAnnouncements();
    if (viewId === 'timetable') fetchTimetable();
    if (viewId === 'admin') fetchAdminData();
    if (viewId === 'messages') {
        initChatView();
    } else {
        clearInterval(chatInterval);
        chatInterval = null;
    }
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

async function openCourseModal(courseId) {
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

    // Enrollment section
    const enrollSection = document.getElementById('enroll-section');
    const enrollBtn = document.getElementById('enroll-btn');
    const enrollMsg = document.getElementById('enroll-msg');
    enrollMsg.textContent = '';
    
    if (currentUser.role === 'student') {
        enrollSection.style.display = 'block';
        try {
            const res = await fetch(`/api/my-courses/${currentUser.username}`);
            const myCourses = await res.json();
            const existing = myCourses.find(c => c.id === courseId);
            if (existing) {
                enrollBtn.disabled = true;
                enrollBtn.style.background = '#94a3b8';
                enrollBtn.textContent = `Already Requested (${existing.enrollmentStatus.toUpperCase()})`;
            } else {
                enrollBtn.disabled = false;
                enrollBtn.style.background = '';
                enrollBtn.textContent = 'Request Enrollment';
                enrollBtn.onclick = () => enrollInCourse(course.id);
            }
        } catch (e) {
            enrollBtn.onclick = () => enrollInCourse(course.id);
        }
    } else {
        enrollSection.style.display = 'none';
    }

    document.getElementById('course-modal').style.display = 'flex';
}

async function enrollInCourse(courseId) {
    try {
        const res = await fetch('/api/enroll/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username, courseId })
        });
        const data = await res.json();
        const msgEl = document.getElementById('enroll-msg');
        if (!res.ok) {
            msgEl.style.color = '#ef4444';
            msgEl.textContent = data.error;
        } else {
            msgEl.style.color = '#22c55e';
            msgEl.textContent = 'Request sent!';
            setTimeout(closeModal, 1500);
        }
    } catch (err) {
        console.error('Enrollment error', err);
    }
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
        renderStaffGrid(allStaff);
    } catch (err) {
        console.error('Failed to fetch staff', err);
    }
}

function renderStaffGrid(staff) {
    const grid = document.getElementById('staff-dir-grid');
    grid.innerHTML = staff.map(s => `
        <div class="course-card" onclick="openStaffModal(${s.id})" style="cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                <div style="font-size: 2.5em; background: #e2e8f0; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">👤</div>
                <div>
                    <h4 style="margin: 0; color: #0f172a;">${s.name}</h4>
                    <span style="font-size: 0.9em; color: #3b82f6; font-weight: 600;">${s.role}</span>
                </div>
            </div>
            <p style="margin-bottom: 5px; color: #475569;"><strong>Dept:</strong> ${s.department}</p>
            <div style="font-size: 0.9em; color: #64748b; margin-bottom: 15px; flex-grow: 1;">
                <div>📧 ${s.email || 'N/A'}</div>
            </div>
        </div>
    `).join('');
}

function filterStaff() {
    const query = document.getElementById('staff-search').value.toLowerCase();
    const filtered = allStaff.filter(s => 
        s.name.toLowerCase().includes(query) || 
        (s.department && s.department.toLowerCase().includes(query))
    );
    renderStaffGrid(filtered);
}

async function openStaffModal(staffId) {
    try {
        // Fetch single staff by ID from backend as required
        const res = await fetch(`/api/staff/${staffId}`);
        if (!res.ok) throw new Error('Staff member not found');
        const s = await res.json();

        document.getElementById('staff-modal-name').textContent = s.name;
        document.getElementById('staff-modal-role').textContent = s.role;
        document.getElementById('staff-modal-department').textContent = s.department || 'N/A';
        document.getElementById('staff-modal-email').textContent = s.email || 'N/A';
        document.getElementById('staff-modal-office').textContent = s.office_hours || 'N/A';
        document.getElementById('staff-modal-contact').textContent = s.contact || 'N/A';
        
        // Render assigned courses
        const coursesContainer = document.getElementById('staff-modal-courses');
        if (s.assigned_courses) {
            const courseList = s.assigned_courses.split(',').map(c => c.trim());
            coursesContainer.innerHTML = courseList.map(c => `<span onclick="openCourseFromStaff('${c.replace(/'/g, "\\'")}')" style="display: inline-block; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 0.85em; color: #3b82f6; cursor: pointer; text-decoration: underline; font-weight: 500;">📚 ${c}</span>`).join('');
        } else {
            coursesContainer.innerHTML = '<span style="color: #94a3b8; font-style: italic;">None assigned</span>';
        }

        document.getElementById('staff-modal').style.display = 'flex';
    } catch (err) {
        console.error('Failed to load staff details', err);
        alert('Could not load staff details. Please try again.');
    }
}

async function openCourseFromStaff(title) {
    if (allCourses.length === 0) {
        const res = await fetch('/api/courses');
        allCourses = await res.json();
    }
    const course = allCourses.find(c => c.title.toLowerCase() === title.toLowerCase() || c.code.toLowerCase() === title.toLowerCase());
    if (course) {
        document.getElementById('staff-modal').style.display = 'none';
        openCourseModal(course.id);
    } else {
        alert('Course details not found for: ' + title);
    }
}

function closeStaffModal(event) {
    if (event && event.target.id !== 'staff-modal') return;
    document.getElementById('staff-modal').style.display = 'none';
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

// ================= TIMETABLE VIEW =================

async function fetchTimetable() {
    try {
        const res = await fetch('/api/schedules');
        allSchedules = await res.json();
        filterTimetable();
    } catch (err) {
        console.error('Failed to fetch schedules', err);
    }
}

function filterTimetable() {
    const room = document.getElementById('timetable-filter-room').value;
    const day = document.getElementById('timetable-filter-day').value;
    
    const filtered = allSchedules.filter(s => {
        return (room === '' || s.room === room) && (day === '' || s.day === day);
    });
    
    renderTimetable(filtered);
}

function renderTimetable(schedules) {
    const tbody = document.getElementById('timetable-tbody');
    tbody.innerHTML = schedules.map(s => `
        <tr>
            <td>${s.room}</td>
            <td>${s.course}</td>
            <td>${s.day}</td>
            <td>${s.timeSlot}</td>
        </tr>
    `).join('');
}

// ================= ADMIN DASHBOARD =================

async function fetchAdminData() {
    try {
        const [resCourses, resStaff, resAnnouncements, resSchedules] = await Promise.all([
            fetch('/api/courses'),
            fetch('/api/staff'),
            fetch('/api/announcements'),
            fetch('/api/schedules')
        ]);
        allCourses = await resCourses.json();
        allStaff = await resStaff.json();
        allAnnouncements = await resAnnouncements.json();
        allSchedules = await resSchedules.json();
        
        updateScheduleCourseDropdown();
        
        renderAdminCourses();
        renderAdminStaff();
        renderAdminAnnouncements();
        renderAdminSchedules();
        
        if (currentUser.role === 'admin') fetchEnrollmentRequests();
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

// Admin Schedules
function updateScheduleCourseDropdown() {
    const select = document.getElementById('schedule-course');
    const gradeSelect = document.getElementById('grade-course');
    const options = '<option value="" disabled selected>Select Course</option>' + 
        allCourses.map(c => `<option value="${c.id}">[${c.code}] ${c.title}</option>`).join('');
    
    if (select) select.innerHTML = options;
    if (gradeSelect) gradeSelect.innerHTML = options;
}

function renderAdminSchedules() {
    const tbody = document.getElementById('admin-schedules-tbody');
    tbody.innerHTML = allSchedules.map(s => `
        <tr>
            <td>${s.room}</td>
            <td>${s.course}</td>
            <td>${s.day}</td>
            <td>${s.timeSlot}</td>
            <td>
                <button class="action-btn edit" onclick="editScheduleBtn(${s.id})">Edit</button>
                <button class="action-btn delete" onclick="deleteScheduleBtn(${s.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function saveSchedule(e) {
    e.preventDefault();
    const id = document.getElementById('schedule-id').value;
    const errorDiv = document.getElementById('schedule-error');
    errorDiv.textContent = '';
    
    const payload = {
        room: document.getElementById('schedule-room').value,
        course: document.getElementById('schedule-course').value,
        day: document.getElementById('schedule-day').value,
        timeSlot: document.getElementById('schedule-time').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/schedules/${id}` : '/api/schedules';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (!res.ok) {
            errorDiv.textContent = data.error || 'Failed to save schedule';
            return;
        }
        
        resetScheduleForm();
        fetchAdminData();
    } catch (err) {
        console.error('Failed to save schedule', err);
        errorDiv.textContent = 'An error occurred';
    }
}

function editScheduleBtn(id) {
    const s = allSchedules.find(s => s.id === id);
    if (!s) return;
    
    document.getElementById('schedule-id').value = s.id;
    document.getElementById('schedule-room').value = s.room;
    document.getElementById('schedule-course').value = s.course;
    document.getElementById('schedule-day').value = s.day;
    document.getElementById('schedule-time').value = s.timeSlot;
    
    document.getElementById('schedule-submit-btn').textContent = 'Update Schedule';
    document.getElementById('schedule-cancel-btn').style.display = 'inline-block';
    document.getElementById('schedule-error').textContent = '';
}

function resetScheduleForm() {
    document.getElementById('schedule-form').reset();
    document.getElementById('schedule-id').value = '';
    document.getElementById('schedule-submit-btn').textContent = 'Add Schedule';
    document.getElementById('schedule-cancel-btn').style.display = 'none';
    document.getElementById('schedule-error').textContent = '';
}

async function deleteScheduleBtn(id) {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
        await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
        fetchAdminData();
    } catch (err) {
        console.error('Failed to delete schedule', err);
    }
}

// ================= CHAT SYSTEM =================

async function initChatView() {
    await fetchStaffDir(); // Ensure we have staff list
    renderChatSidebar();
    
    if (chatInterval) clearInterval(chatInterval);
    chatInterval = setInterval(() => {
        if (currentChatUser) fetchMessages();
        renderChatSidebar();
    }, 3000);
}

async function renderChatSidebar() {
    try {
        const [convsRes, usersRes] = await Promise.all([
            fetch(`/api/messages/conversations/${currentUser.username}`),
            fetch('/api/users')
        ]);
        
        const activeChats = await convsRes.json();
        const allUsers = await usersRes.json();
        
        // Render Active Chats
        const convList = document.getElementById('conversations-list');
        if (activeChats.length === 0) {
            convList.innerHTML = '<div style="font-size: 0.85em; color: #94a3b8; padding: 10px;">No active conversations</div>';
        } else {
            convList.innerHTML = activeChats.map(chatInfo => `
                <div class="chat-list-item ${currentChatUser === chatInfo.username ? 'active' : ''}" onclick="startChat('${chatInfo.username}')">
                    <div style="background: #e2e8f0; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8em;">👤</div>
                    <span>${chatInfo.username}</span>
                    ${chatInfo.unreadCount > 0 && currentChatUser !== chatInfo.username ? `<span class="unread-badge">${chatInfo.unreadCount}</span>` : ''}
                </div>
            `).join('');
        }

        // Render User Directory Grouped by Role
        const directoryContainer = document.getElementById('chat-staff-list');
        const grouped = allUsers.reduce((acc, user) => {
            if (user.username === currentUser.username) return acc;
            if (!acc[user.role]) acc[user.role] = [];
            acc[user.role].push(user);
            return acc;
        }, {});

        let directoryHTML = '';
        for (const role in grouped) {
            directoryHTML += `<div style="font-size: 0.75em; color: #64748b; font-weight: 700; text-transform: uppercase; margin: 15px 0 5px 0; letter-spacing: 0.5px;">${role}s</div>`;
            directoryHTML += grouped[role].map(u => `
                <div class="chat-list-item ${currentChatUser === u.username ? 'active' : ''}" onclick="startChat('${u.username}')">
                    <div style="background: #e2e8f0; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8em;">
                        ${u.role === 'student' ? '🎓' : '👨‍🏫'}
                    </div>
                    <span style="font-size: 0.9em;">${u.username}</span>
                </div>
            `).join('');
        }
        
        directoryContainer.innerHTML = directoryHTML || '<div style="font-size: 0.85em; color: #94a3b8; padding: 10px;">No other users found</div>';
    } catch (err) {
        console.error('Failed to render chat sidebar', err);
    }
}

async function startChat(username) {
    currentChatUser = username;
    document.getElementById('chat-with-name').textContent = `Chatting with ${username}`;
    document.getElementById('chat-form').style.display = 'flex';
    document.getElementById('chat-messages').innerHTML = '<div class="empty-chat">Loading messages...</div>';
    
    // Mark messages as read
    try {
        await fetch('/api/messages/read', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentUser: currentUser.username, chatUser: username })
        });
    } catch (err) {
        console.error('Failed to mark messages as read', err);
    }
    
    renderChatSidebar();
    await fetchMessages();
}

async function fetchMessages() {
    if (!currentChatUser) return;
    
    try {
        const res = await fetch(`/api/messages?user1=${currentUser.username}&user2=${currentChatUser}`);
        const messages = await res.json();
        renderMessages(messages);
    } catch (err) {
        console.error('Failed to fetch messages', err);
    }
}

function renderMessages(messages) {
    const container = document.getElementById('chat-messages');
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;

    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-chat">No messages yet. Say hi!</div>';
        return;
    }

    container.innerHTML = messages.map(m => {
        const isSent = m.sender === currentUser.username;
        const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="message-bubble ${isSent ? 'sent' : 'received'}">
                <div>${m.text}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }).join('');

    if (isAtBottom) {
        container.scrollTop = container.scrollHeight;
    }
}

async function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !currentChatUser) return;

    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: currentUser.username,
                receiver: currentChatUser,
                text: text
            })
        });
        
        if (res.ok) {
            input.value = '';
            await fetchMessages();
        }
    } catch (err) {
        console.error('Failed to send message', err);
    }
}
async function fetchEnrollmentRequests() {
    try {
        const res = await fetch('/api/enroll/requests');
        const requests = await res.json();
        renderEnrollmentRequests(requests);
    } catch (err) {
        console.error('Failed to fetch enrollment requests', err);
    }
}

function renderEnrollmentRequests(requests) {
    const tbody = document.getElementById('admin-enrollments-tbody');
    if (!tbody) return;
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px;">No pending requests</td></tr>';
        return;
    }

    tbody.innerHTML = requests.map(r => `
        <tr>
            <td>${r.username}</td>
            <td>${r.courseCode}</td>
            <td>${r.courseTitle}</td>
            <td>${new Date(r.date).toLocaleDateString()}</td>
            <td>
                <button class="action-btn edit" onclick="approveRequest(${r.id})">Approve</button>
                <button class="action-btn delete" onclick="rejectRequest(${r.id})">Reject</button>
            </td>
        </tr>
    `).join('');
}

async function approveRequest(id) {
    try {
        await fetch(`/api/enroll/approve/${id}`, { method: 'PUT' });
        fetchEnrollmentRequests();
    } catch (err) {
        console.error('Failed to approve request', err);
    }
}

async function rejectRequest(id) {
    try {
        await fetch(`/api/enroll/reject/${id}`, { method: 'PUT' });
        fetchEnrollmentRequests();
    } catch (err) {
        console.error('Failed to reject request', err);
    }
}

// Student Course View
async function fetchMyCourses() {
    try {
        const [courseRes, gradeRes] = await Promise.all([
            fetch(`/api/my-courses/${currentUser.username}`),
            fetch(`/api/grades/${currentUser.username}`)
        ]);
        const myCourses = await courseRes.json();
        const myGrades = await gradeRes.json();
        
        renderMyCourses(myCourses, myGrades);
    } catch (err) {
        console.error('Failed to fetch user data', err);
    }
}

function renderMyCourses(myCourses, myGrades) {
    const grid = document.getElementById('my-courses-grid');
    if (grid) {
        grid.innerHTML = myCourses.map(c => `
            <div class="course-card">
                <div class="card-icon">${c.icon}</div>
                <h4>[${c.code}] ${c.title}</h4>
                <p>Instructor: ${c.instructor}</p>
                <div class="card-footer">
                    <span class="status-badge ${c.enrollmentStatus.toLowerCase()}" style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 700; background: ${c.enrollmentStatus === 'approved' ? '#22c55e22' : c.enrollmentStatus === 'rejected' ? '#ef444422' : '#eab30822'}; color: ${c.enrollmentStatus === 'approved' ? '#22c55e' : c.enrollmentStatus === 'rejected' ? '#ef4444' : '#eab308'};">
                        ${c.enrollmentStatus.toUpperCase()}
                    </span>
                </div>
            </div>
        `).join('');
    }

    const gradesTbody = document.getElementById('my-grades-tbody');
    if (gradesTbody) {
        if (myGrades.length === 0) {
            gradesTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:10px;">No grades recorded yet</td></tr>';
        } else {
            gradesTbody.innerHTML = myGrades.map(g => {
                const course = allCourses.find(c => c.id === g.courseId);
                return `
                    <tr>
                        <td>${course ? course.title : 'Unknown'}</td>
                        <td>${g.taskName}</td>
                        <td><strong>${g.grade}</strong></td>
                        <td>${g.feedback}</td>
                    </tr>
                `;
            }).join('');
        }
    }
}

function closeMyCoursesView() {
    document.getElementById('my-courses-view').style.display = 'none';
}

// Gradebook for Professors
async function saveGrade(e) {
    e.preventDefault();
    const payload = {
        username: document.getElementById('grade-student').value,
        courseId: document.getElementById('grade-course').value,
        taskName: document.getElementById('grade-task').value,
        grade: document.getElementById('grade-score').value,
        feedback: document.getElementById('grade-feedback').value
    };

    try {
        const res = await fetch('/api/grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            alert('Grade submitted successfully');
            document.getElementById('grade-form').reset();
        } else {
            const data = await res.json();
            alert('Error: ' + data.error);
        }
    } catch (err) {
        console.error('Failed to submit grade', err);
    }
}
