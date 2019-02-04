require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 5050;
const massive = require("massive");
const session = require("express-session");
const bcrypt = require('bcryptjs');
const { json } = require('body-parser');

// const hash = bcrypt.hashSync("password", 12);
// console.log(hash);
// console.log(bcrypt.compareSync("password", hash));
app.use(json());
app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: false
  })
);

massive(process.env.CONNECTION_STRING).then(dbInstance => {
  console.log("Database connected");
  app.set("db", dbInstance);
});

app.post('/auth/register', async (req, res) => {
  const { username } = req.body;
  try {
  const password = await bcrypt.hash(req.body.password, 12);
  const result = await req.app
    .get('db')
    .auth_user
    .insert({username, password});

  req.session.user = { username: result.username };
  res.json({ username: result.username });
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: "password is incorrect" });
  }
});

app.post('/auth/login', async (req, res) => {
  try{
    const result = await req.app
      .get('db')
      .auth_user.findOne({username: req.body.username});

    if(!result) {
      res.status(500).json({error: "Please register"})
    } else {
      const isCorrect = await bcrypt.compare(req.body.password, result.password);
      if (isCorrect) {
        req.session.user = { username: result.username };
        res.status(200).json(req.session.user);
      } else {
        res.status(401).json({ error: "Incorrect password" })
      }
    }
  } catch(err) {
    console.log(err);
    res.status(500).json({error: "password is incorrect"});
  }
})

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
