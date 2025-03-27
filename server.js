const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors()); // Дозволяє запити з вашого сайту

// Налаштування сесій
app.use(session({
    secret: 'kozak-admin-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 3600000 } // 1 година
}));

// Статичні файли (HTML, CSS, JS, зображення)
app.use(express.static(path.join(__dirname)));

// Маршрути для HTML сторінок
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/catalog', (req, res) => {
    res.sendFile(path.join(__dirname, 'catalog.html'));
});

app.get('/contacts', (req, res) => {
    res.sendFile(path.join(__dirname, 'contacts.html'));
});

app.get('/kart', (req, res) => {
    res.sendFile(path.join(__dirname, 'kart.html'));
});

// Адмін-панель
app.get('/kozak', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// API для адміністратора
const adminCredentials = {
    username: 'admin',
    password: 'kozak2024'
};

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === adminCredentials.username && password === adminCredentials.password) {
        req.session.isAdmin = true;
        return res.status(200).json({ success: true });
    }
    
    res.status(401).json({ success: false, message: 'Невірний логін або пароль' });
});

app.get('/api/admin/check-auth', (req, res) => {
    if (req.session.isAdmin) {
        return res.status(200).json({ authenticated: true });
    }
    res.status(401).json({ authenticated: false });
});

app.post('/api/admin/logout', (req, res) => {
    req.session.isAdmin = false;
    res.status(200).json({ success: true });
});

// Налаштування транспортера для відправки email
const transporter = nodemailer.createTransport({
    service: 'gmail', // Використовуйте Gmail або інший сервіс
    auth: {
        user: 'your-email@gmail.com', // Замініть на ваш email
        pass: 'your-app-password' // Пароль додатку (для Gmail потрібен 2FA)
    }
});

// Маршрут для відправки email з форми контактів
app.post('/send-email', (req, res) => {
    const { name, email, subject, message } = req.body;

    // Перевірка наявності всіх полів
    if (!name || !email || !subject || !message) {
        return res.status(400).send('Будь ласка, заповніть всі поля');
    }

    const mailOptions = {
        from: `"Майстерня Сну" <your-email@gmail.com>`,
        to: 'info@maisterniasnu.ua', // Замініть на ваш робочий email
        subject: `Повідомлення з сайту: ${subject}`,
        text: `Ім'я: ${name}\nEmail: ${email}\nПовідомлення: ${message}`,
        html: `
            <h2>Нове повідомлення з сайту Майстерня Сну</h2>
            <p><strong>Ім'я:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Тема:</strong> ${subject}</p>
            <p><strong>Повідомлення:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Помилка при відправці email:', error);
            return res.status(500).send('Помилка при відправці повідомлення');
        }
        console.log('Повідомлення відправлено:', info.response);
        res.status(200).send('Дякуємо! Ваше повідомлення успішно відправлено.');
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
    console.log(`Відкрийте http://localhost:${PORT} у вашому браузері`);
});