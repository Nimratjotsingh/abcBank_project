
# 🏦 ABC Bank – Full Stack Banking Application

ABC Bank is a **full-stack banking web application** built to simulate real-world banking workflows such as authentication, money transfers, transaction history, and secure backend logic.

This project focuses on **correct backend architecture**, **database safety**, and **bank-grade user flows**, rather than just UI.

---

## 🚀 Features

### 🔐 Authentication & Sessions
- Personal banking login using **Passport.js**
- Session-based authentication
- Protected routes for logged-in users

### 🏦 Account Dashboard
- Welcome dashboard with user details
- Account number display
- Balance handling (prepared for DB expansion)

### 💸 Money Transfer System
- Transfer money between users using mobile number
- **Database transactions (BEGIN / COMMIT / ROLLBACK)**
- Row locking (`FOR UPDATE`) to prevent double spending
- Insufficient balance checks
- Secure transaction recording

### 🧾 Transaction History
- View all debit & credit transactions
- Clear debit / credit differentiation
- Sorted by latest transactions
- Real-world SQL joins for sender/receiver mapping

### ✅ Payment Flow
- Transfer confirmation screen
- Payment success page with transaction ID
- Ready for OTP / limits extension

### 👤 Profile Page
- Read-only profile (bank-style)
- Account & personal details
- Secure presentation

---

## 🛠 Tech Stack

**Frontend**
- EJS (Server-Side Rendering)
- HTML, CSS, JavaScript

**Backend**
- Node.js
- Express.js
- Passport.js (Local Strategy)
- Express Sessions

**Database**
- PostgreSQL
- SQL Transactions
- Parameterized Queries (SQL Injection safe)

---

## 📂 Project Structure

```

project-root/
│
├── app.js
├── package.json
├── .env
├── .gitignore
├── README.md
│
├── views/
│   ├── intro/
│   └── postLogin/
│
├── public/
│   ├── css/
│   └── js/
│
└── database/

````

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000

DB_USER=postgres
DB_HOST=localhost
DB_NAME=abcBank
DB_PASSWORD=your_db_password
DB_PORT=5432

SESSION_SECRET=your_session_secret
````

⚠️ **Do not commit `.env` to GitHub**

---

## ▶️ How to Run Locally

1. Clone the repository:

```bash
git clone https://github.com/your-username/your-repo-name.git
```

2. Install dependencies:

```bash
npm install
```

3. Setup PostgreSQL database and tables

4. Start the server:

```bash
node app.js
```

5. Open in browser:

```
http://localhost:3000
```

---

## 🧠 Learning & Transparency

I want to be transparent — **where I faced blockers or needed clarity, I did take the help of AI**.
However, **every feature was implemented, tested, and fully understood by me**.

This is a **fully working project**, not a UI mock or tutorial copy.
The focus was on learning **real backend flows**, **safe database operations**, and **production-style architecture**.

---

## 🔐 Future Enhancements

* OTP verification for transfers
* Daily transaction limits
* Password hashing with bcrypt
* Transaction receipts (PDF)
* Pagination & filters for transactions
* Deployment (Render / Railway)

---

## 📸 Screenshots

Screenshots of the application flow are added in the repository / LinkedIn post to showcase UI and functionality.

---

## 📄 License

This project is for learning and demonstration purposes.

---

## 🙌 Acknowledgements

* PostgreSQL Documentation
* Express.js & Passport.js Docs
* Open-source community

```

---