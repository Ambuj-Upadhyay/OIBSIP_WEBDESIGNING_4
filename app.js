const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const users = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

function render(view, replacements = {}) {
    let layout = fs.readFileSync('./views/layout.html', 'utf-8');
    let content = fs.readFileSync(`./views/${view}.html`, 'utf-8');

    // Ensure error and username have default values
    replacements = {
        error: '',
        username: '',
        ...replacements
    };

    for (const key in replacements) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }

    return layout.replace('{{content}}', content);
}


app.get('/', (req, res) => {
    res.send(render('home'));
});

app.get('/register', (req, res) => {
    res.send(render('register'));
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.send(render('register', { error: 'User already exists.' }));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = hashedPassword;
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.send(render('login'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = users[username];
    if (!hashedPassword || !(await bcrypt.compare(password, hashedPassword))) {
        return res.send(render('login', { error: 'Invalid credentials.' }));
    }
    req.session.username = username;
    res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
    if (!req.session.username) return res.redirect('/login');
    res.send(render('dashboard', { username: req.session.username }));
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
