let currentUser = null;

function switchAuthTab(tab) {
    document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('tab-login').classList.toggle('active-tab', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active-tab', tab === 'register');
    document.getElementById('auth-error').textContent = '';
}

// 1. Auth (AGILE-30)
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
    
    // Toggle Admin controls
    if (user.role === 'admin') {
        document.getElementById('admin-course-controls').style.display = 'block';
        document.getElementById('nav-staff').style.display = 'inline-block';
    } else {
        document.getElementById('admin-course-controls').style.display = 'none';
        document.getElementById('nav-staff').style.display = 'none';
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
    document.getElementById('staff-view').style.display = 'none';
    document.getElementById(`${viewId}-view`).style.display = 'block';
    
    if (viewId === 'courses') fetchCourses();
    if (viewId === 'staff') fetchStaff();
}

// 2 & 3. Courses (AGILE-7, AGILE-27)
async function fetchCourses() {
    try {
        const res = await fetch('/api/courses');
        const courses = await res.json();
        const list = document.getElementById('courses-list');
        list.innerHTML = courses.map(c => `<li><strong>${c.title}</strong>${c.description}</li>`).join('');
    } catch (err) {
        console.error('Failed to fetch courses', err);
    }
}

async function addCourse() {
    const title = document.getElementById('course-title').value;
    const description = document.getElementById('course-desc').value;
    if (!title) return;
    
    try {
        await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });
        
        document.getElementById('course-title').value = '';
        document.getElementById('course-desc').value = '';
        fetchCourses();
    } catch (err) {
        console.error('Failed to add course', err);
    }
}

// 4. Staff (AGILE-28)
async function fetchStaff() {
    try {
        const res = await fetch('/api/staff');
        const staff = await res.json();
        const list = document.getElementById('staff-list');
        list.innerHTML = staff.map(s => `<li><strong>${s.name}</strong>${s.role} - ${s.department}</li>`).join('');
    } catch (err) {
        console.error('Failed to fetch staff', err);
    }
}

async function addStaff() {
    const name = document.getElementById('staff-name').value;
    const role = document.getElementById('staff-role').value;
    const department = document.getElementById('staff-dept').value;
    if (!name) return;
    
    try {
        await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, role, department })
        });
        
        document.getElementById('staff-name').value = '';
        document.getElementById('staff-role').value = '';
        document.getElementById('staff-dept').value = '';
        fetchStaff();
    } catch (err) {
        console.error('Failed to add staff', err);
    }
}
