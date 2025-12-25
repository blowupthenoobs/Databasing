const express = require("express");
const cors = require("cors");
const app = express();

// const mysql = require("mysql2");
const db = require('./models');

const { User } = require('./models')
const { Token } = require('./models')

app.use(
    cors({
        origin: 'https://blowupthenoobs.dev',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true
    })
)

app.use(express.json())


//#region Testing
app.get("/select", async (req, res) => {
    User.findAll({ where: {email: "testing123@gmail.com"}}) //Where is optional, makes it only show results with the matching data
        .then((users) => {
            res.send(users);
        })
        .catch((err) => {
            console.error("Error in /select: ", err);
        });
});

app.post("/insert", async (req, res) => {
    // User.create({
    //     username: req.body.username,
    //     email: req.body.email,
    //     password: req.body.password,
    //     passwordLastModified: Date.now()
    // }).catch((err) => {
    //     if(err) {
    //         console.log(err);
    //     }
    // })

    res.send('insert');
});

app.get("/tokening", async (req, res) => {
    try {
        const user = await User.findOne({where: {email: "testing123@gmail.com"}})

        if(!user)
            return res.status(404).send("user not found");

        const token = await user.createToken({
            token: "this is a token",
            uuid: "this is a uuid", //req.header.uuid works on the original website for whatever reason
            time: Date.now(),
            type: "temporary"
        })

        res.send(token)
    } catch (err) {
        console.error(err)
        res.status(500).send("error creating token")
    }
});

app.get("/delete", async (req, res) => {
    User.destroy({ where: {id: 0}})
    res.send('destroy');
});
//#endregion Testing

//#region UserAPI
app.post("/user-service/create", async (req, res) => {
    User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        passwordLastModified: Date.now()
    }).catch((err) => {
        if(err) {
            console.log(err);
        }
    })

    res.send('inserted new user');
});

app.post("/user-service/login", async (req, res) => {
    

    res.send('inserted new user');
});

app.post("/user-service/find-by-creds", async (req, res) => {
    try {
        const user = await User.findOne({where: {email: req.body.email}});
        console.log(user);
        res.send(user);
    } catch(error) {
        console.error(error);
    }
})
//#endregion UserAPI

db.sequelize.sync().then((req) => {
  app.listen(3001, () => {
    console.log("server running")
  })
})


//run "node index.js" to start the server