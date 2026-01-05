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
const { Blog } = require('./models')

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
            terminalCode: "blogwrite",
            route: "/tools/blogging",
            hasNoPrerequisites: false
        })
        res.send(newSecret);
    } catch(error) {
        console.log(error);
        res.status(500).send("error making secret: ", error.toString());
    }
    
})

app.get("/prereq", async (req, res) => {
    try {
        const newPreRequisite = await PrerequisiteCode.create({
            code: "admin"
        })
        res.send(newPreRequisite);
    } catch (error) {
        console.log(error)
        res.status(500).send("error making prerequisite: ", error.toString());
    }
})

app.get("/bindPreReqs", async (req, res) => {
    try {
        const secretToBind = await Secret.findOne({where: {terminalCode: "blogwrite"}}) //The secret you want to add a prerequisite to
        const preReqToBind = await PrerequisiteCode.findOne({where: {code: "admin"}}) //Code of previous entry

        secretToBind.addPrerequisite(preReqToBind);
        res.send("success")
    } catch (error) {
        console.log(error);
        res.send("error making binding");
    }
})

app.get("/binduser", async (req, res) => {
    try {
        const preReqToBind = await PrerequisiteCode.findOne({where: {code: "admin"}}) //Code of previous entry
        const userToBind = await User.findOne({where: {email: "jeremiah122508@gmail.com"}}) //My email

        preReqToBind.addUser(userToBind);
        res.send(preReqToBind);
    } catch (error) {
        console.log(error)
        res.send("error making binding")
    }
})

app.get("/find-prereqs", async (req, res) => {
    try {
        const secretToLookAt = await Secret.findOne({where: {terminalCode: "welcome"}})
        const preReqs = await secretToLookAt.getPrerequisites()

        res.send(preReqs);
    } catch (error) {
        console.log(error);
        res.send("error finding prereqs");
    }
})

app.get("/blog", async (req, res) => {
    try {
        const newBlog = await Blog.create({
            title: "Testing",
            content: "Here's the body text for the first blog thumbnail, just to get a feel for how it'll look like later",
            blogType: "blog"
        })
        res.send(newBlog);
    } catch (error) {
        console.log(error);
        res.send("error making blog");
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

        const newDiscoveredPath = await PrerequisiteCode.findOne({where: {code: "accounting"}})
        newDiscoveredPath.addUser(newUser);

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

app.post("/user-service/get-username", async (req, res) => {
    try{
        const user = await GetUserWithToken(req.body.token);

        res.send(user.username)
    } catch (error) {
        console.log(error);
        res.send("unknown user")
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

async function GetUserWithToken(key)
{
    const token = await Token.findOne({where: {token: Hashify(key)}})

    const user = await User.findByPk(token.userId);
    return user;
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
        
        const user = await GetUserWithToken(req.body.token);

        if(!user)
            res.send("");
        
        const preRequisite = await secret.getPrerequisites();

        for(i = 0; i < preRequisite.length; i++)
        {
            const hasPreReq = await preRequisite[i].hasUser(user);
            if(!hasPreReq)
                res.send("")
        }
        
        res.send(secret.route);
    } catch(error) {
        res.send("")
    }
})

app.post("/check-perms-for-route", async (req, res) => {
    try {
        const user = await GetUserWithToken(req.body.token);

        const secret = await Secret.findOne({where: {route: req.body.route}})

        if(!user)
            res.send("bump");
        
        const preRequisite = await secret.getPrerequisites();
        console.log(preRequisite)

        for(i = 0; i < preRequisite.length; i++)
        {
            const hasPreReq = await preRequisite[i].hasUser(user);
            if(!hasPreReq)
                res.send("bump")
        }
        
        res.send("hasPerms");
    } catch (error) {
        console.log(error);
        res.send("bump");
    }
})
//#endregion SecretMachine

//#region Blogging
app.get("/get-blogs", async (req, res) => {
    try {
        const blogs = await Blog.findAll({where: {blogType: "blog"}}, {order:[["createdAt", "DESC"]]})
        res.send(blogs);
    } catch (error) {
        console.log(error);
        res.status(500).send("error with getting blogs");
    }
})

app.get("/get-recent-blog", async (req, res) => {
    try {
        const blogs = await Blog.findOne({where: {blogType: "blog"}}, {order:[["createdAt", "DESC"]]})
        res.send(blogs);
    } catch (error) {
        console.log(error);
        res.status(500).send("error with getting blogs");
    }
})

app.post("/get-blog", async (req, res) => {
    try {
        const blog = await Blog.findOne({where: {title: req.body.article}});
        res.send(blog);
    } catch (error) {
        console.log("Error sending blog: ", error);
        res.status(500).send("error sending blog");
    }
})

app.post("/post-blog", async (req, res) => {
    try {
        const blog = await Blog.create({
            title: req.body.title,
            content: req.body.content,
            blogType: req.body.blogType
        })

        res.send("/" + blog.title);
    } catch (error) {
        console.log("error creating blog: ", error);
        res.status(500).send("error creating blog")
    }
})
//#endregion Blogging

db.sequelize.sync().then((req) => {
  app.listen(3001, () => {
    console.log("server running")
  })
})


//run "node index.js" to start the server