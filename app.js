const express = require('express')
const http = require('http')
const fs = require('fs');
const path = require('path');
const dbClient = require("./db");

// const crypto = require('crypto');

// const algorithm = 'aes-256-cbc';
// const secretKey = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || "defaultsecret").digest(); // 32 байта
// const iv = Buffer.alloc(16, 0); 

const bcrypt = require('bcrypt');
const saltRounds = 10;

require('dotenv').config()
const nodemailer = require('nodemailer')

const verificationCodes = new Map();

const jwt = require("jsonwebtoken"); 

const app = express();
const server = http.createServer(app); 
app.use(express.static(path.join(__dirname, "client")));
app.use(express.json()); 

app.get("/", (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const stream = fs.createReadStream('./client/sign-in.html');
    stream.pipe(res);
}); 

app.get("/notes", (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const stream = fs.createReadStream('./client/notes_page/notes.html');
    stream.pipe(res);
}); 

app.get("/overview", (req,res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    const stream = fs.createReadStream('./client/overview/overview.html');
    stream.pipe(res);
})

app.get("/style.css", (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    const stream = fs.createReadStream('./client/style.css');
    stream.pipe(res);
});

app.get("/client/notes_page/notes.css", (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    const stream = fs.createReadStream('./client/notes_page/notes.css');
    stream.pipe(res);
});

app.get("/client/overview/overview.css", (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    const stream = fs.createReadStream('./client/overview/overview.css');
    stream.pipe(res);
});
// function encrypt(text) {
//     const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
//     let encrypted = cipher.update(text, 'utf8', 'base64');
//     encrypted += cipher.final('base64');
//     return encrypted;
// }

// function decrypt(encryptedText) {
//     if (!encryptedText || typeof encryptedText !== 'string') return ''; // пустые или null -> пустая строка

//     try {
//         const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
//         let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
//         decrypted += decipher.final('utf8');
//         return decrypted;
//     } catch (error) {
//         console.error("Ошибка при дешифровке:", error);
//         return ''; // при ошибке возвращаем пустую строку
//     }
// }

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "❌ Токен отсутствует" });

    jwt.verify(token, process.env.JWT_SECRET || "secret123", (err, user) => {
        if (err) return res.status(403).json({ message: "❌ Недействительный токен" });

        req.user = user;
        next();
    });
}

