const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

//Create User, Update User, Delete User, Edit Profile...
router.get('/', userController.view);
router.get('/profile_photo/:id', userController.upload);
router.get('/register', userController.regt);
router.post('/register', userController.create);
router.get('/login', userController.login);
router.post('/login', userController.signin);
router.get('/viewprofiledetail/:id', userController.profiledetail);
router.get('/viewprofile/:id', userController.profile);
router.post('/viewprofile', userController.uploadprofileimg);
router.get('/editprofile/:id', userController.edit);
router.post('/editprofile/:id', userController.update);
router.get('/:id', userController.delete);

module.exports = router;