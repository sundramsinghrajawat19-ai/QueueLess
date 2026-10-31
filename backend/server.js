
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./User");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"]
  }
});

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("A client disconnected:", socket.id);
  });
});
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Login required."
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action."
      });
    }

    next();
  };
}

function createAuthToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Customer registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, valid email, and password of at least 8 characters are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "customer"
    });

    res.status(201).json({
      success: true,
      message: "Customer account created successfully.",
      token: createAuthToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not create account."
    });
  }
});

// Login for customers and staff
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    res.json({
      success: true,
      message: "Login successful.",
      token: createAuthToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not log in."
    });
  }
});


// Available services
const services = [
  { id: 1, name: "Healthcare Clinic", waitTime: 10 },
  { id: 2, name: "College Office", waitTime: 8 },
  { id: 3, name: "Bank Counter", waitTime: 12 },
  { id: 4, name: "Government Office", waitTime: 15 }
];

// MongoDB token model
const tokenSchema = new mongoose.Schema({
  calledAt: { type: Date, default: null },
  id: { type: Number, required: true, unique: true },
  tokenNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  serviceId: { type: Number, required: true },
  serviceName: { type: String, required: true },
  peopleAhead: { type: Number, default: 0 },
  estimatedWait: { type: Number, default: 0 },
  status: { type: String, default: "waiting" },
  createdAt: { type: Date, default: Date.now }
});

const Token = mongoose.model("Token", tokenSchema);

// Atomic counter for unique token numbers
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model("Counter", counterSchema);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "QueueLess backend is running!",
    database: mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected"
  });
});

// Get available services
app.get("/api/services", (req, res) => {
  res.json({ success: true, services });
});

// Generate a queue token
app.post("/api/tokens", async (req, res) => {
  try {
    const { name, location, serviceId } = req.body;

    if (
      typeof name !== "string" || !name.trim() ||
      typeof location !== "string" || !location.trim() ||
      serviceId === undefined || serviceId === null || serviceId === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, location, and service are required."
      });
    }

    const service = services.find(
      item => item.id === Number(serviceId)
    );

    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Invalid service selected."
      });
    }

    const cleanLocation = location.trim();

    const peopleAhead = await Token.countDocuments({
      location: cleanLocation,
      serviceId: service.id,
      status: "waiting"
    });

    // Allocate a unique, persistent number in MongoDB
    const counter = await Counter.findByIdAndUpdate(
      "queueToken",
      { $inc: { seq: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    const token = await Token.create({
      id: counter.seq,
      tokenNumber: `Q${String(counter.seq).padStart(3, "0")}`,
      name: name.trim(),
      location: cleanLocation,
      serviceId: service.id,
      serviceName: service.name,
      peopleAhead,
      estimatedWait: peopleAhead * service.waitTime,
      status: "waiting"
    });
    await token.save();
await refreshQueue(cleanLocation, service.id);
    io.emit("queue-updated", {
  location: cleanLocation,
  serviceId: service.id,
});

    res.status(201).json({
      success: true,
      message: "Queue token generated successfully!",
      token
    });
  } catch (error) {
    console.error("Token creation failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not generate token. Please try again."
    });
  }
});


 // Get queue information without exposing customer names

app.get("/api/tokens", async (req, res) => {
  try {
    const tokens = await Token.find()
      .select(
        "id tokenNumber location serviceId serviceName peopleAhead estimatedWait status createdAt"
      )
      .sort({ id: 1 })
      .lean();

    res.json({ success: true, tokens });
  } catch (error) {
    console.error("Fetching tokens failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch queue tokens."
    });
  }
});


app.get(
  "/api/tokens/staff",
  authenticateToken,
  requireRole("staff", "admin"),
  async (req, res) => {
  try {
    const tokens = await Token.find()
      .select(
        "id tokenNumber name location serviceId serviceName peopleAhead estimatedWait status createdAt"
      )
      .sort({ id: 1 })
      .lean();

    res.json({ success: true, tokens });
  } catch (error) {
    console.error("Fetching staff tokens failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch staff queue tokens."
    });
  }
});





/* Find one token for customer tracking */
app.get("/api/tokens/track/:tokenNumber", async (req, res) => {
  try {
    const tokenNumber = req.params.tokenNumber.trim().toUpperCase();

    if (!/^Q\d+$/.test(tokenNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid token number, such as Q001."
      });
    }

    const token = await Token.findOne({ tokenNumber })
      .select(
        "tokenNumber serviceName location peopleAhead estimatedWait status createdAt"
      )
      .lean();

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Token not found. Please check your token number."
      });
    }

    res.json({
      success: true,
      token: {
        tokenNumber: token.tokenNumber,
        serviceName: token.serviceName,
        location: token.location,
        position: token.status === "waiting"
          ? token.peopleAhead + 1
          : null,
        estimatedWait: token.status === "waiting"
          ? token.estimatedWait
          : null,
        status: token.status,
        createdAt: token.createdAt
      }
    });
  } catch (error) {
    console.error("Token tracking failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not retrieve token information."
    });
  }
});



async function refreshQueue(location, serviceId) {
  const service = services.find(item => item.id === serviceId);
  if (!service) return;

  const calledToken = await Token.findOne({
  location,
  serviceId,
  status: "called"
}).sort({ calledAt: 1 });

const remainingTime = calledToken
  ? Math.max(
      0,
      service.waitTime -
      Math.floor((Date.now() - calledToken.calledAt.getTime()) / 60000)
    )
  : 0;

  const waitingTokens = await Token.find({
    location,
    serviceId,
    status: "waiting"
  })
    .sort({ createdAt: 1, id: 1 })
    .select("_id")
    .lean();

  for (let i = 0; i < waitingTokens.length; i++) {
    await Token.updateOne(
      { _id: waitingTokens[i]._id },
      {
        $set: {
          peopleAhead: i,
          estimatedWait: remainingTime + (i * service.waitTime)
        }
      }
    );
  }
}


app.patch(
  "/api/tokens/:id/status",
  authenticateToken,
  requireRole("staff", "admin"),
  async (req, res) => {
  try {
    const { status } = req.body;

    if (!["called", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid token status."
      });
    }

    const token = await Token.findOne({
      id: Number(req.params.id)
    });

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Token not found."
      });
    }

    if (token.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Token is already completed."
      });
    }

    if (status === "called" && token.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: "Only waiting tokens can be called."
      });
    }

    token.status = status;

if (status === "called") {
  token.calledAt = new Date();
}

if (status === "completed") {
  token.calledAt = null;
}

await token.save();

    await refreshQueue(token.location, token.serviceId);
    io.emit("queue-updated", {
  location: token.location,
  serviceId: token.serviceId,
});

    res.json({
      success: true,
      message: status === "called"
        ? "Token called successfully."
        : "Token completed successfully."
    });
  } catch (error) {
    console.error("Queue update failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not update the queue."
    });
  }
});


// Connect to MongoDB before accepting requests

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log("MongoDB connected to QueueLess!");

  server.listen(PORT, () => {
    console.log(`QueueLess backend running at http://localhost:${PORT}`);
  });
}

startServer().catch(error => {
  console.error("Backend startup failed:", error.message);
  process.exit(1);
});

