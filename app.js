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
// const GoogleStrategy = require("passport-google-oauth20").Strategy
// const findOrCreate = require("mongoose-findorcreate")

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
    password: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose) //this plugin will be doing the hashing and salting of the passwords
// userSchema.plugin(findOrCreate)

User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy())
passport.serializeUser(function(user, done) {
    done(null, user.id)
})
passport.deserializeUser(function(id, done) {
    User.findById(id)
        .then(user => done(null, user))
        .catch(err => done(err, null))
})

// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/secrets",
//     //userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"  //this may or may not need to be in here beacuase this was necessary to add because at the time of the tutorial google+ was being shut down, and this redirected to another page to grab useer info rather than passport grabbing it from google+ which it used to do by defualt, however i am doing this in 2023 where passport is updated and google+ is long gone so i may comment it out completely
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     console.log(profile)
//     User.findOne({googleId: profile.id}).then((user) => {

//         if (!user){ //if there is no user found create one 
//             const newuser = new User({
//                 username: "",
//                 password: "",
//                 googleId: profile.id
//             })

//             newuser.save().then(() => {
//                 return cb(err, user)
//             }).catch((err) => {
//                 console.log(err)
//             })
//         } else {
//             //found a user 
//             res.redirect("/secrets")
//         }
//     }).catch((err) => {
//         console.log(err)
//     })
//   }
// ))


app.get("/", (req,res) => {
    res.render("home")
})

// app.get("/auth/google",
//     passport.authenticate("google", {scope: ["profile"] })
// )

// app.get("/auth/google/secrets", 
//     passport.authenticate("google", { failureRedirect: "/login" }),
//     function(req, res) {
//         //successful authentication
//         res.redirect("/secrets")
//     }
// )

app.get("/login", (req,res) => {
    res.render("login")
})

app.get("/register", (req,res) => {
    res.render("register")
})

app.get("/secrets", (req, res) => {
    //looks through all users and finds the secrets field making sure to retrun only the ones that are not equal to null  ($ne: null)
    User.find({"secret": {$ne: null}})
        .then(foundUsers => {
            res.render("secrets", {usersWithSecrets: foundUsers})
        })
        .catch(err => {
            console.log(err)
        })
 })

app.get("/submit", (req,res) => {
    if (req.isAuthenticated()){    
        res.render("submit")
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

app.post("/submit", (req,res) => {
    const submittedSecret = req.body.secret

    //passport saves the users session details into the req variable 
    User.findById(req.user.id)
    .then(foundUser => {
        if (foundUser) {
            foundUser.secret = submittedSecret
            foundUser.save()
                     .then(() => {
                        res.redirect("/secrets")
                     })
                     .catch(err => {
                        console.log(err)
                     })
        }
    })
    .catch(err => {
        console.log(error)
    })
})



app.listen(PORT, () => {
    console.log("Successfully started server on port: " + PORT)
})

