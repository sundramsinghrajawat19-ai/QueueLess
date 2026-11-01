
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./User");
const readline = require("readline/promises");

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const name = (await rl.question("Staff name: ")).trim();
    const email = (await rl.question("Staff email: ")).trim().toLowerCase();
    const password = await rl.question("Staff password (min 8 characters): ");

    if (!name || !email || password.length < 8) {
      throw new Error("Enter a name, email, and password of at least 8 characters.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error("This email already has an account. Use a different email.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const staff = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "staff"
    });

    console.log("\nStaff account created successfully!");
    console.log("Name:", staff.name);
    console.log("Email:", staff.email);
    console.log("Role:", staff.role);
  } catch (error) {
    console.error("\nError:", error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

main();
