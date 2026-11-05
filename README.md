# QueueLess — Smart Digital Queue Management

**QueueLess** is a full-stack digital queue management system that helps people join service queues online, track their token status, and reduce unnecessary waiting. Staff can manage queues through a dashboard with live queue updates.

🌐 **Live Website:** https://queueless-frontend-7kda.onrender.com

💻 **GitHub Repository:** https://github.com/sundramsinghrajawat19-ai/QueueLess

## Features

### Customer Features
- Customer registration and login
- Join a service queue and receive a digital token
- View token number, queue position, and estimated waiting time
- Track queue status through My Queue
- Cancel a waiting token
- Receive approaching-turn notifications
- Track tokens without waiting physically in line

### Staff Features
- Staff authentication and role-based access
- View and manage queue tokens
- Call the next waiting customer
- Update token status
- Monitor queue activity through the staff dashboard

### System Features
- MongoDB database persistence
- Independent queues for different services
- Automatic queue position and waiting-time calculations
- Live queue updates
- REST API using Express.js
- Frontend and backend deployed on Render

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend UI |
| Vite | Frontend development and build |
| JavaScript | Application logic |
| CSS | Styling and responsive design |
| Node.js | Backend runtime |
| Express.js | REST API |
| MongoDB | Database |
| Mongoose | MongoDB integration |
| JWT | Authentication |
| Socket.IO | Real-time communication |
| Render | Deployment |

## How It Works

1. A customer registers or logs in.
2. The customer selects a service and joins its queue.
3. QueueLess generates a token and calculates the customer's queue position.
4. The customer tracks their token through My Queue.
5. Staff manage the queue from the dashboard.
6. Queue positions and estimated waiting times update as the queue progresses.

## Project Structure

```text
QueueLess/
├── src/
│   ├── components/
│   ├── pages/
│   ├── api.js
│   └── socket.js
├── backend/
│   ├── server.js
│   └── .env
├── public/
├── package.json
└── README.md
```

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/sundramsinghrajawat19-ai/QueueLess.git
cd QueueLess
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure the backend

Open the backend folder:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Use your own credentials. Never commit your `.env` file or expose API keys.

### 4. Start the backend

```bash
npm start
```

If your backend package uses a different start script, use the script defined in `backend/package.json`.

### 5. Start the frontend

Open a new terminal in the project root:

```bash
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

## Deployment

QueueLess is deployed using Render.

- **Frontend:** Render Static Site
- **Backend:** Render Web Service
- **Database:** MongoDB Atlas

The frontend communicates with the deployed backend through the shared API configuration in `src/api.js`.

## Future Improvements

- Push notifications when a customer's turn is near
- Advanced queue analytics for staff
- More service providers and queue locations
- Improved accessibility and mobile experience

## Author

**Sundaram Singh**

B.Tech Computer Science and Engineering

GitHub: [sundramsinghrajawat19-ai](https://github.com/sundramsinghrajawat19-ai)

---

*QueueLess — Less waiting. Better service.*