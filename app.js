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

User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.get("/", (req,res) => {
    res.render("home")
})

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

