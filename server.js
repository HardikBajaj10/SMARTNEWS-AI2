const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// serve the static client files
app.use(express.static(path.join(__dirname, "..", "client")));

// example API route (currently returns sample article list)
app.get("/api/articles", (req, res) => {
    // in real world this would query the database
    const sample = [
        { id: 1, title: "AI Revolution 2026", category: "Technology" },
        { id: 2, title: "Startup Funding Trends", category: "Business" }
    ];
    res.json(sample);
});

mongoose.connect("mongodb://127.0.0.1:27017/SmartNewsDB")
.then(()=>console.log("MongoDB Connected ✅"))
.catch(err=>console.log(err));

app.get("/", (req,res)=>{
    res.send("SmartNews Backend Running 🚀");
});

app.listen(5000, ()=>{
    console.log("Server running on port 5000");
});