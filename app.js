const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")

const app = express()
const PORT = "3000"
const MONGOOSE_PORT = "27017"
const mongoose_con = "mongodb://localhost:" + MONGOOSE_PORT + "/userDB"

app.use(express.static("public"))
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}))

mongoose.connect(mongoose_con)

const userSchema = {
    email: String,
    password: String
}

User = new mongoose.model("User", userSchema)

app.get("/", (req,res) => {
    res.render("home")
})

app.get("/login", (req,res) => {
    res.render("login")
})

app.get("/register", (req,res) => {
    res.render("register")
})

app.post("/register", (req,res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })

    newUser.save().then(() => {
        res.render("secrets")
    }).catch((err) => {
        console.log(err)
    })
})

app.post("/login", (req,res) => {
    const username = req.body.username
    const password = req.body.password

    User.findOne({email: username}).then((foundUser) => {
        if (foundUser.password === password){
            res.render("secrets")
        }
    }).catch((err) => {
        console.log(err)
    })
})



app.listen(PORT, () => {
    console.log("Successfully started server on port: " + PORT)
})