app.post("/registration", async (req,res) => {
    try{
        const checkQuery  = `SELECT * FROM UsersData WHERE email = $1`;
        const {email, password} = req.body;
        const isUserRegistered = await dbClient.query(checkQuery, [email]);

        if (isUserRegistered.rows.length > 0) {
            return res.status(400).json({ message: "❗ Пользователь с такой почтой уже существует" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const query = `INSERT INTO UsersData (users_id, email, password)
        VALUES (DEFAULT, $1, $2);`

        const result = await dbClient.query(query, [email, hashedPassword]);

        if (result.rowCount > 0) {
            console.log("✅ Запись добавлена!");
            res.json({ message: "✅ Запись успешно добавлена!" });
        } else {
            console.error("❌ Ошибка: запись не была добавлена в БД.");
            res.status(500).json({ message: "❌ Ошибка сервера" });
        }  
    } catch (err) {
        console.error("Ошибка регистрации:", err);
        res.status(500).json({ message: "❌ Ошибка сервера" });
    }
})

app.post('/checkEmail', async (req, res) => {
    try {
        const { usermail } = req.body;
        const result = await dbClient.query('SELECT * FROM UsersData WHERE email = $1', [usermail]);

        if (result.rows.length > 0) {
        return res.status(400).json({ message: '❗ Пользователь с такой почтой уже существует' });
        }

        res.json({ message: 'Email свободен' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.post("/sendMail", (req, res) => {
    try{
        const { usermail } = req.body;

        const verificationCode = String(Math.floor(100000 + Math.random() * 900000))
        verificationCodes.set(usermail, verificationCode);

        setTimeout(() => {
            verificationCodes.delete(usermail);
        }, 2 * 60 * 1000);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:{
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        })

        const mailOptions = {
            from: 'zavaliyvlad0@gmail.com',
            to: usermail,
            subject: 'Код подтверждения',
            text: `Уважаемый ${usermail}, вот ваш
            код для подтверждения почты ${verificationCode}`
        }

        transporter.sendMail(mailOptions)

    } catch (err) {
        console.error("Ошибка при отправлении:", err);
        res.status(500).json({ message: "❌ Ошибка сервера" });
    }

})

app.post("/verify", (req, res) => {
    const { email, code } = req.body;

    const storedCode = verificationCodes.get(email);

    if (!storedCode) {
        return res.status(400).json({ message: "⛔ Код не найден или просрочен" });
    }
    if (storedCode !== code) {
        return res.status(400).json({ message: "❌ Неверный код подтверждения" });
    }

    verificationCodes.delete(email); // удаляем после использования

    res.json({ message: "✅ Код подтверждён, можно продолжать" });
});

app.post("/authorization", async (req, res) => {
    try{
        const {email, password} = req.body;

        const checkQuery  = `SELECT * FROM UsersData WHERE email = $1`;
        const result = await dbClient.query(checkQuery, [email]);

        if (result.rows.length < 1) {
            return res.status(400).json({ message: "❗ Пользоватея с такой почтой не существует" });
        }

        const user = result.rows[0];
        const isMatchPassword = await bcrypt.compare(password, user.password);

        if (!isMatchPassword) {
            return res.status(401).json({ message: "❌ Неверный пароль" });
        }

        const token = jwt.sign(
            { userId: user.users_id }, 
            process.env.JWT_SECRET, 
            { expiresIn: "2h" } 
        );
        console.log("Generated token:", token);
        res.status(200).json({ message: "✅ Успешная авторизация", token });

    } catch (err) {
        console.error("Ошибка регистрации:", err);
        res.status(500).json({ message: "❌ Ошибка сервера" });
    }
});

app.post("/newnote", authenticateToken, async (req, res) => {
    const {title, content, status} = req.body;

    const user_id = req.user.userId;

    try {
        const insertQuery = `
            INSERT INTO Notes (user_id, title, content, status)
            VALUES ($1, $2, $3, $4)
        `;

        const result = await dbClient.query(insertQuery + " RETURNING *", [user_id, title, content, status]);
        const newNote = result.rows[0];
        res.json({ message: "✅ Заметка добавлена", note: newNote });

    } catch (err) {
        console.error("Ошибка добавления заметки:", err);
        res.status(500).json({ message: "❌ Ошибка сервера" });
    }
});

app.post('/newitems', async (req, res) => {
    try {
        const { note_id, content, is_done } = req.body;

        if (!note_id) {
            return res.status(400).json({ message: "❌ Отсутствует note_id" });
        }

        const insertQuery = `
            INSERT INTO notesitem (note_id, content, is_done, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *
        `;

        const result = await dbClient.query(insertQuery, [note_id, content || '', is_done || false]);

        const newNoteItem = result.rows[0];
        res.status(200).json({ message: "✅ Заметка добавлена", noteItem: newNoteItem });

    } catch (err) {
        console.error("Ошибка добавления заметки:", err);
        res.status(500).json({ message: "❌ Ошибка сервера" });
    }
});

app.get('/usernoteitems', authenticateToken, async (req, res) => {
    try {
        const noteId = req.query.note_id; 
        const query = 'SELECT * FROM NotesItem WHERE note_id = $1 ORDER BY created_at';
        const result = await dbClient.query(query, [noteId]);

        res.json({ noteItems: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "❌ Ошибка сервера" });
    }
});

app.get('/usernotes', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId; 
        const query = 'SELECT * FROM Notes WHERE user_id = $1 ORDER BY created_at DESC';
        const result = await dbClient.query(query, [userId]);

        res.json({ notes: result.rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "❌ Ошибка сервера" });
    }
});

app.post('/notes/update/:id', authenticateToken, async(req, res) => {
    try {
        const userId = req.user.userId; 
        const noteId = req.params.id;
        const { title, content } = req.body;

        const query = `
        UPDATE Notes
        SET title = $1, content = $2
        WHERE id = $3 AND user_id = $4 RETURNING *
        `

        const result = await dbClient.query(query, [title, content,noteId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Заметка не найдена" });
        }

        res.json({ note: result.rows[0] });
    } catch (err) {
        console.error(err);
    }
})

// app.get('/usernotes', authenticateToken, async (req, res) => {
//     try {
//         const userId = req.user.userId; 
//         const query = 'SELECT * FROM Notes WHERE user_id = $1 ORDER BY created_at DESC';
//         const result = await dbClient.query(query, [userId]);

//         const decryptedNotes = result.rows.map(note => ({
//             ...note,
//             title: note.title ? decrypt(note.title) : '',
//             content: note.content ? decrypt(note.content) : '',
//             status: note.status || ''
//         }));

//         res.json({ notes: decryptedNotes });
//     } catch (error) {
//         console.error("Ошибка при получении заметок и дешифровке:", error);
//         res.status(500).json({ message: "❌ Ошибка сервера" });
//     }
// });

app.put('/notes/:id/status', authenticateToken, async(req,res) => {
    const noteId  = req.params.id;
    const { status } = req.body;
    try{
        const query = 'UPDATE Notes SET status = $1 WHERE id = $2 RETURNING *';
        const result = await dbClient.query(query, [status, noteId]);

        res.json({updatedNote: result.rows[0]})
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "❌ Error fetching notes" });
    }
})

app.post('/notes/delete/:id', authenticateToken, async (req, res) => {
    const noteId = req.params.id;

    try {
        await dbClient.query('BEGIN');

        await dbClient.query(`DELETE FROM NotesItem WHERE note_id = $1`, [noteId]);
        const result = await dbClient.query(`DELETE FROM Notes WHERE id = $1 RETURNING *`, [noteId]);

        if (result.rowCount === 0) {
            await dbClient.query('ROLLBACK');
            return res.status(404).json({ message: "Note not found" });
        }

        await dbClient.query('COMMIT');
        res.json({ deletedNote: result.rows[0] });
    } catch (err) {
        await dbClient.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: "❌ Error deleting note and its items" });
    }
});

app.post('/notesitem/delete/:item_id', authenticateToken, async (req, res) => {
    const itemId = req.params.item_id;

    try {
        const result = await dbClient.query(`DELETE FROM NotesItem WHERE item_id = $1 RETURNING *`, [itemId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Note not found" });
        }

        res.json({ deletedNote: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "❌ Error deleting note and its items" });
    }
});

app.get('/notes/userinfo', authenticateToken, async(req,res) => {
    try{
        const userId = req.user.userId;
    
        const query = `SELECT email FROM UsersData WHERE users_id = $1`;
        const result = await dbClient.query(query, [userId]);

        res.json({ email: result.rows[0].email})
    } catch (err) {
        console.error("Ошибка получения данных", err);
        res.status(500).json({ message: "❌ Ошибка сервера" });
    }
})

app.get("/getcount", authenticateToken, async(req, res) => {
    try{
        const userId = req.user.userId;
        const { status } = req.query;

        const query = `SELECT COUNT(id) AS count FROM Notes
        WHERE status = $1 AND user_id = $2`;
        const result = await dbClient.query(query, [status, userId]);

        res.json({ count: Number(result.rows[0].count) });
    } catch (err) {
        console.error("Ошибка получения количества", err);
        res.status(500).json({ message: "❌ Ошибка сервера" });
    }
})

app.put('/noteitems/:item_id/status', authenticateToken, async(req,res) => {
    const itemId = req.params.item_id;
    const { is_done } = req.body;
    try{
        const query = 'UPDATE NotesItem SET is_done = $1 WHERE item_id = $2 RETURNING *';
        const result = await dbClient.query(query, [is_done, itemId]);

        res.json({updatedNotesItem: result.rows[0]})
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "❌ Error fetching notes" });
    }
})

const PORT = 3000;
const HOST = 'localhost';

server.listen(PORT, HOST, () => { console.log(`✅ Server is running at http://${HOST}:${PORT}/`);
});