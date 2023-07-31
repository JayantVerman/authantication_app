require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose=require('mongoose');
const session= require('express-session');
const passport = require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate');

// const bcrypt = require('bcrypt');
// const saltRounds=10;

// const encrypt = require("mongoose-encryption");
// const md5= require("md5");  

const app = express();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));



app.use(session({
    secret:'keyboard cat',
    resave:false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

//database section deifne
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

// creating schema
const userSchema=new mongoose.Schema({
email:String,
password:String,
googleId:String,
secret:String
});

// // database encryption using key mongoose encryption
// const secretKey = process.env.SECRET;

// userSchema.plugin(encrypt,{secret : secretKey,
//      encryptedFields:["password"]});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//db model
const User=mongoose.model('User',userSchema);
  
passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
    done(null,user.id);
});
passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(error => {
            done(error, null);
        });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

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
  
app.get('/submit', (req, res) => {
    if(req.isAuthenticated()){
        res.render('submit');
    }else{
        res.redirect("/login");
    }
})

app.post('/submit',(req,res)=>{
    const secretsubmitted = req.body.secret;
    

    User.findById(req.user.id)
    .then(foundUser=>{
if(foundUser){
    foundUser.secret=secretsubmitted;
    foundUser.save()
    .then(()=>{
        res.redirect("/secrets");
    });
}
    })
    .catch(err=>{
        console.log(err);
    })
})

app.get('/login',(req, res) => {
res.render('login');
});
  
app.get('/register',(req, res) => {
res.render('register');
});

app.get('/auth/google',
    passport.authenticate('google',{scope:["profile"]})
);

app.get('/auth/google/secrets',
    passport.authenticate('google',{failureRedirect:'/login'}),function(req,res){
       //successfull authentication, redirect to secrets.
        res.redirect('/secrets');
    }
);

app.get('/secrets',(req, res) => {
    User.find({secret:{$ne:null}})
    .then(foundUser=>{
        res.render("secrets",{usersWithSecrets:foundUser});
    });
});

app.get('/logout',function(req,res){
    req.logout();
    res.redirect("/");
})


app.post('/register',(req,res)=>{

    //using passport for registration
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("secrets");
            });
        }
    });


    // const UserName=req.body.username;
    // const Password=req.body.password;
    // bcrypt.hash(Password,saltRounds,function(err,hash){

    //     const newRegister = new User({
    //         email: UserName,
    //         password: hash
    //     })
    //     const emailPrefix=newRegister.email.split('@')[0]; 
    //     // console.log(newRegister);  
    //     User.findOne({email:UserName})
    //     .then(found=>{
        
    //     if(found===null){
           
    //         newRegister.save()
    //         .then(()=>{
    //             res.render('secrets',{userName:emailPrefix});
    //         })
    //         .catch(error=>{
    //             console.log(error);
    //         }); 
            
    //     }else{
    //         console.log('already registered email id')
    //         // res.render('register', {"email is already registered":errorMessage});
    //     }
    // })
    // .catch(error=>{
    //     console.log(error);
    // }) 
    // })

})




app.post('/login',(req,res)=>{

    const user = new User({
        username : req.body.username,
        password : req.body.password,
    })
req.login(user,function(err){
    if(err){
        console.log(err);
    }else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
        });
    }
})


    // const UserName=req.body.username;
    // const Password=req.body.password;
    
    // const emailPrefix=UserName.split('@')[0];
    // User.findOne({email:UserName})
    // .then(found=>{

    //     bcrypt.compare(Password, found.password,function(err,result){
    //         if (result===true && found.email===UserName){
    //             res.render('secrets',{userName:emailPrefix});
    //         }else{
    //             console.log("login failed invalid email or password");
    //         }
    //     })
    //     // if(found.email===UserName && found.password===Password){
    //     //     res.render('secrets',{userName:emailPrefix});

    //     // }else{
    //     //     // res.render('register', { errorMessage: "invalid email or password"});
    //     //     console.log('invalid login')
    //     // }
    // })
    // .catch(error=>{
    //     console.log(error);
    //     console.log("invalid email");
    // });
})
  
app.listen(3000,function(){
console.log(`Server running on port 3000`);
})