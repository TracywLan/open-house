require("dotenv").config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');
const authController = require('./controllers/auth.js');
const port = process.env.PORT ? process.env.PORT : '5000';
const isSignedIn = require('./middleware/is-signed-in.js');
const listingsController = require('./controllers/listings');
const passUserToView = require('./middleware/pass-user-to-view.js');
const MongoStore = require('connect-mongo');
const userController = require('./controllers/user')
const path = require('path')

// Middlewares
require("./db/connection.js")
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }

  })
);

app.use(passUserToView);

// Routes
app.get('/', (req, res) => {
  res.render('index.ejs', {
    user: req.session.user,
  });
});

app.use('/auth', authController);

// Routes must be signed in
app.use(isSignedIn);
app.use('/listings', listingsController);
app.use('/users', userController)


app.listen(port, () => {
  console.log(`The express app is ready on port http://localhost:${port}`);
});
