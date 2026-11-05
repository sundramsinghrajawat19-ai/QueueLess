
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

const allowedOrigins = [
  "http://localhost:5173",
  "https://queueless-frontend-7kda.onrender.com"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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

app.use(cors({ origin: allowedOrigins }));
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
  customerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: false
},
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
app.post(
  "/api/tokens",
  authenticateToken,
  requireRole("customer"),
  async (req, res) => {
  try {
    const { location, serviceId } = req.body;

const customer = await User.findById(req.user.userId);

if (!customer || customer.role !== "customer") {
  return res.status(401).json({
    success: false,
    message: "Customer account not found. Please log in again.",
  });
}

const name = customer.name;

    if (
  typeof location !== "string" || !location.trim() ||
  serviceId === undefined || serviceId === null || serviceId === ""
) {
  return res.status(400).json({
    success: false,
    message: "Location and service are required."
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
      customerId: customer._id,
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
// Get tokens belonging to the logged-in customer
app.get(
  "/api/tokens/my",
  authenticateToken,
  requireRole("customer"),
  async (req, res) => {
    try {
      const tokens = await Token.find({
        customerId: req.user.userId,
      })
        .select(
          "id tokenNumber location serviceId serviceName peopleAhead estimatedWait status createdAt"
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        tokens,
      });
    } catch (error) {
      console.error("Customer tokens fetch failed:", error.message);

      res.status(500).json({
        success: false,
        message: "Could not fetch your queue tokens.",
      });
    }
  }
);

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


app.post("/api/ai/public-chat", async (req, res) => {
  try {
    const message = req.body.message?.trim();

    if (!message || message.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message of up to 500 characters."
      });
    }

    const question = message.toLowerCase();

    // Built-in answers for common QueueLess questions
    const faq = [
      {
        keywords: ["reduce waiting", "less waiting", "waiting time", "wait time"],
        reply:
          "To reduce waiting, join the digital queue early, check your live token position in My Queue, and arrive near your estimated turn. QueueLess shows estimated waiting times, but actual times can change."
      },
      {
        keywords: ["join", "get token", "take token"],
        reply:
          "To join a queue, open QueueLess, select the service you need, and tap Join Queue. Your token and estimated waiting time will be displayed."
      },
      {
        keywords: ["track", "token status", "my token", "position"],
        reply:
          "Log in to QueueLess and open My Queue to check your token, queue position, and estimated waiting time."
      },
      {
        keywords: ["how does queueless work", "what is queueless", "about queueless"],
        reply:
          "QueueLess is a digital queue management system. It lets customers join a service queue, receive a token, and track their queue position and estimated waiting time without standing in a physical line."
      },
      {
        keywords: ["cancel", "leave queue"],
        reply:
          "If you want to leave a queue, log in and open My Queue. Check your token's available options to cancel it."
      },
      {
  keywords: ["turn is called", "token is called", "called my token"],
  reply:
    "When your token is called, follow the instructions shown by the service and proceed to the assigned counter. Keep an eye on your QueueLess status so you don't miss your turn."
},
{
  keywords: ["late", "miss my turn", "missed my turn"],
  reply:
    "If you arrive late or miss your turn, contact the service staff. They can tell you whether your token can still be served or whether you need to join the queue again."
},
{
  keywords: ["queue position", "people ahead", "place in queue"],
  reply:
    "Your queue position shows how many customers are ahead of you. Check My Queue for your latest position and estimated waiting time. These estimates can change as the queue moves."
},
{
  keywords: ["what services", "available services", "which services"],
  reply:
    "QueueLess displays the services available at your selected location. Open the Join Queue page to see the services you can currently select."
}
    ];

    const matchedFAQ = faq.find(item =>
      item.keywords.some(keyword => question.includes(keyword))
    );

    if (matchedFAQ) {
      return res.json({
        success: true,
        reply: matchedFAQ.reply
      });
    }

    // Use Gemini for other relevant questions
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        reply:
          "I can help with joining a queue, tracking your token, and understanding waiting times. Try asking me one of those questions."
      });
    }

    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `
You are QueueLess AI, a friendly assistant on the QueueLess
digital queue management website.

Answer only questions about QueueLess and digital queue management.
Keep answers concise and friendly.

Never invent live queue positions, waiting times, or token details.
Never claim to create, cancel, or modify tokens.
Never request passwords, OTPs, or payment details.
For personal token questions, direct users to log in and check My Queue.

Visitor question: ${message}
`
    });

    return res.json({
      success: true,
      reply: response.text
    });
  } catch (error) {
    console.error("Public AI chat error:", error.message);

    return res.json({
      success: true,
      reply:
        "I'm having trouble connecting to the AI service right now. I can still help with common questions: joining a queue, tracking your token, or understanding waiting times."
    });
  }
});


app.post("/api/ai/chat", authenticateToken, requireRole("customer"), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "AI assistant is not configured."
      });
    }

    const message = req.body.message?.trim();

    if (!message || message.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message of up to 500 characters."
      });
    }

    // Get only this customer's queue tokens
    const tokens = await Token.find({
      customerId: req.user.userId
    })
      .select("tokenNumber serviceName status peopleAhead estimatedWait location")
      .lean();

    const queueContext = tokens.length
      ? JSON.stringify(tokens)
      : "This customer currently has no queue tokens.";

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    let response;

const models = ["gemini-2.5-flash", "gemini-flash-latest"];

for (const model of models) {
  try {
    response = await ai.models.generateContent({
      model,
      contents: `
You are QueueLess AI, a friendly assistant on the QueueLess
digital queue management website.

Help visitors understand:
- How QueueLess works
- How to join a digital queue
- How to track a token
- How queue positions and estimated waiting times work
- General questions about digital queue management

Rules:
- Answer in simple, friendly language.
- Keep responses concise.
- Do not invent live queue positions or waiting times.
- Do not claim that a token has been created or cancelled.
- Do not request passwords, OTPs, or payment details.
- If asked about a personal token, explain that the user
  should log in and check My Queue.
- Only answer questions relevant to QueueLess or queue management.

Visitor question: ${message}
`
    });

    break;
  } catch (error) {
    console.error(`Gemini model ${model} failed:`, error.message);

    if (model === models[models.length - 1]) {
      throw error;
    }
  }
}

    res.json({
      success: true,
      reply: response.text
    });
  } catch (error) {
    console.error("AI chat error:", error.message);

    res.status(500).json({
      success: false,
      message: "The AI assistant could not respond. Please try again."
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
app.patch(
  "/api/tokens/:id/cancel",
  authenticateToken,
  requireRole("customer"),
  async (req, res) => {
    try {
      const token = await Token.findOne({
        id: Number(req.params.id),
        customerId: req.user.userId,
      });

      if (!token) {
        return res.status(404).json({
          success: false,
          message: "Token not found.",
        });
      }

      if (token.status !== "waiting") {
        return res.status(400).json({
          success: false,
          message: "Only waiting tokens can be cancelled.",
        });
      }

      token.status = "cancelled";
      await token.save();

      await refreshQueue(token.location, token.serviceId);

      io.emit("queue-updated", {
        location: token.location,
        serviceId: token.serviceId,
      });

      res.json({
        success: true,
        message: "Token cancelled successfully.",
      });
    } catch (error) {
      console.error("Token cancellation failed:", error.message);

      res.status(500).json({
        success: false,
        message: "Could not cancel the token.",
      });
    }
  }
);


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

