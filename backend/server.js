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
    { username: 'student', password: '123', role: 'student' },
    { username: 'Dr. Alice Smith', password: '123', role: 'professor' },
    { username: 'Prof. John Doe', password: '123', role: 'professor' },
    { username: 'Jane Developer', password: '123', role: 'Teaching Assistant' }
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
let scheduleIdCounter = 1;

const announcements = [];
const schedules = [];

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

app.get('/api/users', (req, res) => {
    // Return users excluding admin and without passwords
    const filteredUsers = users
        .filter(u => u.role !== 'admin')
        .map(u => ({ username: u.username, role: u.role }));
    res.json(filteredUsers);
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

app.get('/api/staff/:id', (req, res) => {
    const staffId = parseInt(req.params.id);
    const s = staff.find(s => s.id === staffId);
    if (!s) return res.status(404).json({ error: 'Staff not found' });
    res.json(s);
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

// 6. Schedule Classes (AGILE-32)
app.get('/api/schedules', (req, res) => {
    res.json(schedules);
});

app.post('/api/schedules', (req, res) => {
    const { room, course, day, timeSlot } = req.body;

    // Conflict check
    const conflict = schedules.find(s => s.room === room && s.day === day && s.timeSlot === timeSlot);
    if (conflict) {
        return res.status(400).json({ error: 'Room is already booked at that time.' });
    }

    const newSchedule = {
        id: scheduleIdCounter++,
        room,
        course,
        day,
        timeSlot
    };
    schedules.push(newSchedule);
    res.json(newSchedule);
});

app.put('/api/schedules/:id', (req, res) => {
    const scheduleId = parseInt(req.params.id);
    const index = schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) return res.status(404).json({ error: 'Schedule not found' });

    const { room, course, day, timeSlot } = req.body;

    // Conflict check
    const conflict = schedules.find(s => s.id !== scheduleId && s.room === room && s.day === day && s.timeSlot === timeSlot);
    if (conflict) {
        return res.status(400).json({ error: 'Room is already booked at that time.' });
    }

    schedules[index] = { ...schedules[index], room, course, day, timeSlot };
    res.json(schedules[index]);
});

app.delete('/api/schedules/:id', (req, res) => {
    const scheduleId = parseInt(req.params.id);
    const index = schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) return res.status(404).json({ error: 'Schedule not found' });

    schedules.splice(index, 1);
    res.json({ message: 'Schedule deleted' });
});

// 7. Messaging (AGILE-Chat)
const messages = [];
let messageIdCounter = 1;

app.get('/api/messages', (req, res) => {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
        // If no specific conversation requested, maybe return all for user?
        // For now, require both for a simple 1:1 chat view
        return res.status(400).json({ error: 'Usernames user1 and user2 are required' });
    }

    const filtered = messages.filter(m =>
        (m.sender === user1 && m.receiver === user2) ||
        (m.sender === user2 && m.receiver === user1)
    );
    res.json(filtered);
});

app.post('/api/messages', (req, res) => {
    const { sender, receiver, text } = req.body;
    if (!sender || !receiver || !text) {
        return res.status(400).json({ error: 'Sender, receiver and text are required' });
    }

    const newMessage = {
        id: messageIdCounter++,
        sender,
        receiver,
        text,
        timestamp: new Date().toISOString(),
        read: false
    };
    messages.push(newMessage);
    res.json(newMessage);
});

app.get('/api/messages/conversations/:username', (req, res) => {
    const { username } = req.params;
    const conversations = {};

    messages.forEach(m => {
        let otherUser = null;
        if (m.sender === username) otherUser = m.receiver;
        if (m.receiver === username) otherUser = m.sender;

        if (otherUser) {
            if (!conversations[otherUser]) {
                conversations[otherUser] = { username: otherUser, unreadCount: 0 };
            }
            // If the other user sent the message to us, and it's unread
            if (m.sender === otherUser && m.receiver === username && !m.read) {
                conversations[otherUser].unreadCount++;
            }
        }
    });

    res.json(Object.values(conversations));
});

app.put('/api/messages/read', (req, res) => {
    const { currentUser, chatUser } = req.body;
    if (!currentUser || !chatUser) {
        return res.status(400).json({ error: 'currentUser and chatUser are required' });
    }

    messages.forEach(m => {
        if (m.sender === chatUser && m.receiver === currentUser && !m.read) {
            m.read = true;
        }
    });

    res.json({ success: true });
});

// ================= ADMISSIONS & ENROLLMENT =================
const enrollments = [
    { id: 1, username: 'student', courseId: 1, status: 'approved', date: new Date().toISOString() },
    { id: 2, username: 'student', courseId: 2, status: 'approved', date: new Date().toISOString() },
    { id: 3, username: 'student', courseId: 3, status: 'approved', date: new Date().toISOString() }
];
const grades = [
    { id: 1, username: 'student', courseId: 1, grade: '38/100', feedback: 'skill issue', taskName: 'Midterm Exam', date: new Date().toISOString() },
    { id: 2, username: 'student', courseId: 2, grade: '85/100', feedback: 'Good effort, keep it up!', taskName: 'Assignment 1', date: new Date().toISOString() },
    { id: 3, username: 'student', courseId: 3, grade: '92/100', feedback: 'Excellent project', taskName: 'Final Project', date: new Date().toISOString() }
];
let enrollmentIdCounter = 4;

// Student requests to enroll in a course
app.post('/api/enroll/request', (req, res) => {
    const { username, courseId } = req.body;
    const course = courses.find(c => c.id === parseInt(courseId));
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const existing = enrollments.find(e => e.username === username && e.courseId === parseInt(courseId));
    if (existing) return res.status(400).json({ error: 'You have already requested enrollment for this course' });

    const newRequest = {
        id: enrollmentIdCounter++,
        username,
        courseId: parseInt(courseId),
        status: 'pending', // pending | approved | rejected
        date: new Date().toISOString()
    };
    enrollments.push(newRequest);
    res.json({ message: 'Enrollment request sent successfully', request: newRequest });
});

// Admin gets all pending requests
app.get('/api/enroll/requests', (req, res) => {
    const pending = enrollments.filter(e => e.status === 'pending').map(e => {
        const course = courses.find(c => c.id === e.courseId);
        return {
            ...e,
            courseCode: course ? course.code : 'Unknown',
            courseTitle: course ? course.title : 'Unknown'
        };
    });
    res.json(pending);
});

// Admin approves a request
app.put('/api/enroll/approve/:id', (req, res) => {
    const idx = enrollments.findIndex(e => e.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });
    enrollments[idx].status = 'approved';
    res.json(enrollments[idx]);
});

// Admin rejects a request
app.put('/api/enroll/reject/:id', (req, res) => {
    const idx = enrollments.findIndex(e => e.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });
    enrollments[idx].status = 'rejected';
    res.json(enrollments[idx]);
});

// Student views their enrolled courses (with status)
app.get('/api/my-courses/:username', (req, res) => {
    const { username } = req.params;
    const result = enrollments.filter(e => e.username === username).map(e => {
        const course = courses.find(c => c.id === e.courseId);
        return { ...course, enrollmentStatus: e.status, enrollmentId: e.id };
    });
    res.json(result);
});

// Professor submits a grade
app.post('/api/grades', (req, res) => {
    const { username, courseId, grade, feedback, taskName } = req.body;
    const newGrade = {
        id: Date.now(),
        username,
        courseId: parseInt(courseId),
        grade,
        feedback: feedback || '',
        taskName: taskName || 'General Assessment',
        date: new Date().toISOString()
    };
    grades.push(newGrade);
    res.json(newGrade);
});

// Student views their grades / transcript
app.get('/api/grades/:username', (req, res) => {
    res.json(grades.filter(g => g.username === req.params.username));
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
