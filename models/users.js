const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    fullname:{
        type:String,
        required:true,
        uppercase:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    contact:{
        type:String,
        required:true,
        unique:true
    },
   
    password: {
        type: String,
        min: 6,
        required: true,
        trim:true
    },
    avatar:{
        type:String
    },
    cloudinary_id:{
        type:String
    },
    role:{
        type: String,
        required: true,
        enum:['PATROL','PM','CM','OFFICE']
    },
   
    
},{timestamps:true})



module.exports=mongoose.model('User',userSchema);