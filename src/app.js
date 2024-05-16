const express = require('express');
const morgan = require('morgan');
const router = require('./routes/router.js');

const app = express();

app.use(express.json());

// Middleware
app.use(express.urlencoded({ extended: true }));

//port
app.set('port', process.env.PORT || '3000');

app.use(router);

//middlewares
app.use(morgan('dev'));


module.exports = app;