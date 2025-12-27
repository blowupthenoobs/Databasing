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


//#region ManualShenanigans
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
//#endregion ManualShenanigans

//#region UserAPI
app.post("/user-service/create", async (req, res) => {
    try {
        const attemptedPassword = req.body.password;

        if(attemptedPassword.length < 6 || attemptedPassword.length > 256)
            throw new Error("Password must be between 6 and 256 characters");

        const newUser = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: Hashify(req.body.password),
            passwordLastModified: Date.now()
        })

        const token = CreateNewToken(newUser.id)
        res.send(token);
    } catch(error) {
        console.log(error)
        res.status(500).send("Error Creating Account: ", error);
    }

    
});

app.post("/user-service/login", async (req, res) => {
    try{
        const attemptedUser = await User.findOne({where: {email: req.body.email}});

        if(!attemptedUser)
            throw new NotAuthorizedError("Invalid Credentials")

        if(attemptedUser.password !== Hashify(req.body.password))
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
        const token = await Token.findOne({where: {token: Hashify(req.body.token)}})

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
        const newCodeHash = Hashify(newCode);

        const codeAlreadyUsed = await Token.findOne({where: {token: newCodeHash}});
        if(!codeAlreadyUsed)
        {
            return {newCode, newCodeHash};
        }
    }

    throw new Error("Failed to generate unique Token");
}


//#endregion Tokening

//#region Encryption
function Hashify(input)
{
    return crypto.createHash("sha256").update(input).digest("hex")
}
//#endregion Encryption

//#region SecretMachine
app.post("/check-secret", async (req, res) => {
    try {
        const secret = await Secret.findOne({where: {terminalCode: req.body.terminalCode}})

        if(secret.hasNoPrerequisites)
            res.send(secret.route); //Will also need to attach the corresponding prerequisite to the user
        
        res.send("")
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