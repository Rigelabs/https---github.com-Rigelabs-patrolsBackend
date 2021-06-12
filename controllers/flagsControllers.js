const express = require('express');

const User = require('../models/users')
const router = express.Router();
const { ensureAuth,ensureAdmin, ensureOffice } = require('../middlewares/authMiddlewares');
const multer = require('multer');
const shortid = require('shortid')
const Joi= require('joi');
const cloudinary =require('../middlewares/cloudinary');
const Flags = require('../models/flags');

var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1; //January is 0!
var yyyy = today.getFullYear();

today = mm + '/' + dd + '/' + yyyy;
const flagsSchema = Joi.object().keys({
    title: Joi.string().required().max(500).error(new Error('Title is empty or exceeds 500 characters or has symbols ')),
    
    observation: Joi.string().required().max(100000).min(10),
    resolution: Joi.string().max(100000).min(10),
    status:Joi.string().required().max(50),
    coordinates:Joi.string().required().min(5),

    images:Joi.array(),
   
    manhole:Joi.string().required(),
    road:Joi.string().required(),
   
    ring:Joi.string().required(),

    user:Joi.string().required(),
    assignedTo:Joi.string(),

});
function createFlagsList(flags){
    
    const FlagsList =[];
    
    for (let i of flags){
        FlagsList.push({
            _id : i._id,
            title : i.title,
            status : i.status,
            road: i.road,
            ring: i.ring,
            manhole:i.manhole,
            user:i.user,
            observation: i.observation,
            coordinates:i.coordinates,
            imagesBefore: i.imagesBefore,
            imagesAfter: i.imagesAfter,
            closure:i.closure,
            resolution:i.resolution,
            assignedTo:i.assignedTo,
            updatedBy:i.updatedBy,
            ticketNumber:i.ticketNumber,
            createdOn:i.createdAt
            
            
        })
    }
    return FlagsList;
}
const storage = multer.diskStorage({
    
    filename:  function (req, file, cb) {
        cb(null, shortid.generate()+ '-' + file.originalname)
    },
})
const uploads = multer({storage:storage,fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || !file) {
        cb(null, true);
    } else {
        cb(null, false);
        return cb(new Error('No file selected and only .png, .jpg and .jpeg format allowed!'));
    }
    
}});

router.post('/flag/create',uploads.array("images",10),ensureAuth,
        async(req,res)=>{
                                      
            try {
                //validate data from front end form
                const bodyerror = await flagsSchema.validateAsync(req.body);
                // check if user  exist 
                const userExist =await User.findOne({_id: req.body.user});
                let FlagCount;
                const flagsC =await Flags.countDocuments({},(err,count)=>{
                    if (count){
                        FlagCount=count++
                    }
                })
                if (userExist) {
                                
                   
                    const cloudinaryImageUpload= async image =>{
                        console.log(image)
                        return new Promise(resolve =>{
                            cloudinary.uploader.upload(image,{folder:"patrols/imagesBefore/",use_filename:true}, (err,res) =>{
                                if (err) return res.status(500).send("upload image error")
                                
                                resolve({
                                    res:res.secure_url
                                })
                            })
                        })
                    }
                    const img=[];
                    const files =req.files;
                    for(const file of files){
                        const {path} = file;
                        const newPath = await cloudinaryImageUpload(path)
                        img.push(newPath)
                    }
                    
                   
                        const flag = new Flags({
                            title: req.body.title,
                            status:req.body.status,
                            ring: req.body.ring,
                            observation: req.body.observation,
                            
                            road: req.body.road,
                            coordinates: req.body.coordinates,
                            manhole: req.body.manhole,
                            assignedTo:req.body.assignedTo,
                            user: userExist.fullname,
                            ticketNumber:FlagCount,
                            imagesBefore:img.map(img =>img.res)
                            
                        });
                        //console.log(req.user._id)
           
                    await flag.save((error) =>{
                        if(error) {return res.status(400).json({message:error.message})}
                        
                        //res.status(201).json({product})
                        return res.status(201).send({message:"Flag  "+ flag.title + " created"})
                        });
                
                }else{
                    return res.status(400).json({message:"User Not Found"});
                }
            
                
            } catch (error) {
                return res.status(400).json({message:error.message})
            }
            
            
       
})

