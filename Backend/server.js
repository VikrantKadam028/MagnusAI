import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./config/db.js";
import { User } from "./models/User.js";
import bodyParser from "body-parser";
import session from "express-session";
import nodemailer from "nodemailer";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.json()); // already needed
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "../Frontend/views/auth"),
  path.join(__dirname, "../Frontend/views/templates"),
]);

app.use("/public", express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "vikrantkk2889@gmail.com", // your Gmail
    pass: "lfwmrwqbnprshiif",
  },
});

app.use(
  session({
    secret: "MagnusSecret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 },
  })
);

// === Root Route ===
app.get("/", (req, res) => {
  if (req.session.user) {
    // If user is already logged in, redirect to dashboard
    return res.redirect("/dashboard");
  }
  // Otherwise, redirect to the registration page
  res.redirect("/register");
});

// === Register Page ===
app.get("/register", (req, res) => {
  // If user is already logged in, redirect to dashboard
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("register", { successMessage: undefined });
});

// === Register Handler ===
app.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body; // FIXED

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const newUser = new User({ fullName, email, password }); // FIXED
    await newUser.save();

    const mailOptions = {
      from: '"MagnusAI" <vikrantkk2889@gmail.com>',
      to: email,
      subject: "Verify your MagnusAI account",
      html: `
          <h3>Welcome, ${fullName}!</h3>
          <p>Thank you for registering with MagnusAI.</p>
          <p>Click the button below to verify your account and log in:</p>
          <a href="http://localhost:3000/login" style="
            padding: 10px 15px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
          ">Login Now</a>
          <p>If you didn't register, you can ignore this email.</p>
        `,
    };

    await transporter.sendMail(mailOptions);

    res.render("register", {
      successMessage: "User registered. Please check your email to log in.",
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// === Login Page ===
app.get("/login", (req, res) => {
  // If user is already logged in, redirect to dashboard
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("login");
});
app.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (user) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error("Error checking email:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.render("dashboard", {
    fullName: req.session.user.fullName,
  });
});

// === Login Handler ===
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (!user) {
    return res.status(401).send("Invalid email or password");
  }

  req.session.user = {
    id: user._id,
    email: user.email,
    fullName: user.fullName, // <-- Add this line
  };

  res.redirect("/dashboard");
});
app.post("/api/enhance", async (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Rewrite this prompt professionally in one paragraph. Avoid line breaks, bullet points, and any special characters like *, -, or newlines: "${prompt}"`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    let enhanced =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Enhancement failed.";

    enhanced = enhanced
      .replace(/[\n\r]/g, " ")
      .replace(/[*\-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    res.json({ enhanced });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to enhance prompt." });
  }
});

// === Build Page Route ===
app.get("/build", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const prompt = req.query.prompt || "";
  res.render("build", {
    fullName: req.session.user.fullName,
    prompt: prompt
  });
});


// === Logout ===
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

const port = 3000;
app.listen(port, () =>
  console.log(`MagnusAI running at http://localhost:${port}`)
);
