const jwt = require('jsonwebtoken');

module.exports ={
    ensureAuth: function(req,res,next){
        const authHeader= req.headers.authorization
        try {
            if (authHeader){
                const token = authHeader;
                //console.log(token)
                const user = jwt.verify(token, process.env.TOKEN_SECRET)
                req.user =user;
                if(user){
                     next();
                }else{
                    res.redirect('/')
                }
            }else{
                res.sendStatus(401)
            }
        } catch (error) {
            if (error==='TokenExpiredError') {
                res.status(401).json({message:"Token expired"})
            
            }return res.status(400).json({message: error.name})
        }
        
    },
    ensureOffice: function(req,res,next){
        const {role} = req.user;
        if(role === 'OFFICE' ){
            next()
        }else{
            res.status(403).json({message:"Operation Unathorized"})
        }
    },
}