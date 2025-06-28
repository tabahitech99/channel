const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");
const { MongoClient, ObjectId } = require("mongodb");
const cron = require("node-cron");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = 3000;
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB setup
const mongoClient = new MongoClient(process.env.MONGODB_URI);
let client;

// Upload folder setup
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// YouTube API setup
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Gafi Bhai | Dashboard</title>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
        }

        body {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(-45deg, #f7f9fc, #dde8f3, #c3e0e5, #fceabb);
          background-size: 400% 400%;
          animation: gradientBG 10s ease infinite;
        }

        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        header {
          width: 100%;
          padding: 20px;
          text-align: center;
          font-size: 2rem;
          font-weight: bold;
          color: #2c3e50;
        }

        .hero {
          text-align: center;
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .card {
          background: #ffffff;
          padding: 50px 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          max-width: 450px;
          width: 90%;
          transition: transform 0.3s ease-in-out;
        }

        .card:hover {
          transform: translateY(-5px);
        }

        .card h1 {
          font-size: 2rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .card p {
          color: #7f8c8d;
          margin-bottom: 30px;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .button {
          padding: 14px 20px;
          text-decoration: none;
          font-size: 16px;
          border-radius: 10px;
          transition: all 0.3s ease;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
        }

        .button.upload {
          background: #3498db;
          color: white;
        }

        .button.upload:hover {
          background: #2980b9;
          transform: scale(1.05);
        }

        .button.files {
          background: #2ecc71;
          color: white;
        }

        .button.files:hover {
          background: #27ae60;
          transform: scale(1.05);
        }

        footer {
          padding: 15px;
          text-align: center;
          font-size: 14px;
          color: #7f8c8d;
          background: transparent;
          width: 100%;
        }
      </style>
    </head>
    <body>
      <header>🌟 Gafi Bhai</header>

      <div class="hero">
        <div class="card">
          <h1>📂 File Manager</h1>
          <p>Manage your files effortlessly</p>
          <div class="button-group">
            <a href="/uploadfile" class="button upload">⬆️ Upload File</a>
            <a href="/myfile" class="button files">📁 My Files</a>
          </div>
        </div>
      </div>

      <footer>© Copyright by gafibhai2025</footer>
    </body>
    </html>
  `);
});


// HTML form with better UI
app.get("/uploadfile", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Upload Video</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .upload-container {
            background-color: #fff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            text-align: center;
            width: 400px;
          }
          h2 {
            margin-bottom: 24px;
            color: #333;
          }
          input[type="text"], input[type="file"] {
            width: 100%;
            padding: 12px;
            margin: 12px 0;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 16px;
          }
          button {
            padding: 12px 24px;
            font-size: 16px;
            border: none;
            border-radius: 8px;
            background-color: #4CAF50;
            color: white;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }
          button:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="upload-container">
          <h2>Upload Video</h2>
          <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="text" name="title" placeholder="Video Title" required/><br/>
            <input type="file" name="video" accept="video/*" required/><br/>
            <button type="submit">Upload</button>
          </form>
        </div>
      </body>
    </html>
  `);
});


// Schedule Times
const scheduleTimes = ["07:00", "15:00", "23:00"];

async function getNextScheduleTime(db) {
  const videos = await db.collection("videos").find({}).sort({ scheduledTime: 1 }).toArray();
  const lastTime = videos.length ? new Date(videos[videos.length - 1].scheduledTime) : new Date();
  const baseDate = new Date();

  while (true) {
    for (let t of scheduleTimes) {
      const [h, m] = t.split(":");
      const next = new Date(baseDate);
      next.setHours(h, m, 0, 0);
      if (next > lastTime) return next;
    }
    baseDate.setDate(baseDate.getDate() + 1);
  }
}

// Upload handler
app.post("/upload", upload.single("video"), async (req, res) => {
  const db = client.db("youtube_scheduler");
  const collection = db.collection("videos");
  const title = req.body.title;
  const filePath = req.file.path;
  const scheduledTime = await getNextScheduleTime(db);

  await collection.insertOne({
    title,
    filePath,
    scheduledTime,
    uploaded: false,
    forceUpload: false
  });

  res.send("✅ Video scheduled for: " + scheduledTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
});

// Video list with bulk update and clear option
app.get("/myfile", async (req, res) => {
  const db = client.db("youtube_scheduler");
  const collection = db.collection("videos");
  const videos = await collection.find({}).toArray();

  const html = videos.map(v => `
    <li>
      <input type="checkbox" name="ids" value="${v._id}"/>
      <strong>Title:</strong> ${v.title}<br/>
      <strong>Status:</strong> ${v.uploaded ? "✅ Uploaded" : "⏳ Scheduled"}<br/>
      <strong>Upload Time:</strong>
      <input type="datetime-local" name="time_${v._id}" value="${new Date(v.scheduledTime).toISOString().slice(0, 16)}"/>
      <label><input type="checkbox" name="force_${v._id}" ${v.forceUpload ? "checked" : ""}/> Upload Now</label>
    </li><br/>
  `).join("");

  res.send(`
    <html><body>
      <h2>Video List</h2>
      <form action="/bulk-update" method="POST">
        <ul>${html || "No videos yet."}</ul>
        <button type="submit">✅ Save Changes</button>
      </form>
      <form action="/clear-all" method="POST" onsubmit="return confirm('Are you sure to delete all?')">
        <button type="submit" style="margin-top: 20px; color: red;">🗑️ Clear All</button>
      </form>
    </body></html>
  `);
});

// Bulk update
app.post("/bulk-update", async (req, res) => {
  const db = client.db("youtube_scheduler");
  const collection = db.collection("videos");
  const ids = Array.isArray(req.body.ids) ? req.body.ids : req.body.ids ? [req.body.ids] : [];

  for (let id of ids) {
    const newTime = new Date(req.body[`time_${id}`]);
    const force = req.body[`force_${id}`] === "on";
    await collection.updateOne({ _id: new ObjectId(id) }, {
      $set: { scheduledTime: newTime, forceUpload: force }
    });
  }

  res.redirect("/myfile");
});

// Clear all
app.post("/clear-all", async (req, res) => {
  const db = client.db("youtube_scheduler");
  const collection = db.collection("videos");
  await collection.deleteMany({});
  res.redirect("/myfile");
});

// Cron job for uploads
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const db = client.db("youtube_scheduler");
  const collection = db.collection("videos");

  const pendingVideos = await collection.find({
    uploaded: false,
    $or: [
      { scheduledTime: { $lte: now } },
      { forceUpload: true }
    ]
  }).toArray();

  for (const video of pendingVideos) {
    try {
      if (!fs.existsSync(video.filePath)) {
        console.warn(`⚠️ File not found: ${video.filePath}`);
        await collection.deleteOne({ _id: video._id }); // Remove broken record
        continue;
      }

      await youtube.videos.insert({
        part: "snippet,status",
        requestBody: {
          snippet: {
            title: video.title,
            description: "Scheduled video upload",
          },
          status: {
            privacyStatus: "public",
            madeForKids: false // 👈 No, it’s not made for kids
          },
        },
        media: {
          body: fs.createReadStream(video.filePath).on("error", err => {
            console.error("❌ Stream Error:", err.message);
          }),
        },
      });

      await collection.updateOne({ _id: video._id }, { $set: { uploaded: true, forceUpload: false } });
      fs.unlinkSync(video.filePath);
      console.log(`✅ Uploaded: ${video.title}`);
    } catch (err) {
      console.error("❌ Upload Error:", err.message);
    }
  }
});

// Start server
mongoClient.connect().then(mongo => {
  client = mongo;
  app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
});
