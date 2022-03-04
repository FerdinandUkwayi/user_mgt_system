const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser')
const dotenv = require('dotenv');
const mysql = require('mysql');
const fileUpload = require('express-fileupload');


dotenv.config();

const app = express();

//Parsing Middleware
//Parse application/x-www.form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

//Parse application/json
app.use(bodyParser.json());

//Default Option
app.use(fileUpload());

//Static files
app.use(express.static('public'));

//Configure template Engine and Main Template File
app.engine('hbs', exphbs.engine({
    defaultLayout: 'main',
    extname: '.hbs'
}));

// Setting template Engine
app.set('view engine', 'hbs'); 


//Database Connection
const db = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.getConnection((error, connection) => {
    if(error) throw error;
    console.log('connected successfull as ID ' + connection.threadId);
});

const routes = require('./server/routes/user');
app.use('/', routes)

app.listen(5000,() => {
    console.log(`Listening of port 5000`)
})