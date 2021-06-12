const express=require('express');
const cors =require('cors');
const morgan =require('morgan');
const mongoose = require('mongoose');
const env =require('dotenv')


const app =express();


//initialize cors
app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
//initialize bodyparser
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//initialize morgan for server logging
if (process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

//routes
const userRoutes=require('./routes/userRoutes');
const flagsRoutes=require('./controllers/flagsControllers')

app.use('/api',userRoutes.routes);
app.use('/api',flagsRoutes);

const PORT =process.env.PORT || 5000

app.listen(PORT,console.log(`Server running in ${process.env.NODE_ENV} on port  ${PORT}`))

//setting up db
//environment variable
env.config();

db=process.env.MONGO_URI
mongoose.connect(db,{useCreateIndex:true,useFindAndModify: false,
  useNewUrlParser:true,useUnifiedTopology:true})
  .then(console.log('connected to db'))
  .catch(error=>console.log(error))







