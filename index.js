const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = process.env.MEDIQUEUE_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // await client.connect();
        // await client.db("admin").command({ping : 1})
        console.log("Mongodb server in running...");

        const db = client.db("MediQueue");
        const allTutors = db.collection("all-tutors");

        app.post("/add-tutors", async (req, res) => {
            const tutorsData = {
                ...req.body,
                startDate: new Date(req.body.startDate),
            };
            const result = await allTutors.insertOne(tutorsData);
            res.send(result);
        });

        app.get("/home-tutors", async (req, res) => {
            const result = await allTutors
                .find()
                .sort({ _id: -1 })
                .limit(6)
                .toArray();
            res.send(result);
        });

        app.get("/tutors", async (req, res) => {
            try {
                const { search, startDate, endDate } = req.query;
                const query = {};

                if (search) {
                    const searchRegex = { $regex: search, $options: "i" };
                    query.$or = [
                        { name: searchRegex },
                        { category: searchRegex },
                        { teachingMode: searchRegex },
                        { availableTime: searchRegex },
                    ];
                }

                if (startDate || endDate) {
                    query.startDate = {};
                    if (startDate) query.startDate.$gte = new Date(startDate);
                    if (endDate)
                        query.startDate.$lte = new Date(
                            new Date(endDate).setHours(23, 59, 59, 999),
                        );
                }

                const result = await allTutors
                    .find(query)
                    .sort({ startDate: -1 })
                    .toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });
    } finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello from mediqueue server side.");
});

app.listen(port, () => {
    console.log(`Mediqueue server site run port : ${port}`);
});