//fetch all flags
router.get('/flags/all', ensureAuth,async(req,res)=>{
    try{
        
        //fetch flags are 7days to expiry and approved //sort  in a descending order using updatedAt;
            const flags =await Flags.find().sort({createdAt: -1});
            if (flags){
                const flagsList = createFlagsList(flags)
                return res.status(200).json({flagsList,flagsByRing:{
                    RING1: flags.filter(flag =>flag.ring ==="RING 1"),
                    RING2: flags.filter(flag =>flag.ring ==="RING 2"),
                    RING3: flags.filter(flag =>flag.ring ==="RING 3"),
                    RING4: flags.filter(flag =>flag.ring ==="RING 4"),
                    RING9: flags.filter(flag =>flag.ring ==="RING 9"),
                    RING10: flags.filter(flag =>flag.ring ==="RING 10"),
                    CLUSTER1: flags.filter(flag =>flag.ring ==="CLUSTER 1"),
                    CLUSTER2: flags.filter(flag =>flag.ring ==="CLUSTER 2"),
                    
                },status:{
                    open: flags.filter(flag => flag.status ==="OPEN"),
                    pending: flags.filter(flag => flag.status ==="RESOLVED"),
                    assigned: flags.filter(flag => flag.status ==="ASSIGNED"),
                    closed: flags.filter(flag => flag.status ==="CLOSED"),
                    
                }
                
            })
            }
        
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
    
});
//fetch all flags by user
router.get('/flags/:user',ensureAuth, async(req,res)=>{
    const userId= req.params.user
    try{
      
        //fetch flags are 7days to expiry and approved //sort  in a descending order using updatedAt;
            const flags =await Flags.find({createdBy:userId}).sort({createdAt: -1});
          
            if (flags){
                const flagsList = createFlagsList(flags)
                return res.status(200).json({flagsList,flagsByRing:{
                    RING1: flags.filter(flag =>flag.ring ==="RING 1"),
                    RING2: flags.filter(flag =>flag.ring ==="RING 2"),
                    RING3: flags.filter(flag =>flag.ring ==="RING 3"),
                    RING4: flags.filter(flag =>flag.ring ==="RING 4"),
                    RING9: flags.filter(flag =>flag.ring ==="RING 9"),
                    RING10: flags.filter(flag =>flag.ring ==="RING 10"),
                    CLUSTER1: flags.filter(flag =>flag.ring ==="CLUSTER 1"),
                    CLUSTER2: flags.filter(flag =>flag.ring ==="CLUSTER 2"),
                    
                },status:{
                    open: flags.filter(flag => flag.status ==="OPEN"),
                    pending: flags.filter(flag => flag.status ==="RESOLVED"),
                    assigned: flags.filter(flag => flag.status ==="ASSIGNED"),
                    closed: flags.filter(flag => flag.status ==="CLOSED"),
                    
                }
                
                
            })
            }
        
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
    
});
//fetch a flags by id
router.get('/flag/:_id', ensureAuth,async(req,res)=>{
    const flagId= req.params._id
    try{
      
        //fetch flags are 7days to expiry and approved //sort  in a descending order using updatedAt;
            const flag =await Flags.findById(flagId);
          
            
                return res.status(200).json(flag)
            
        
    } catch (error) {
        return res.status(400).json({message: error.message})
    }
    
});
//edit a  product
router.put('/flag/edit/:_id',ensureAuth,uploads.array("images",10), async(req,res)=>{
    
    try {
        
        // check if flag  exist 
        const flag =await Flags.findById( req.params._id);
        const  user= await User.findById(req.body.user)
       if(flag && user){
            
            
           
            const cloudinaryImageUpload= async photo =>{
                return new Promise(resolve =>{
                    cloudinary.uploader.upload(photo, {folder:"patrols/imagesAfter/",use_filename:true},(err,res) =>{
                        if (err) return res.status(500).send("upload image error")
                        
                        resolve({
                            res:res.secure_url
                        })
                    })
                })
            }
            const img=[];
            const files =req.files;
            for(const file of files){
                const {path} = file;
                const newPath = await cloudinaryImageUpload(path)
                img.push(newPath)
                
            }
            const imagesafter= img.map(img=>img.res).concat(flag.imagesAfter);
           //console.log(imagesafter)
                const flagObj ={
                    title: req.body.title || flag.title,
                    status:req.body.status || flag.status,
                    ring: req.body.ring || flag.ring,
                    manhole: req.body.manhole || flag.manhole,
                    observation: req.body.observation || flag.observation,
                    road: req.body.road || flag.road,
                    assignedTo:req.body.assignedTo || flag.assignedTo,
                     coordinates: req.body.coordinates || flag.coordinates,
                     closure: req.body.closure || flag.closure,
                     resolution: req.body.resolution || flag.resolution,
                     updatedBy:user.fullname,
                    imagesAfter:imagesafter
                  
                    
                }
               
             Flags.findByIdAndUpdate( req.params._id,flagObj,
                            {new:true, runValidators:true}).then((result,err)=>{
                                if(err){
                                    res.status(400).json({message:err})
                                }
                            if(result){
                                res.status(200).send({message:"Flag  "+ flag.title + " updated successfully"})
                            }
                            })                   
                                
        }else{
            return res.status(400).json({message:"Flag or User does not exist"});
        }
    
    
           
    }catch(error){
        return res.status(500).json({message:error.message});
    } 
        
  
    
});
//Deleting a flag
router.delete("/flag/delete/:_id",ensureAuth,ensureOffice, async( req,res)=>{
    try {
        
        //Find flag by Id
        const  flag  = await Flags.findById(req.params._id);
        if (!flag){
            res.status(404).json({message: "Flag not found"})
        }
        const images=flag.imagesBefore.concat(flag.imagesAfter);
     // console.log(images)
        if(images.length>0){
        //Delete images from cloudinary
        await cloudinary.api.delete_resources(images, function(error,result) {
            if(error){
            res.status(401).json({message:error})
            }
            //console.log(result)
        })}
        //delete flag from mongoDB
        await flag.remove()
            res.status(200).json({message: "Deleted successfully"})
        
        
    } catch (error) {
        res.status(400).json({message: error})

    }
});
module.exports = router;