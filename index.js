const express = require("express");
const cors = require("cors");
const app = express();

const crypto = require("crypto");

// const mysql = require("mysql2");
const db = require('./models');

const { User } = require('./models')
const { Token } = require('./models')
const { Secret } = require('./models')
const { PrerequisiteCode } = require('./models')

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

        const tokenInfo = await CreateUniqueToken();

        const token = await user.createToken({
            token: tokenInfo.newCodeHash,
            uuid: "this is a uuid", //req.header.uuid works on the original website for whatever reason
            time: Date.now(),
            type: "temporary"
        })

        res.send(tokenInfo.newCode)
    } catch (err) {
        console.error(err)
        res.status(500).send("error creating token")
    }
});

app.get("/delete", async (req, res) => {
    User.destroy({ where: {id: 0}})
    res.send('destroy');
});

app.get("/secreting", async (req, res) => {
    try {
        const newSecret = await Secret.create({
            terminalCode: "hackclub",
            route: "/hackclub",
            hasNoPrerequisites: true
        })
        res.send(newSecret);
    } catch(error) {
        console.log(error);
        res.status(500).send("error making secret: ", error.toString());
    }
    
})
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
    try{
        const attemptedUser = await User.findOne({where: {email: req.body.email}});

        if(!attemptedUser)
            throw new NotAuthorizedError("Invalid Credentials")

        if(attemptedUser.password !== req.body.password)
            throw new NotAuthorizedError("Invalid Credentials")

        const userToken = await CreateNewToken(attemptedUser.id);
        return res.send(userToken);
    } catch(error) {
        console.log(error);
        
        if(error instanceof NotAuthorizedError)
            return res.status(401).send("Invalid Credentials")

        return res.status(500).send("Login Failed: ", error)
    }
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

app.post("/user-service/refresh-login-token", async (req, res) => {
    try {
        const token = await Token.findOne({where: {token: crypto.createHash("sha256").update(req.body.token).digest("hex")}})

        if(!token)
            return res.sendStatus(204);

        const refreshedToken = await CreateNewToken(token.userId);

        token.destroy()
        return res.send(refreshedToken)
    } catch(error) {
        return res.status(500).send("error refreshing token: ", error);
    }
})

//#endregion UserAPI

//#region Tokening
async function CreateNewToken(identifier)
{
    try {
        const user = await User.findByPk(identifier);

        if(!user)
            return res.status(404).send("user not found");

        const tokenInfo = await CreateUniqueToken();

        const token = await user.createToken({
            token: tokenInfo.newCodeHash,
            time: Date.now(),
        })

        return tokenInfo.newCode
    } catch (err) {
        console.error(err)
        res.status(500).send("error creating token")
    }
}

function generateToken()
{
    return crypto.randomBytes(32).toString("hex");
}

async function CreateUniqueToken()
{
    const MaxTries = 20;

    for(let i = 0; i < MaxTries; i++)
    {
        const newCode = generateToken();
        const newCodeHash = crypto.createHash("sha256").update(newCode).digest("hex");

        const codeAlreadyUsed = await Token.findOne({where: {token: newCodeHash}});
        if(!codeAlreadyUsed)
        {
            return {newCode, newCodeHash};
        }
    }

    throw new Error("Failed to generate unique Token");
}


//#endregion Tokening

//#region SecretMachine
app.post("/check-secret", async (req, res) => {
    try {
        const secret = await Secret.findOne({where: {terminalCode: req.body.terminalCode}})

        if(secret.hasNoPrerequisites)
            res.send(secret.route); //Will also need to attach the corresponding prerequisite to the user
    } catch(error) {
        res.send("")
    }
})


//#endregion SecretMachine

db.sequelize.sync().then((req) => {
  app.listen(3001, () => {
    console.log("server running")
  })
})


//run "node index.js" to start the server