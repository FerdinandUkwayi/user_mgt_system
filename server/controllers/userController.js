const mysql = require('mysql');
const bcrypt = require('bcryptjs');

const db = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

//Render the Home Page
exports.view = (req, res) => {

    db.getConnection((err, connection) => {
        if (err) throw err;
        console.log('connected successfull at ID ' + connection.threadId);

        //User connection
        db.query('SELECT * FROM user', (err, rows) => {
            //on connection, release
            connection.release();

            if (!err) {
                let removedUser = req.query.removed;
                res.render('index', { rows, removedUser });

            } else {
                console.log(err);
            }
            console.log('Data: \n', rows)
        })
    });
}

//Render the Registeration Page
exports.regt = (req, res) => {
    res.render('register');
}

//Update User
exports.edit = (req, res) => {
    const { first_name, last_name, email, phone, password, confirmPassword } = req.body;
    db.getConnection((err, connection) => {
        if (err) throw err;
        console.log('connected successfull at ID ' + connection.threadId);

        //User connection
        db.query('SELECT * FROM user WHERE id = ?', [req.params.id], (err, rows) => {
            //on connection, release
            connection.release();

            if (!err) {
                res.render('edit-profile', { rows });
            } else {
                console.log(err);
            }
        })
    })
}

//Update User
exports.update = (req, res) => {
    const { first_name, last_name, email, phone, profile_img, password, confirmPassword } = req.body;

    //Upload Photo
    let sampleFile;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    sampleFile = req.files.sampleFile;
    imagepath = "public/img/upload/"+sampleFile.name;
    uploadPath = __dirname + '/public/img/upload/' + sampleFile.name;
    console.log(uploadPath)

    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function (err) {
        if (err)
            return res.status(500).send(err);
    })

    db.getConnection((err, connection) => {
        if (err) throw err;
        console.log('connected successfull at ID ' + connection.threadId);

        //User connection
        db.query('UPDATE user SET first_name = ?, last_name = ?, email = ?, phone = ?, profile_img = ? WHERE id = ?', [first_name, last_name, email, phone, imagepath, req.params.id], (err, rows) => {
            //on connection, release
            connection.release();

            if (!err) {
                db.getConnection((err, connection) => {
                    if (err) throw err;
                    console.log('connected successfull at ID ' + connection.threadId);

                    //User connection
                    db.query('SELECT * FROM user WHERE id = ?', [req.params.id], (err, rows) => {
                        //on connection, release
                        connection.release();

                        if (!err) {
                            res.render('edit-profile', { rows, alert: 'Updated Successfully!' });
                        } else {
                            console.log(err);
                        }
                    })
                })
            } else {
                console.log(err);
            }
        })
    })
}


//Register Userr
exports.create = (req, res) => {
    const { first_name, last_name, email, phone, password, confirmPassword } = req.body;

    db.getConnection((err, connection) => {

        db.query('SELECT email FROM user WHERE email = ?', [email], async (err, rows) => {
            if (err) {
                console.log(err);
            }
            if (rows.length > 0) {
                return res.render('register', {
                    message: 'Email is already in use'
                })
            } else if (password !== confirmPassword) {
                return res.render('register', {
                    message: 'Passwords do not match'
                })
            }

            let hashedPassword = await bcrypt.hash(password, 8);

            //User connection
            db.query('INSERT INTO user SET first_name = ?, last_name = ?, email = ?, phone = ?, password = ?', [first_name, last_name, email, phone, hashedPassword], (err, rows) => {
                connection.release();
                if (!err) {
                    
                    res.redirect('login');
                } else {
                    console.log(err);
                }
                console.log('The data from user table: \n', rows)
            })

        })
    });
}

//Render Login Page
exports.login = (req, res) => {
    res.render('login')
}

//Sign a User into his/her profile page
exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.render('login', {
                message: 'Please provide an email and password'
            })
        }

        db.getConnection((err, connection) => {

            db.query('SELECT * FROM user WHERE email = ?', [email], async (err, rows) => {
                if (err) {
                    console.log(err);
                }
                connection.release();
                if (rows.length >= 1) {
                    const p = await bcrypt.compare(password, rows[0].password)

                    if (!p) {
                        res.status(401).render('login', {
                            message: 'Email or Password is Incorrect'
                        })
                    } else {
                        res.render(`profile`, { rows })
                        console.log(rows)
                    }
                } else {
                    res.status(401).render('login', {
                        message: 'Email or Password is Incorrect'
                    })
                } 
                // let hashedPassword = await bcrypt.hash(password, 8);
            })
        })
    } catch (error) {
        console.log(error)
    }
}

//Render's Photo upload page
exports.upload = (req, res) => {
    res.render('profile_photo');
}

//Upload photo
exports.uploadprofileimg = (req, res) => {
    let sampleFile;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    sampleFile = req.files.sampleFile;
    uploadPath = __dirname + '/public/img/upload/' + sampleFile.name;
    console.log(uploadPath)

    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function (err) {
        if (err)
            return res.status(500).send(err);

        db.getConnection((err, connection) => {
            if (err) throw err;
            console.log('connected successfull at ID ' + connection.threadId);

            //User connection
            db.query('UPDATE user SET profile_img = uploadPath WHERE id = ?', [req.params.id], (err, rows) => {
                //on connection, release
                connection.release();

                if (!err) {
                    db.getConnection((err, connection) => {
                        if (err) throw err;
                        console.log('connected successfull at ID ' + connection.threadId);

                        //User connection
                        db.query('SELECT * FROM user WHERE id = ?', [req.params.id], (err, rows) => {
                            //on connection, release
                            connection.release();

                            if (!err) {
                                res.render('edit-profile', { rows, alert: 'Updated Successfully!' });
                            } else {
                                console.log(err);
                            }
                        })
                    })
                } else {
                    console.log(err);
                }
            })
        })
    });
}

//Renders User Profile
exports.profile = (req, res) => {

    db.getConnection((err, connection) => {

        if (err) throw err;
        console.log('connected successfull at ID ' + connection.threadId);

        //User connection
        db.query('SELECT * FROM user WHERE id = ?', [req.params.id], (err, rows) => {
            //on connection, release
            connection.release();

            if (!err) {
                res.render('profile', { rows });
            } else {
                console.log(err);
            }

            console.log('Data: \n', rows)
        })
    });
}

// User Profile Detail
exports.profiledetail = (req, res) => {

    db.getConnection((err, connection) => {

        if (err) throw err;
        console.log('connected successfull at ID ' + connection.threadId);

        //User connection
        db.query('SELECT * FROM user WHERE id = ?', [req.params.id], (err, rows) => {
            //on connection, release
            connection.release();

            if (!err) {
                res.render('profile_detail', { rows });
            } else {
                console.log(err);
            }

            console.log('Data: \n', rows)
        })
    });
}

//Delete User
exports.delete = (req, res) => {

    db.getConnection((err, connection) => {
        if (err) throw err;
        console.log('connected successfull at ID ' + connection.threadId);

        //User connection
        db.query('UPDATE user SET status = ? WHERE id = ?', ['removed', req.params.id], (err, rows) => {
            //on connection, release
            connection.release();

            if (!err) {
                let removedUser = encodeURIComponent('User successfully removed.');
                res.redirect(`/?removed=` + removedUser);
                console.log(`update rows :`);

                db.getConnection((err, connection) => {
                    db.query('DELETE FROM user WHERE status = ?', ['removed'], (err, rows) => {
                        connection.release();
                        if (!err) {
                            res.redirect('/')
                        } else {
                            console.log(err)
                        }
                    })
                })
            } else {
                console.log(err);
            }
        });
    });
}