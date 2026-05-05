const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const artWorkRoutes = require('./routes/ArtWorkRoutes');
const searchRoutes = require('./routes/SearchRoutes');
const permissionRoutes = require('./routes/PermissionRoutes');

const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artWorkRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/permissions', permissionRoutes);


app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});


