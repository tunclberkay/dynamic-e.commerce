const path = require('path');
const express = require('express');
const multer = require('multer');  // Multer modülünü ekliyoruz
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');  // jwt modülünü ekledik
require('dotenv').config();

const app = express();
app.use(express.json());

// Multer konfigürasyonu
const storage = multer.memoryStorage();  // Dosyayı doğrudan bellek üzerine alıyoruz (disk değil)
const upload = multer({ storage: storage });

// Statik dosyaları sun (index.html gösterilecek)
app.use(express.static(path.join(__dirname, '../backend')));  // Doğru dizini ayarla

// PostgreSQL bağlantısı
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
});

// Kayıt olma işlemi
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, hashedPassword]);
        res.status(201).json({ message: 'Kayıt başarılı!' });
    } catch (error) {
        res.status(500).json({ error: 'Kullanıcı kaydedilirken hata oluştu.' });
    }
});

// Giriş işlemi
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'Kullanıcı bulunamadı!' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Hatalı şifre!' });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error(error); // Hata detayını logluyoruz
        res.status(500).json({ error: 'Giriş yapılırken hata oluştu.' });
    }
});

// Profil bilgilerini getirme
app.get('/profile', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];  // "Bearer <token>" kısmından sadece token'ı almak
    if (!token) return res.status(401).json({ error: 'Yetkisiz erişim!' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  
        const result = await pool.query('SELECT username FROM users WHERE id = $1', [decoded.id]);

        if (result.rows.length > 0) {
            res.json({ username: result.rows[0].username });  
        } else {
            res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Ürün ekleme route'u
app.post('/add-product', upload.single('image'), async (req, res) => {
    const { name, description, price, category } = req.body;

    // Multer ile yüklenen dosyayı BYTEA formatında alıyoruz
    const imageBuffer = req.file.buffer;  // Multer'ın bellek üzerine yüklediği dosya verisi

    // Veritabanına veri ekleme
    try {
        const result = await pool.query(
            'INSERT INTO products (name, description, price, image, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, price, imageBuffer, category]
        );
        res.status(201).json({
            message: 'Ürün başarıyla eklendi!',
            product: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ürün eklenirken hata oluştu.' });
    }
});

// Ürünleri getirme API'si (Kategoriye göre filtreleme)
app.get('/products', async (req, res) => {
    const { category } = req.query;  // ?category=kolye gibi bir istekle filtreleme yap
    try {
        let query = "SELECT * FROM products";
        let values = [];

        if (category) {
            query += " WHERE category = $1";
            values.push(category);
        }

        const result = await pool.query(query, values);

        // Ürünlerin her birine base64 formatında görsel verisini ekleyelim
        const products = result.rows.map(product => {
            if (product.image) {
                // Resmi base64 formatına dönüştür
                const base64Image = product.image.toString('base64');
                product.image_url = `data:image/png;base64,${base64Image}`;
            }
            return product;
        });

        res.json(products);
    } catch (error) {a
        console.error(error);
        res.status(500).json({ error: 'Ürünler getirilirken hata oluştu.' });
    }
});

app.get('/products', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM products"); // Veritabanından ürünleri çek
        res.json(result.rows); // JSON formatında geri döndür
    } catch (err) {
        console.error("Ürünleri çekerken hata oluştu:", err);
        res.status(500).json({ error: "Sunucu hatası" });
    }
});


// Eğer route bulunamazsa, index.html göster (SPA için)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Sunucuyu başlat
app.listen(5002, () => {
    console.log('Server 5002 portunda çalışıyor...');
});
