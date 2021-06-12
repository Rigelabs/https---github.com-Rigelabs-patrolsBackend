const jwt = require('jsonwebtoken');

//middleware to validate token to be used in private routes
const env =require('dotenv')
env.config();
token_key = token_key = process.env.TOKEN_SECRET;

module.exports= function(req,res,next) {
        
        const token = req.headers.authorization;

        if(!token) return res.status(401).json({message: "Auth Error"});
        try{
            const verified = jwt.verify(token,token_key);
            req.user =verified;
            next();//calls the next middleware after token verification
        }catch(err){
            return res.status(400).json({message: err.message});
        }

}