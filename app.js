require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose=require('mongoose');
// const encrypt = require("mongoose-encryption");
const md5= require("md5");  

const app = express();
  
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

//database section deifne
mongoose.connect('mongodb://127.0.0.1:27017/userDB');
// creating schema
const userSchema=new mongoose.Schema({
email:String,
password:String
});

// // database encryption using key mongoose encryption
// const secretKey = process.env.SECRET;

// userSchema.plugin(encrypt,{secret : secretKey,
//      encryptedFields:["password"]});

//db model
const User=mongoose.model('User',userSchema);
  


//routes logic starts here
app.get('/',(req, res) => {
res.render('home');
});
  
app.get('/login',(req, res) => {
res.render('login');
});
  
app.get('/register',(req, res) => {
res.render('register');
});

app.post('/register',(req,res)=>{
    const UserName=req.body.username;
    const Password=md5(req.body.password);
    const newRegister = new User({
        email: UserName,
        password: Password
    })
    const emailPrefix=newRegister.email.split('@')[0]; 
    // console.log(newRegister);  
    User.findOne({email:UserName})
    .then(found=>{
    
    if(found===null){
       
        newRegister.save()
        .then(()=>{
            res.render('secrets',{userName:emailPrefix});
        })
        .catch(error=>{
            console.log(error);
        }); 
        
    }else{
        console.log('already registered email id')
        // res.render('register', {"email is already registered":errorMessage});
    }
})
.catch(error=>{
    console.log(error);
}) 
})




app.post('/login',(req,res)=>{
    const UserName=req.body.username;
    const Password=md5(req.body.password);
    
    const emailPrefix=UserName.split('@')[0];
    User.findOne({email:UserName})
    .then(found=>{
        if(found.email===UserName && found.password===Password){
            res.render('secrets',{userName:emailPrefix});

        }else{
            // res.render('register', { errorMessage: "invalid email or password"});
            console.log('invalid login')
        }
    })
    .catch(error=>{
        console.log(error);
    });
})
  
app.listen(3000,function(){
console.log(`Server running on port 3000`);
})
