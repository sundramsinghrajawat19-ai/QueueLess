
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Temporary service data
const services = [
  { id: 1, name: "Healthcare Clinic", waitTime: 10 },
  { id: 2, name: "College Office", waitTime: 8 },
  { id: 3, name: "Bank Counter", waitTime: 12 },
  { id: 4, name: "Government Office", waitTime: 15 }
];

// Temporary queue data (will move to MongoDB later)
const tokens = [];
let nextToken = 1;

// Check whether the server is running
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "QueueLess backend is running!" });
});

// Get available services
app.get("/api/services", (req, res) => {
  res.json({ success: true, services });
});

// Generate a queue token
app.post("/api/tokens", (req, res) => {
  const { name, location, serviceId } = req.body;

  if (!name || !location || !serviceId) {
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

  const peopleAhead = tokens.filter(
    token =>
      token.location === location &&
      token.serviceId === service.id &&
      token.status === "waiting"
  ).length;

  const token = {
    id: nextToken++,
    tokenNumber: `Q${String(nextToken - 1).padStart(3, "0")}`,
    name: name.trim(),
    location,
    serviceId: service.id,
    serviceName: service.name,
    peopleAhead,
    estimatedWait: peopleAhead * service.waitTime,
    status: "waiting",
    createdAt: new Date().toISOString()
  };

  tokens.push(token);

  res.status(201).json({
    success: true,
    message: "Queue token generated successfully!",
    token
  });
});

// Get all tokens (for testing and the future staff dashboard)
app.get("/api/tokens", (req, res) => {
  res.json({ success: true, tokens });
});

app.listen(PORT, () => {
  console.log(`QueueLess backend running at http://localhost:${PORT}`);
});
