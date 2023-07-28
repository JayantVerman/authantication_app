require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose=require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds=10;

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

app.get('/db',(req,res)=>{
  User.find()
  .then(found=>{
      res.render('db',{allDB:found});
  })
})
  
app.get('/login',(req, res) => {
res.render('login');
});
  
app.get('/register',(req, res) => {
res.render('register');
});



app.post('/register',(req,res)=>{

    const UserName=req.body.username;
    const Password=req.body.password;
    bcrypt.hash(Password,saltRounds,function(err,hash){

        const newRegister = new User({
            email: UserName,
            password: hash
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

})




app.post('/login',(req,res)=>{
    const UserName=req.body.username;
    const Password=req.body.password;
    
    const emailPrefix=UserName.split('@')[0];
    User.findOne({email:UserName})
    .then(found=>{

        bcrypt.compare(Password, found.password,function(err,result){
            if (result===true && found.email===UserName){
                res.render('secrets',{userName:emailPrefix});
            }else{
                console.log("login failed invalid email or password");
            }
        })
        // if(found.email===UserName && found.password===Password){
        //     res.render('secrets',{userName:emailPrefix});

        // }else{
        //     // res.render('register', { errorMessage: "invalid email or password"});
        //     console.log('invalid login')
        // }
    })
    .catch(error=>{
        console.log(error);
        console.log("invalid email");
    });
})
  
app.listen(3000,function(){
console.log(`Server running on port 3000`);
})
