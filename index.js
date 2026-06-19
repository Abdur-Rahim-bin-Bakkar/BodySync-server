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
        const commentCollection = database.collection('comments')
        const replayCommentCollection = database.collection('commentreplay')
        const Reaction = database.collection('reaction')
        const favoriteCollection = database.collection("favorites");
        const bookingCollection = database.collection('bookings')




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


        //get class details
        app.get("/classes/:id/details", async (req, res) => {
            try {
                const { id } = req.params;

                const result = await classCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!result) {
                    return res.status(404).json({
                        success: false,
                        message: "Class not found",
                    });
                }

                res.status(200).json({
                    success: true,
                    data: result,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });



        // forum-----------------------------------

        //get latest forum post:
        // GET Latest Forum Posts
        app.get("/forum/latest", async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 4;

                const latestPosts = await forumCollection
                    .find({})
                    .sort({ createdAt: -1 }) // newest first
                    .limit(limit)
                    .toArray();

                res.status(200).json({
                    success: true,
                    data: latestPosts,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch latest forum posts",
                });
            }
        });
        // get forum  post: 
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

        // get single forum  posts: 
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

        // delete forum:
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

        // comment on forum post: --------------
        // add comment
        app.post("/forum/:id/comment", async (req, res) => {
            try {
                const { id } = req.params;
                const { text, userName, userEmail, user } = req.body;

                if (!text) {
                    return res.status(400).json({
                        success: false,
                        message: "Comment text is required",
                    });
                }

                const newComment = {
                    postId: id,
                    text,
                    // userName: userName || "Anonymous",
                    // userEmail: userEmail || "",
                    createdAt: new Date(),
                    user
                };

                const result = await commentCollection.insertOne(newComment);

                // optional: update comment count in forum
                await forumCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $inc: { commentsCount: 1 } }
                );

                res.status(201).json({
                    success: true,
                    message: "Comment added successfully",
                    data: result,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });

        //get comment:
        app.get("/forum/:id/comments", async (req, res) => {
            try {
                const { id } = req.params;

                const comments = await commentCollection
                    .find({ postId: id })
                    .sort({ createdAt: -1 })
                    .toArray();

                res.status(200).json({
                    success: true,
                    data: comments,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });


        //post comment replay:
        app.post("/comment/:commentId/reply", async (req, res) => {
            try {
                const { commentId } = req.params;
                const { text, user } = req.body;

                if (!text) {
                    return res.status(400).json({
                        success: false,
                        message: "Reply text is required",
                    });
                }

                const newReply = {
                    commentId, // মূল comment id
                    text,
                    user, // {name, image, role, email}
                    createdAt: new Date(),
                };

                const result = await replayCommentCollection.insertOne(newReply);

                res.status(201).json({
                    success: true,
                    message: "Reply added successfully",
                    data: result,
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });

        //get comment replay:
        app.get("/comment/:commentId/replies", async (req, res) => {
            try {
                const { commentId } = req.params;

                const replies = await replayCommentCollection
                    .find({ commentId })
                    .sort({ createdAt: 1 })
                    .toArray();

                res.status(200).json({
                    success: true,
                    data: replies,
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });


        // //like or dislike in post: 
        // app.post("/post/reaction", async (req, res) => {
        //     const { userId, postId, type } = req.body;

        //     // check existing reaction
        //     const existing = await Reaction.findOne({ userId, postId });

        //     if (!existing) {
        //         // no reaction yet → create new
        //         await Reaction.create({ userId, postId, type });
        //         return res.json({ message: "Reaction added" });
        //     }

        //     if (existing.type === type) {
        //         // same button click → remove reaction (toggle off)
        //         await Reaction.deleteOne({ _id: existing._id });
        //         return res.json({ message: "Reaction removed" });
        //     }

        //     // opposite reaction → update
        //     existing.type = type;
        //     await existing.save();

        //     res.json({ message: "Reaction updated" });
        // });
        app.post("/post/reaction", async (req, res) => {
            const { userId, postId, type } = req.body;

            const forumCollection = database.collection("forum");

            const post = await forumCollection.findOne({
                _id: new ObjectId(postId),
            });

            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            const uid = userId.toString();

            let likes = (post.likesUsers || []).map((id) => id.toString());
            let dislikes = (post.dislikesUsers || []).map((id) => id.toString());

            // remove user from both
            likes = likes.filter((id) => id !== uid);
            dislikes = dislikes.filter((id) => id !== uid);

            if (type === "like") {
                likes.push(uid);
            }

            if (type === "dislike") {
                dislikes.push(uid);
            }

            await forumCollection.updateOne(
                { _id: new ObjectId(postId) },
                {
                    $set: {
                        likesUsers: likes,
                        dislikesUsers: dislikes,
                        likes: likes.length,
                        dislikes: dislikes.length,
                    },
                }
            );

            res.json({
                message: "Reaction updated",
                likes: likes.length,
                dislikes: dislikes.length,
            });
        });
        // forum-----------------------------------


        const { ObjectId } = require("mongodb");

        app.post("/favorites/toggle", async (req, res) => {
            try {
                const { userId, classId } = req.body;

                // ⭐ 1. VALIDATION
                if (!userId || !classId) {
                    return res.status(400).json({
                        success: false,
                        message: "userId and classId are required",
                    });
                }

                // ⭐ 2. ObjectId SAFE CHECK
                let classObjectId;

                try {
                    classObjectId = new ObjectId(classId);
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid classId format",
                    });
                }

                // ⭐ 3. QUERY
                const query = {
                    userId,
                    classId: classObjectId,
                };

                // ⭐ 4. CHECK EXISTING FAVORITE
                const existing = await favoriteCollection.findOne(query);

                // ❌ REMOVE FAVORITE
                if (existing) {
                    await favoriteCollection.deleteOne(query);

                    return res.status(200).json({
                        success: true,
                        type: "removed",
                        message: "Removed from favorites",
                    });
                }

                // ✅ ADD FAVORITE
                const newFavorite = {
                    userId,
                    classId: classObjectId,
                    createdAt: new Date(),
                };

                const result = await favoriteCollection.insertOne(newFavorite);

                return res.status(201).json({
                    success: true,
                    type: "added",
                    message: "Added to favorites",
                    insertedId: result.insertedId,
                });

            } catch (error) {
                console.error("Favorites toggle error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Internal server error",
                    error: error.message,
                });
            }
        });

        app.get("/favorites/check", async (req, res) => {
            try {
                const { userId, classId } = req.query;

                const exists = await favoriteCollection.findOne({
                    userId,
                    classId,
                });

                res.json({
                    success: true,
                    isFavorite: !!exists,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });
        // app.get("/favorites/:userId", async (req, res) => {
        //     try {
        //         const { userId } = req.params;

        //         // ⭐ 1. user এর সব favorite record বের করি
        //         const favorites = await favoriteCollection
        //             .find({ userId })
        //             .toArray();

        //         // ⭐ যদি empty হয়
        //         if (!favorites.length) {
        //             return res.json({
        //                 success: true,
        //                 data: [],
        //             });
        //         }

        //         // ⭐ 2. classId list বানাই
        //         const classIds = favorites.map(
        //             (fav) => new ObjectId(fav.classId)
        //         );

        //         // ⭐ 3. classes collection থেকে data আনি
        //         const classes = await classCollection
        //             .find({
        //                 _id: { $in: classIds },
        //             })
        //             .toArray();

        //         res.json({
        //             success: true,
        //             data: classes,
        //         });
        //     } catch (error) {
        //         res.status(500).json({
        //             success: false,
        //             message: error.message,
        //         });
        //     }
        // });
        app.get("/favorites/:userId", async (req, res) => {
            try {
                const { userId } = req.params;

                const favorites = await favoriteCollection.find({ userId }).toArray();

                res.json({
                    success: true,
                    data: favorites, // ⭐ IMPORTANT (NO JOIN)
                });

            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        // const { ObjectId } = require("mongodb");

        // const { ObjectId } = require("mongodb");

        app.delete("/favorites/:id", async (req, res) => {
            try {
                const { id } = req.params;

                if (!id) {
                    return res.status(400).json({
                        success: false,
                        message: "Favorite id is required",
                    });
                }




                const result = await favoriteCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                if (result.deletedCount === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Favorite not found",
                    });
                }

                res.json({
                    success: true,
                    message: "Favorite removed successfully",
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });


        // post bookings data:
        app.post("/bookings", async (req, res) => {
            try {
                const bookingData = req.body;

                const result = await bookingCollection.insertOne({
                    ...bookingData,
                    createdAt: new Date(),
                });

                res.status(201).send({
                    success: true,
                    message: "Booking created successfully",
                    insertedId: result.insertedId,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
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