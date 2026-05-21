const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
        const allBooking = db.collection("All-Booking");

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

        app.get("/my-tutors/:id", async (req, res) => {
            const id = req.params.id;
            const result = await allTutors
                .find({ userId: id })
                .sort({ _id: -1 })
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

        app.patch("/edit-tutor/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const updateData = req.body;
            const tutorData = {
                ...updateData,
                startDate: new Date(req.body.startDate),
            };
            const document = {
                $set: tutorData,
            };
            const result = await allTutors.updateOne(query, document);
            res.send(result);
        });

        app.get("/tutor-details/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await allTutors.findOne(query);
            res.send(result);
        });

        app.delete("/tutor-delete/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await allTutors.deleteOne(query);
            res.send(result);
        });

        // Booking
        app.post("/book-session", async (req, res) => {
            const bookingData = req.body;
            const tutorId = bookingData.tutorId;

            const tutor = await allTutors.findOne({
                _id: new ObjectId(tutorId),
            });

            if (!tutor) {
                return res
                    .status(404)
                    .send({ success: false, message: "Tutor not found!" });
            }

            const bookingResult = await allBooking.insertOne({
                ...bookingData,
                status: "Confirm",
            });

            if (typeof tutor.totalSlot === "string") {
                const currentSlots = parseInt(tutor.totalSlot || 0);
                await allTutors.updateOne(
                    { _id: new ObjectId(tutorId) },
                    { $set: { totalSlot: currentSlots - 1 } },
                );
            }

            res.send({
                success: true,
                message: "Session booked successfully!",
            });
        });

        app.get("/all-booking", async (req, res) => {
            const result = await allBooking.find().sort({ _id: -1 }).toArray();
            res.send(result);
        });

        app.get("/user-book/:id", async (req, res) => {
            const id = req.params.id;
            const query = { userId: id };
            const result = (await allBooking.find(query).sort({_id : -1}).toArray());
            res.send(result);
        });


        app.patch("/user-book-update/:id", async(req, res) => {
            const id = req.params.id;
            const query = {_id : new ObjectId(id)};
            const update = {
                $set : {status : "Cancel"}
            }
            const result = await allBooking.updateOne(query, update)
            res.send(result)
        })
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
