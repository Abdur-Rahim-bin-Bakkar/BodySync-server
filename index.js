// import { ObjectId } from "mongodb";
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const forumCollection = database.collection('forum')




        //post class:
        app.post("/class", async (req, res) => {
            try {
                const data = req.body;

                const newData = {
                    ...data,
                    createdAt: new Date(),
                };

                const result = await classCollection.insertOne(newData);

                res.status(201).send(result);
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });


        // get featured classes:
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


        //get all approved classes:
        app.get("/classes", async (req, res) => {
            try {
                const { search, category } = req.query;

                let query = { status: "approved" };

                // 🔍 SEARCH by name
                if (search) {
                    query.className = {
                        $regex: search,
                        $options: "i",
                    };
                }

                // 🎯 FILTER by category
                if (category) {
                    query.category = category;
                }

                const result = await classCollection.find(query).toArray();

                res.status(200).json({
                    success: true,
                    message: "Classes fetched successfully",
                    data: result,
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Server error",
                    error: error.message,
                });
            }
        });

        //get class by trainerId:
        app.get("/classes/:trainerId", async (req, res) => {
            try {
                const trainerId = req.params.trainerId;

                const result = await classCollection
                    .find({ trainerId })
                    .toArray();

                res.send({
                    success: true,
                    data: result,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });


        // get forun  post: 
        app.get("/forum-posts", async (req, res) => {
            console.log('hocda fsafdj asofuosiauf afiud')
            try {
                const search = req.query.search || "";

                const query = {};

                if (search) {
                    query.title = {
                        $regex: search,
                        $options: "i",
                    };
                }

                const result = await forumCollection
                    .find(query)
                    .sort({ createdAt: -1 })
                    .toArray();

                res.status(200).json({
                    success: true,
                    message: "Forum posts fetched successfully",
                    data: result,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Server error",
                    error: error.message,
                });
            }
        });


        // get single forun  posts: 
        app.get("/forum-posts/:id", async (req, res) => {
            try {
                const { id } = req.params;

                const result = await forumCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!result) {
                    return res.status(404).json({
                        success: false,
                        message: "Forum post not found",
                    });
                }

                res.status(200).json({
                    success: true,
                    message: "Forum post fetched successfully",
                    data: result,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Server error",
                    error: error.message,
                });
            }
        });

        // post fourm:
        app.post("/forum", async (req, res) => {
            try {
                const data = req.body;

                const newData = {
                    ...data,
                    createdAt: new Date(),
                };

                const result = await forumCollection.insertOne(newData);

                res.status(201).send({
                    success: true,
                    insertedId: result.insertedId,
                    message: "Forum post created successfully",
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });


        //get forum by id:
        app.get("/forum/trainer/:trainerId", async (req, res) => {
            try {
                const { trainerId } = req.params;

                const result = await forumCollection
                    .find({ trainerId })
                    .sort({ createdAt: -1 })
                    .toArray();

                res.status(200).send(result);
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });







        // import { ObjectId } from "mongodb";

        app.delete("/forum/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const result = await forumCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                res.send(result);
            } catch (error) {
                res.status(500).send({
                    message: error.message,
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