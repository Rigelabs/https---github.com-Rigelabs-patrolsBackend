const mongoose = require('mongoose');

const FlagsSchema= new mongoose.Schema({
    title: {
        type: String,
        required: true,
       
    },
    
    status: {
        type: String,
        default: 'OPEN',
        enum:['RESOLVED','CLOSED','OPEN','ASSIGNED','PENDING']
    },
    road: {
        type: String,
        required: true,
    },
   
    observation: {
        type: String,
      
    },
    resolution: {
        type: String,
      
    },
    assignedTo: {
        type: String,
      
    },


    closure: {
        type: String,
     
    },
    manhole: {
        type: String,
        required: true,
    },
    ring:{
        type: String,
        required: true,
        enum:['RING 1','RING 2','RING 3','RING 4','RING 9','RING 10','CLUSTER 1','CLUSTER 2']
    },
    
    imagesBefore:{
        type: Array, 
        required: true,       
    },
    imagesAfter:{
        type: Array,        
    },
    updatedBy:{
        type: String,        
    },
    coordinates: {
       
          type: String, 
          
    },
    ticketNumber: {
       unique:true,
        type: String, 
        
  },
        
    user: {
        type:String
    },
    updatedBy: {
        type:String
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
})

module.exports=mongoose.model('Flags', FlagsSchema);