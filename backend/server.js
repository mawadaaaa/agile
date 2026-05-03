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
]; // { username, password, role: 'admin' | 'student' }
const courses = [
    { id: 1, title: 'Introduction to Software Engineering', description: 'Basic software principles.' },
    { id: 2, title: 'Data Structures', description: 'Learn about trees, graphs, and arrays.' }
];
const staff = [
    { id: 1, name: 'Dr. Alice', role: 'Professor', department: 'CS' }
];

let courseIdCounter = 3;
let staffIdCounter = 2;

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

// 2. View Course Catalog (AGILE-7) & 3. Manage Course Catalog (AGILE-27)
app.get('/api/courses', (req, res) => {
    res.json(courses);
});

app.post('/api/courses', (req, res) => {
    const { title, description } = req.body;
    const newCourse = { id: courseIdCounter++, title, description };
    courses.push(newCourse);
    res.json(newCourse);
});

// 4. Manage Staff Profiles (AGILE-28)
app.get('/api/staff', (req, res) => {
    res.json(staff);
});

app.post('/api/staff', (req, res) => {
    const { name, role, department } = req.body;
    const newStaff = { id: staffIdCounter++, name, role, department };
    staff.push(newStaff);
    res.json(newStaff);
});

app.listen(PORT, () => {
    console.log(`Simple MVP Backend running on http://localhost:${PORT}`);
});
