const express = require('express');
const pool = require('./db');
const dotenv = require('dotenv');
const QRCode = require('qrcode');
const { auth } = require('express-oauth2-jwt-bearer');
const cors = require('cors');
app.use(cors());

// LAB 1 BACKEND
// Franko Goricanec
// 1191247271

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4091;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


authorization = auth({
    audience: 'https://auth-lab-api.com',
    issuerBaseURL: 'https://dev-24mxnjobvcw5u1jo.us.auth0.com'
 
  });


// STVARANJE ULAZNICA
app.post('/generate-ticket', authorization, async (req, res) => { // ...endpoint za stvaranje ulaznice
    const { vatin, firstName, lastName } = req.body; // ...citanje podataka iz requesta
    if (!vatin || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });  // ...vracanje 400 ako fale podaci
    }
  
    try {
      const result = await pool.query(  // ...provjera ako su generirane vec 3 ulaznice za isti OIB (vatin) (ili vise, za svaki slucaj)
        'SELECT COUNT(*) FROM tickets WHERE vatin = $1',  // ...SQL prebrojavanje
        [vatin]
      );
      if (parseInt(result.rows[0].count) >= 3) {
        return res.status(400).json({ error: 'Maximum number of tickets reached for this VATIN' }); // ...javi 400 ako je previse ulaznica
      }
  
      const newTicket = await pool.query(
        'INSERT INTO tickets (vatin, first_name, last_name) VALUES ($1, $2, $3) RETURNING id', // ...dodaj ulaznicu u bazu i vrati id ako uspjesno
        [vatin, firstName, lastName]
      );
      const ticketId = newTicket.rows[0].id;  // ...dohvati id ulaznice
      const url = `https://qr-app-hzs5.onrender.com/show-ticket/${ticketId}`; // ...url endpointa koji prikazuje informacije za QR kod TODO: preimenuj stranicu
  
      const qrCode = await QRCode.toDataURL(url); // ...generiranje QR koda za ulaznicu
  
      res.status(201).json({
        ticketId,
        qrCode,
        message: 'Ticket created'
      });
    } catch (err) { // ... hvatanje greske
      console.error(err);
      res.status(500).json({ error: 'Something went wrong...' });
    }
  });
  
// DOHVAT BROJA IZGENERIRANIH ULAZNICA
app.get('/ticket-count', async (req, res) => {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM tickets'); // ... dohvati broj izgeneriranih ulaznica iz baze
      res.json({ ticketCount: result.rows[0].count });
    } catch (err) { // ... hvatanje greske
      console.error(err);
      res.status(500).json({ error: 'Something went wrong...' });
    }
  });

// PRIKAZ ULAZNICE
app.get('/show-ticket/:id', authorization, async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]); // ... dohvati ulaznicu na temelju id-a
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' }); // ... ako nema ulaznice vrati gresku
      }
      res.json(result.rows[0]);
    } catch (err) { // ... hvatanje greske
      console.error(err);
      res.status(500).json({ error: 'Something went wrong...' });
    }
  });
  

// node app.js