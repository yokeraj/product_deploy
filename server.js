const express = require("express");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000; // Use environment port (important for Render)

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const uri = "mongodb+srv://yokeraj285:yoke2004@mycluster.ypezv.mongodb.net/School?retryWrites=true&w=majority&appName=MyCluster";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let collection;

// Function to connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        const database = client.db("School"); // Ensure database name is set in the URI
        collection = database.collection("Students");
        console.log("✅ Connected to MongoDB Atlas");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1); // Stop server if DB connection fails
    }
}

connectDB();

// Debugging middleware to log requests
app.use((req, res, next) => {
    console.log(`📢 Incoming request: ${req.method} ${req.url}`);
    next();
});

// Default route for checking server status
app.get("/", (req, res) => {
    res.send("✅ Server is running. Use /add-report to add students and /student/:rollNo to fetch data.");
});

// Add student report
app.post("/add-report", async (req, res) => {
    try {
        const { studentName, rollNo, Father, className, marks } = req.body;

        if (!studentName || !rollNo || !Father || !className || !marks || !Array.isArray(marks)) {
            return res.status(400).json({ error: "Missing or invalid fields" });
        }

        // Ensure marks are numbers
        const marksArray = marks.map(mark => Number(mark));

        // Calculate total marks and percentage
        const totalMarks = marksArray.reduce((sum, mark) => sum + mark, 0);
        const percentage = ((totalMarks / (marksArray.length * 100)) * 100).toFixed(2);

        // Save to MongoDB
        const reportCard = { studentName, rollNo, Father, className, marks: marksArray, totalMarks, percentage };
        const result = await collection.insertOne(reportCard);
        
        res.json({ message: "✅ Report card saved successfully", id: result.insertedId });
    } catch (error) {
        console.error("❌ Error saving report card:", error);
        res.status(500).json({ error: "Error saving report card" });
    }
});

// Get student data by roll number
app.get("/student/:rollNo", async (req, res) => {
    try {
        const rollNo = req.params.rollNo;
        console.log(`🔎 Searching for student with rollNo: ${rollNo}`);

        const student = await collection.findOne({ rollNo });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json(student);
    } catch (error) {
        console.error("❌ Error fetching student:", error);
        res.status(500).json({ error: "Error fetching student data" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
