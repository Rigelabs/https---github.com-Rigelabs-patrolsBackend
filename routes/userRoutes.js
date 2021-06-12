const express = require('express')
const verifytoken = require('./validators'); 
const {addUser, loginuser, updateUser, getUser,deleteUser, getUsers}=  require('../controllers/userControllers');
const { ensureStrictUser, ensureUser,ensureAuth,ensureAdmin } = require('../middlewares/authMiddlewares');



const router= express.Router();

//creating a user record
router.post('/user/create',addUser);

//Login a user
router.post('/user/login',loginuser);

//get user
router.get('/user',verifytoken,getUser);

//get all users
router.get('/users',verifytoken,getUsers);

//update User
router.put("/user/update/:id",ensureAuth,updateUser);
//delete a user
router.delete("/user/delete/:id",ensureAuth,deleteUser);


module.exports={
    routes:router
}


