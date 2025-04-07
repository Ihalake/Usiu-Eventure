const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Update the static file serving to use path.join
app.use(express.static(path.join(__dirname, 'frontend/public')));

// Handlebars setup
const hbs = exphbs.create({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'frontend/views/layouts'),
    partialsDir: path.join(__dirname, 'frontend/views/partials'),
    helpers: {
        formatDate: function(date) {
            return date ? new Date(date).toLocaleDateString() : '';
        },
        eq: function(a, b) {
            return a === b;
        }
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './frontend/views');

// Routes
app.use('/auth', require('./backend/routes/auth'));
app.use('/admin', require('./backend/routes/admin'));
app.use('/student', require('./backend/routes/student'));
app.use('/admin', require('./backend/routes/events'));


// Default route
app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error: ', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));