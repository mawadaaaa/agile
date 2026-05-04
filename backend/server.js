const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory databases
const users = [
    { username: 'admin', password: '123', role: 'admin' },
    { username: 'student', password: '123', role: 'student' }
];

const courses = [
    { id: 1, title: 'Software Engineering', code: 'CS301', department: 'Computer Science', prerequisites: 'CS201', description: 'Learn the fundamentals of the software development life cycle, agile methodologies, and project management.', icon: '💻', instructor: 'Dr. Alice Smith', credits: 3, schedule: 'Mon/Wed 10:00 AM' },
    { id: 2, title: 'Data Structures', code: 'CS201', department: 'Computer Science', prerequisites: 'CS101', description: 'Deep dive into trees, graphs, sorting algorithms, and dynamic programming techniques.', icon: '🌳', instructor: 'Prof. John Doe', credits: 4, schedule: 'Tue/Thu 1:00 PM' },
    { id: 3, title: 'Web Development', code: 'IT205', department: 'Information Technology', prerequisites: 'None', description: 'Master HTML, CSS, and modern JavaScript to build interactive user interfaces.', icon: '🌐', instructor: 'Jane Developer', credits: 3, schedule: 'Mon/Wed 2:00 PM' },
    { id: 4, title: 'Database Systems', code: 'CS305', department: 'Computer Science', prerequisites: 'CS201', description: 'Introduction to relational algebra, SQL, and robust database design principles.', icon: '🗄️', instructor: 'Dr. Data', credits: 3, schedule: 'Fri 9:00 AM' },
    { id: 5, title: 'Artificial Intelligence', code: 'CS401', department: 'Computer Science', prerequisites: 'CS201, MATH201', description: 'Explore machine learning, neural networks, and natural language processing concepts.', icon: '🤖', instructor: 'Dr. Turing', credits: 4, schedule: 'Tue/Thu 10:00 AM' },
    { id: 6, title: 'Cybersecurity Basics', code: 'IT301', department: 'Information Technology', prerequisites: 'IT201', description: 'Learn about encryption, network security, and common vulnerabilities in modern systems.', icon: '🛡️', instructor: 'Bob Hacker', credits: 3, schedule: 'Mon 3:00 PM' }
];

const staff = [
    { id: 1, name: 'Dr. Alice Smith', role: 'Professor', department: 'Software Engineering', email: 'alice.smith@ums.edu', office_hours: 'Mon 1-3 PM', contact: 'Room 401', assigned_courses: 'Software Engineering' },
    { id: 2, name: 'Prof. John Doe', role: 'Professor', department: 'Computer Science', email: 'john.doe@ums.edu', office_hours: 'Tue 10-12 AM', contact: 'Room 305', assigned_courses: 'Data Structures' },
    { id: 3, name: 'Jane Developer', role: 'Teaching Assistant', department: 'Web Technologies', email: 'jane.dev@ums.edu', office_hours: 'Wed 3-5 PM', contact: 'Lab 2', assigned_courses: 'Web Development' }
];

let courseIdCounter = 7;
let staffIdCounter = 4;
let announcementIdCounter = 1;

const announcements = [];

// 1. User Registration & Login (AGILE-30)
app.post('/api/register', (req, res) => {
    const { username, password, role } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    const newUser = { username, password, role: role || 'student' };
    users.push(newUser);
    res.json({ message: 'Registration successful', user: { username: newUser.username, role: newUser.role } });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', user: { username: user.username, role: user.role } });
});

// 2 & 3. View & Manage Course Catalog (AGILE-7, AGILE-27)
app.get('/api/courses', (req, res) => {
    res.json(courses);
});

app.post('/api/courses', (req, res) => {
    const { title, code, department, prerequisites, description, icon, instructor, credits, schedule } = req.body;
    const newCourse = { 
        id: courseIdCounter++, 
        title, 
        code: code || '',
        department: department || '',
        prerequisites: prerequisites || '',
        description, 
        icon: icon || '📚', 
        instructor: instructor || 'TBA', 
        credits: credits || 3, 
        schedule: schedule || 'TBA' 
    };
    courses.push(newCourse);
    res.json(newCourse);
});

app.put('/api/courses/:id', (req, res) => {
    const courseId = parseInt(req.params.id);
    const index = courses.findIndex(c => c.id === courseId);
    if (index === -1) return res.status(404).json({ error: 'Course not found' });
    
    courses[index] = { ...courses[index], ...req.body };
    res.json(courses[index]);
});

app.delete('/api/courses/:id', (req, res) => {
    const courseId = parseInt(req.params.id);
    const index = courses.findIndex(c => c.id === courseId);
    if (index === -1) return res.status(404).json({ error: 'Course not found' });
    
    courses.splice(index, 1);
    res.json({ message: 'Course deleted' });
});

// 4. Manage Staff Profiles (AGILE-28)
app.get('/api/staff', (req, res) => {
    res.json(staff);
});

app.post('/api/staff', (req, res) => {
    const { name, role, department, email, office_hours, contact, assigned_courses } = req.body;
    const newStaff = { 
        id: staffIdCounter++, 
        name, 
        role, 
        department,
        email: email || '',
        office_hours: office_hours || '',
        contact: contact || '',
        assigned_courses: assigned_courses || ''
    };
    staff.push(newStaff);
    res.json(newStaff);
});

app.put('/api/staff/:id', (req, res) => {
    const staffId = parseInt(req.params.id);
    const index = staff.findIndex(s => s.id === staffId);
    if (index === -1) return res.status(404).json({ error: 'Staff not found' });
    
    staff[index] = { ...staff[index], ...req.body };
    res.json(staff[index]);
});

app.delete('/api/staff/:id', (req, res) => {
    const staffId = parseInt(req.params.id);
    const index = staff.findIndex(s => s.id === staffId);
    if (index === -1) return res.status(404).json({ error: 'Staff not found' });
    
    staff.splice(index, 1);
    res.json({ message: 'Staff deleted' });
});

// 5. Post Announcements (AGILE-21)
app.get('/api/announcements', (req, res) => {
    // Sort announcements by date, newest first
    const sorted = [...announcements].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(sorted);
});

app.post('/api/announcements', (req, res) => {
    const { title, body, postedBy } = req.body;
    const newAnnouncement = {
        id: announcementIdCounter++,
        title,
        body,
        date: new Date().toISOString(),
        postedBy: postedBy || 'Admin'
    };
    announcements.push(newAnnouncement);
    res.json(newAnnouncement);
});

app.delete('/api/announcements/:id', (req, res) => {
    const announcementId = parseInt(req.params.id);
    const index = announcements.findIndex(a => a.id === announcementId);
    if (index === -1) return res.status(404).json({ error: 'Announcement not found' });
    
    announcements.splice(index, 1);
    res.json({ message: 'Announcement deleted' });
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
