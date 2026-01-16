import express from 'express';
import pg from 'pg';
import bodyParser from 'body-parser';
import passport from 'passport';
import { Strategy } from 'passport-local';
import session from 'express-session';
import flash from "connect-flash";
import dotenv from "dotenv";
dotenv.config();





const app = express();

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database:  process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

db.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('Database connection error', err));


app.use(bodyParser.urlencoded({extended:true}));
app.use(express.json());
app.use(session({
  secret: 'hoooooo',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
  res.locals.error = req.flash("error");
  next();
});


app.set("view engine", "ejs");


app.use(express.static("public"));

app.get('/', (req, res) => {
    res.render("intro/start.ejs")
});

app.get('/accounts',(req,res)=>{
    res.render("intro/accounts.ejs")
})
app.get('/about',(req,res)=>{
    res.render("intro/about.ejs");
})
app.get('/open-account',(req,res)=>{
    res.render("intro/open-account.ejs")
})

app.get('/personal-banking',(req,res)=>{
    if(req.isAuthenticated()){
        return res.redirect('/home');
    }else{
    res.render("intro/personal-banking.ejs");
    }
})

app.get('/home',async (req,res)=>{

    if(req.isAuthenticated()){
        const result = await db.query(
        "SELECT balance FROM customer WHERE id = $1",
        [req.user.id]
    );

        res.render("postLogin/home.ejs",{user: req.user, balance: result.rows[0].balance});
    }else{
        res.redirect('personal-banking')
    }
});

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }

    req.session.destroy(() => {
      res.redirect("/personal-banking");
    });
  });
});


app.get("/transfer", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/personal-banking");
  }
  res.render("postLogin/transfer.ejs");
});



app.get("/confirm", async (req, res) => {

  if(req.isAuthenticated){
  const receiverMobile = req.query.mobile;

  try{
    const query = `SELECT fullName, mobNo FROM customer WHERE mobNo = $1`;
    const result = await db.query(query,[receiverMobile]);
    if(result.rows.length === 0){
        return res.redirect("/transfer");
    }

    const secQuery= `SELECT balance from customer WHERE mobno = $1`;
    const secResult = await db.query(secQuery,[req.user.mobno]);
    

    const receiverName = result.rows[0].fullname;
    const senderName = req.user.fullname;
    const bankName = 'ABC Bank';
    const balance = secResult.rows[0].balance;
    res.render("postLogin/confirm.ejs", { receiverMobile,receiverName,amount:0,senderName,bankName,balance });
  }catch(e){
    
  }
  
  }
});

app.get("/transactions", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/personal-banking");
  }

  const userId = req.user.id;

  try {
    const result = await db.query(
      `
      SELECT 
        t.id,
        t.amount,
        t.status,
        t.created_at,
        t.sender_id,
        t.receiver_id,
        s.fullname AS sender_name,
        r.fullname AS receiver_name
      FROM transactions t
      JOIN customer s ON t.sender_id = s.id
      JOIN customer r ON t.receiver_id = r.id
      WHERE t.sender_id = $1 OR t.receiver_id = $1
      ORDER BY t.created_at DESC
      `,
      [userId]
    );

    res.render("postLogin/transactions", {
      transactions: result.rows,
      userId
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load transactions");
  }
});


app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/personal-banking");
  }

  res.render("postLogin/profile", {
    user: req.user
  });
});


app.post("/search-user", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { mobile } = req.body;

  const result = await db.query(
    "SELECT fullname, mobNO FROM customer WHERE mobNO = $1",
    [mobile]
  );

  if (result.rows.length === 0) {
    return res.json({ found: false });
  }
  const user = result.rows[0];

  

  if (req.user.mobno === mobile && req.user.fullname === user.fullname){
    return res.json({found: false});
  }

  res.json({
    found: true,
    name: user.fullname,
    mobile: user.mobno
  });
});



app.post("/personal-login", passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/personal-banking',
  failureFlash: true
}));

passport.use(new Strategy({ usernameField: "mobile" },async function(mobile,password,cb){
    try{
    const query = 'SELECT * FROM customer WHERE mobNO = $1';
    const result = await db.query(query, [mobile]);

    if (result.rows.length == 0){
        return cb(null,false,{message: 'This number is not registerd with us.'})
    }

    const user = result.rows[0];

    if (user.password !== password){
        return cb(null,false, {message:'Incorrect password.'})
    }else{
        console.log("✅ Login successful for mobile:", mobile);
        return cb(null,user);
    }

    
  }catch(e){
    console.log(e);
    return cb(null,false);
  }
}));
app.post("/pay", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/personal-banking");
  }

  const senderId = req.user.id;
  const { receiverMobile, amount } = req.body;
  const transferAmount = Number(amount);

  if (transferAmount <= 0) {
    return res.status(400).send("Invalid amount");
  }


  try {
    await db.query("BEGIN");

    // 🔒 Lock sender
    const senderResult = await db.query(
      "SELECT balance FROM customer WHERE id = $1 FOR UPDATE",
      [senderId]
    );

    if (senderResult.rows.length === 0) {
      throw new Error("Sender not found");
    }

    if (senderResult.rows[0].balance < transferAmount) {
      throw new Error("Insufficient balance");
    }

    // 🔒 Lock receiver
    const receiverResult = await db.query(
      "SELECT id, fullname FROM customer WHERE mobno = $1 FOR UPDATE",
      [receiverMobile]
    );

    if (receiverResult.rows.length === 0) {
      throw new Error("Receiver not found");
    }

    const receiverId = receiverResult.rows[0].id;
    const receiverName = receiverResult.rows[0].fullname;

    // 💸 Deduct sender
    await db.query(
      "UPDATE customer SET balance = balance - $1 WHERE id = $2",
      [transferAmount, senderId]
    );

    // 💰 Credit receiver
    await db.query(
      "UPDATE customer SET balance = balance + $1 WHERE id = $2",
      [transferAmount, receiverId]
    );

    // 🧾 Record transaction + get ID
    const txnResult = await db.query(
      `INSERT INTO transactions (sender_id, receiver_id, amount, status)
       VALUES ($1, $2, $3, 'SUCCESS')
       RETURNING id`,
      [senderId, receiverId, transferAmount]
    );

    const transactionId = txnResult.rows[0].id;

    await db.query("COMMIT");

    // ✅ Render success page with REAL transaction ID
    res.render("postLogin/payment-success.ejs", {
      amount: transferAmount,
      receiverName,
      txnId: transactionId
    });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ Payment failed:", err.message);
    res.status(400).send(err.message);
  }
});




passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
// 404 handler (ALWAYS LAST)
app.use((req, res) => {
  res.status(404).render("404");
});




app.listen(3000,()=>{
    console.log("Server is running at port 3000");
})