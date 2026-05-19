const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config()

app.use(cors())
app.use(express.json());



const uri = process.env.MEDIQUEUE_URI;

const client = new MongoClient(uri,{
    serverApi : {
        version : ServerApiVersion.v1,
        strict : true,
        deprecationErrors : true
    }
})


async function run() {

    try{
        // await client.connect();
        // await client.db("admin").command({ping : 1})
        console.log("Mongodb server in running...");


        const db = client.db("MediQueue");
        const allTutors = db.collection("all-tutors")

        app.post("/add-tutors", async(req, res) => {
            const tutorsData = req.body;
            console.log(tutorsData);
            const result = await allTutors.insertOne(tutorsData);
            res.send(result)
        })
    }
    finally{
        // await client.close()
    }
    
}
run().catch(console.dir);





app.get("/", (req, res)=> {
    res.send("Hello from mediqueue server side.")
})


app.listen(port,()=> {
    console.log(`Mediqueue server site run port : ${port}`);
})