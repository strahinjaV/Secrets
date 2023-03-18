///////////////READ ME PLEASE//////////////////////////////
//the .login() and /logout() are both methods from passport
//the authentication methods are from the express-session

require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const findOrCreate = require("mongoose-findorcreate")

const app = express()
const PORT = "3000"
const MONGOOSE_PORT = "27017"
const mongoose_con = "mongodb://localhost:" + MONGOOSE_PORT + "/userDB"

app.use(express.static("public"))
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}))

app.use(session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize())
app.use(passport.session())


mongoose.connect(mongoose_con)

const userSchema = mongoose.Schema({
    email: String,
    password: String
})

userSchema.plugin(passportLocalMongoose) //this plugin will be doing the hashing and salting of the passwords
userSchema.plugin(findOrCreate)

User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy())
passport.serializeUser(function(user, done) {
    done(null, user.id)
})
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user)
    })
})

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    //userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"  //this may or may not need to be in here beacuase this was necessary to add because at the time of the tutorial google+ was being shut down, and this redirected to another page to grab useer info rather than passport grabbing it from google+ which it used to do by defualt, however i am doing this in 2023 where passport is updated and google+ is long gone so i may comment it out completely
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {  //findorcreate is not an actual mongoose function but it was sudo code in the passport documentation (for a mongoose function to be made), however there is a npm package nameed mongoose-findorcreate which actually implements that function which we are going to use 
      return cb(err, user);
    });
  }
));


app.get("/", (req,res) => {
    res.render("home")
})

app.get("/auth/google",
    passport.authenticate("google", {scope: ["profile"] })
)

app.get("/auth/google/secrets", 
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
        //successful authentication
        res.redirect("/secrets")
    }
)

app.get("/login", (req,res) => {
    res.render("login")
})

app.get("/register", (req,res) => {
    res.render("register")
})

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()){    //
        res.render("secrets")
    }else {
        res.redirect("/login")
    }
})

app.get("/logout", (req,res) => {
    req.logout((err) => {
        if (err) console.log(err)
        else res.redirect("/")
    })
    
})

app.post("/register", (req,res) => {
   User.register({username: req.body.username}, req.body.password, (err, user) => {
    if (err) {
        console.log(err)
    }else {
        passport.authenticate("local")(req, res, () => {  //authentication type is "local" and the callback is called only if it was a success
            res.redirect("/secrets")
        })
    }
   })
})

app.post("/login", (req,res) => {
   const user = new User({
    username: req.body.username,
    password: req.body.password
   })

   req.login(user, (err) => {
    if (err){
        console.log(err)
    }else {
        passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets")
        })
    }
   })
})



app.listen(PORT, () => {
    console.log("Successfully started server on port: " + PORT)
})

