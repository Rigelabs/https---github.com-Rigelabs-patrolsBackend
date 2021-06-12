'use strict';

const User = require('../models/users');
const jwt = require('jsonwebtoken');
const Joi= require('joi');
const bcrypt = require('bcryptjs')

const schema = Joi.object({
    fullname: Joi.string().min(4).required(),
    username: Joi.string().required().alphanum().max(10),
    email: Joi.string().required().email(),
    password: Joi.string().required(),
    confirmPassword:Joi.any().equal(Joi.ref('password'))
    .required()
    
    .messages({ 'any.only': ' passwords does not match' }),
               
    contact:Joi.string().max(10).min(9).regex(/^[0-9]+$/).error(new Error('Invalid Phone number')),
    role: Joi.string().required(),

});
const addUser =async (req,res,next)=>{
    //validate data before adding a user
    console.log(req.body)
    try{
        const {bodyerror,value} = await schema.validateAsync(req.body);
        if(bodyerror){
            res.status(400).json({message:bodyerror})
        }else{
            //check if email already exist in database
            const emailExist =await User.findOne({email: req.body.email});
             if (emailExist) {
                 return res.status(400).json({message:"Email already exist"});
                }else{
                        //check if username already exist in database
   
                        const usernameexist =await User.findOne({username: req.body.username});
                        if(usernameexist){
                             res.status(400).json({message: "Username already exist"})
                        }else{
                                
                            //check if contact already exist in database
                            
                            const contactexist =await User.findOne({contact: req.body.contact});
                            if(contactexist){
                                res.status(400).json({message: `Contact ${req.body.contact} already exist`})
                                 
                            }else{
                                    //Hash the password   
                                const salt = await bcrypt.genSalt(10);
                                var hashedPassword= await bcrypt.hash(req.body.password,salt);

                                 //create new user object after validation and hashing
                                 const user =new User({
                                    fullname: req.body.fullname,
                                    role: req.body.role,
                                    email: req.body.email,
                                    username:req.body.username,
                                    password: hashedPassword,
                                    contact:req.body.contact,
                                  
                            });
                            
                        //try to save user 
                         await user.save()
                            res.status(200).json({message: "Account registered successfully, we are responding through the email with more information"});
                            }
  
   
                        }
                 }
        } 
       
   } catch (error) {
       res.status(400).json({message: error.message})
   }
   
}

//Login route
const env =require('dotenv');
env.config();
const token_key = process.env.TOKEN_SECRET;

const loginschema = Joi.object({

    contact: Joi.string().required(),
    password: Joi.string().required()
});

const loginuser= async(req,res,next)=> {
    try{
        const {bodyError,value} = await loginschema.validateAsync(req.body);
        if(bodyError){
            res.status(400).json({message: bodyError});
        }else{
            //check if contact  exist in database
            const user =await User.findOne({contact: req.body.contact});
             if (!user){
                     res.status(400).json({message:"Account doesn't not exist"})
                }else{
                    //check if role is Admin
                    
                       
                                //check if password match
    
                        const validpass =await bcrypt.compare(req.body.password,user.password);
                        if(!validpass) return  res.status(400).json({message:"Invalid password"});

                         //create and assign a token once logged in
                        const token =jwt.sign({_id:user._id,  role:user.role},token_key,{expiresIn:'1d'})
                        res.header('token', token).json({'token':token,'user':user});

                        
   
                }
    
        }
    }catch(error){
        res.status(400).json({message:error.message})
    }
    
};
//get a user
const getUser=async(req,res,next)=>{

    await User.findById(req.user._id)
        .select('-password') //will disregard return of password.
        .then(user => res.json(user))
}
//get all users

function createUsers(users) {
    const usersList = [];

    for (let i of users) {
        usersList.push({
            _id:i.id,
            fullname:i.fullname,
            username:i.username,
            contact:i.contact,
            email:i.email,
            role:i.role

        })
    }
    return usersList;
}

const getUsers=async(req,res,next)=>{
    try{
    const users =await User.find().sort({updatedAt:-1})
    if(users){
        const usersList =createUsers(users)
        return res.status(200).json({usersList,})
    }
}catch(error){
    return res.status(400).json({message:error.message})
}   
}
//Updating User profile
const updateUser=async(req,res,next) =>{
  
    try {
        const user = await User.findById(req.params.id);
        
        const data = {
            fullname: req.body.fullname || user.fullname,
            programs: req.body.programs || user.programs
         
        };
        if(user){
        await User.findByIdAndUpdate(req.params.id, data,{new:true,runValidators:true}).then((result,error)=>{
                if(result){
                    res.status(200).json({message:"User profile updated successfully"})
                }
                if(error){
                    res.status(400).json({message : error})
                }
        });
    }else{
        res.status(404).json({message:"user not found"})
    }
    
    } catch (error) {
        res.status(400).json({message : error.message})
    }
 };


 //Deleting a user
 const deleteUser=async( req,res)=>{
     try {
         //Find user by Id
         const  user  = await User.findById(req.params.id);
         if (!user){
             res.status(400).json({message: "User not found"})
         }
       
         //delete user from mongoDB
         await user.remove();
         res.status(200).json({message: "Account Deleted successfully"})
     } catch (error) {
        // return res.send(error)
     }
 };
 
module.exports={
    addUser,loginuser,updateUser,getUser,deleteUser,getUsers
}