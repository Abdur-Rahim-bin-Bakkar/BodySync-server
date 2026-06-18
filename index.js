const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const dns = require("dns").promises;

dns.setServers(["1.1.1.1", "8.8.8.8"]);
const cors = require('cors')
const app = express()
const port = 5000
require('dotenv').config()

app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.use(cors())
app.use(express.json())


const uri = process.env.MONGODB_URI
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection

        // database and collections:
        const database = client.db('bodyasync')
        const classCollection = database.collection('classes')



        app.get('/class', async (req, res) => {
            const result = await classCollection.find().toArray()
            res.send(result)
        })

        app.get("/classes/featured", async (req, res) => {
            try {
                const featuredClasses = await classCollection.find({ status: "approved" })
                    .sort({ bookingCount: -1 })
                    .limit(4)
                    .toArray() // top 4

                res.status(200).json({
                    success: true,
                    message: "Featured classes fetched successfully",
                    data: featuredClasses
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Server error",
                    error: error.message
                });
            }
        });














        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);







app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})