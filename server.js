const express = require("express");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

let database;
let collection;

async function connectDB() {
    try {
        await client.connect();
        database = client.db("School");
        collection = database.collection("Students");
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

connectDB();

app.post("/add-report", async (req, res) => {
    try {
        const { studentName, rollNo, Father, className, marks } = req.body;

        // Ensure marks are numbers (array)
        const marksArray = marks.map(mark => Number(mark));

        // Calculate total marks and percentage
        const totalMarks = marksArray.reduce((sum, mark) => sum + mark, 0);
        const percentage = ((totalMarks / (marksArray.length * 100)) * 100).toFixed(2);

        // Save to MongoDB
        const reportCard = { studentName, rollNo, Father, className, marks: marksArray, totalMarks, percentage };
        const result = await collection.insertOne(reportCard);
        
        res.json({ message: "Report card saved successfully", id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: "Error saving report card" });
    }
});

app.get("/student/:rollNo", async (req, res) => {
    try {
        const rollNo = req.params.rollNo;
        const student = await collection.findOne({ rollNo: rollNo });

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json(student);
    } catch (error) {
        res.status(500).json({ error: "Error fetching student data" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
