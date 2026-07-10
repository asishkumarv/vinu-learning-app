const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // Trust Nginx headers

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.get('/', (req, res) => {
  res.send('Vinu Learning App API is running...');
});

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const progressRoutes = require('./routes/progress');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
