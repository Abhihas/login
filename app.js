const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3005, () => {
      console.log("Server Running ");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  let lengthofPass = password.length;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (lengthofPass < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    if (dbUser === undefined) {
      const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
      const dbResponse = await db.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

//login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    console.log(isPasswordMatched);
    console.log(dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//change

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;
  let checkForUserQuery = `
    select * from user where username='${username}';`;
  let dbUser = await db.get(checkForUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    let isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isValidPassword === true) {
      let lengthOfNewPassword = newPassword.length;
      if (lengthOfNewPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        let encryptedPassword = await bcrypt.hash(newPassword, 10);
        let updatePasswordQuery = `
                update user
                set password='${encryptedPassword}'
                where username='${username}';`;
        await db.run(updatePasswordQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
