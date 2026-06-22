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
const checkBlockedUser = async (req, res, next) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId required",
            });
        }

        const user = await userCollection.findOne({
            _id: new ObjectId(userId),
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.status === "blocked") {
            return res.status(403).json({
                success: false,
                message: "Action restricted by Admin",
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


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
        const userCollection = database.collection('user');
        const applyAsTrainerCollection = database.collection('applyastrainer')
        const sessionCollection = database.collection('session')




        const verifyToken = async (req, res, next) => {
            console.log(req.headers.authorization)
            const headerToken = req?.headers?.authorization
            if (!headerToken) {
                return res.status(401).send(
                    {
                        message: 'unauthorized access'
                    }
                )
            }
            const token = headerToken.split(' ')[1]
            if (!token) {
                return res.status(401).send(
                    {
                        message: 'unauthorized access'
                    }
                )
            }
            const query = { token: token }
            const session = await sessionCollection.findOne(query)
            if (!session) {
                J
                return res.status(401).send(
                    {
                        message: 'unauthorized access'
                    }
                )
            }
            const userId = session.userId
            const userQuery = await userCollection.findOne({ _id: new ObjectId(userId) })
            if (!userQuery) {
                return res.status(401).send(
                    {
                        message: 'unauthorized access'
                    }
                )
            }
            console.log(userQuery._id.toString(), 'uq')
            req.userInfo = userQuery;
            next()
        }
        const verifyTrainer = async (req, res, next) => {
            const userInfo = req?.userInfo;
            const role = userInfo?.role;
            if (role !== 'trainer') {
                return res.status(403).send({ message: "Forbidden Access" })
            }
            console.log(userInfo, 'uc trainer check')
            req.userInfo = userInfo
            next()
        }
        const verifyAdmin = async (req, res, next) => {
            const userInfo = req?.userInfo;
            const role = userInfo?.role;
            if (role !== 'admin') {
                return res.status(403).send({ message: "Forbidden Access" })
            }
            console.log(userInfo, 'uc admin check')
            req.userInfo = userInfo
            next()
        }
        const verifyAdminOrTrainer = async (req, res, next) => {
            const userInfo = req?.userInfo;
            const role = userInfo?.role;
            if (role === 'admin') {
                req.userInfo = userInfo
                return next()
            }
            if (role === 'trainer') {
                req.userInfo = userInfo
                return next()
            }

            return res.status(403).send({ message: "Forbidden Access" })

        }


        //post class:
        app.post("/class", verifyToken, verifyTrainer, async (req, res) => {
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
        app.get("/admin/classes", async (req, res) => {
            try {
                const classes = await classCollection
                    .find({})
                    .sort({ createdAt: -1 })
                    .toArray();

                res.json({
                    success: true,
                    data: classes,
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });
        app.patch("/classes/:id/approve", async (req, res) => {
            try {
                const { id } = req.params;

                const result = await classCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { status: "approved" } }
                );

                res.json({
                    success: true,
                    message: "Class approved successfully",
                });

            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
        app.patch("/classes/:id/reject", async (req, res) => {
            try {
                const { id } = req.params;

                const result = await classCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { status: "rejected" } }
                );

                res.json({
                    success: true,
                    message: "Class rejected",
                });

            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
        app.delete("/classes/:id", verifyToken, verifyAdminOrTrainer, async (req, res) => {
            try {
                const { id } = req.params;

                await classCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                res.json({
                    success: true,
                    message: "Class deleted successfully",
                });

            } catch (error) {
                res.status(500).json({ message: error.message });
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
        // app.get("/classes", async (req, res) => {
        //     try {
        //         const { search, category } = req.query;

        //         let query = { status: "approved" };

        //         // 🔍 SEARCH by name
        //         if (search) {
        //             query.className = {
        //                 $regex: search,
        //                 $options: "i",
        //             };
        //         }

        //         // 🎯 FILTER by category
        //         if (category) {
        //             query.category = category;
        //         }

        //         const result = await classCollection.find(query).toArray();

        //         res.status(200).json({
        //             success: true,
        //             message: "Classes fetched successfully",
        //             data: result,
        //         });

        //     } catch (error) {
        //         res.status(500).json({
        //             success: false,
        //             message: "Server error",
        //             error: error.message,
        //         });
        //     }
        // });
        app.get("/classes", async (req, res) => {
            try {
                const { search, category, page = 1, limit = 6 } = req.query;

                let query = { status: "approved" };

                // 🔍 SEARCH
                if (search) {
                    query.className = {
                        $regex: search,
                        $options: "i",
                    };
                }

                // 🎯 CATEGORY FILTER
                if (category) {
                    query.category = category;
                }

                const skip = (Number(page) - 1) * Number(limit);

                const total = await classCollection.countDocuments(query);

                const result = await classCollection
                    .find(query)
                    .skip(skip)
                    .limit(Number(limit))
                    .toArray();

                res.status(200).json({
                    success: true,
                    message: "Classes fetched successfully",
                    data: result,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / limit),
                        showingFrom: skip + 1,
                        showingTo: skip + result.length,
                    },
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Server error",
                    error: error.message,
                });
            }
        });

        //get class by userId:
        app.get("/classes/:userId", verifyToken, verifyTrainer, async (req, res) => {
            try {
                const userId = req.params.userId;
                const userInfo = req.userInfo;
                if (userId !== userInfo?._id.toString()) {
                    return res.status(403).send({ message: "Forbidden Access" })
                }
                const result = await classCollection
                    .find({ userId })
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
        app.get("/classes/:id/details", verifyToken, async (req, res) => {
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

        app.patch("/classes/:id/increment-booking", async (req, res) => {
            try {
                const { id } = req.params;

                const result = await classCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $inc: { bookingCount: 1 }
                    }
                );

                res.json({
                    success: true,
                    message: "Booking count updated",
                    data: result
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });


        //update class:
        app.patch("/classes/:id", verifyToken, verifyTrainer, async (req, res) => {
            try {
                const { id } = req.params;
                const updateData = req.body;

                const result = await classCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                res.json({
                    success: true,
                    message: "Class updated successfully",
                    data: result,
                });
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
        //delete class: 
        app.delete("/classes/:id", async (req, res) => {
            try {
                const { id } = req.params;

                const result = await classCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                res.json({
                    success: true,
                    message: "Class deleted successfully",
                });
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        app.post("/users/sync", async (req, res) => {
            try {
                const user = req.body;

                if (!user?.email) {
                    return res.status(400).json({
                        success: false,
                        message: "Email required",
                    });
                }

                const filter = { email: user.email };

                const updateDoc = {
                    $setOnInsert: {
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        role: "user",
                        status: "active",
                        createdAt: new Date(),
                    },
                    $set: {
                        lastLogin: new Date(),
                    },
                };

                const result = await userCollection.updateOne(filter, updateDoc, {
                    upsert: true, // ⭐ MOST IMPORTANT
                });

                res.json({
                    success: true,
                    message: "User synced successfully",
                    result,
                });
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });


        //booked users: 
        // const { ObjectId } = require("mongodb");

        // app.get("/classes/:id/students", async (req, res) => {
        //     try {
        //         const { id } = req.params;

        //         const students = await bookingCollection.aggregate([
        //             {
        //                 $match: {
        //                     classId: id // or new ObjectId(id) if stored as ObjectId
        //                 }
        //             },
        //             {
        //                 $lookup: {
        //                     from: "user",
        //                     localField: "userId",
        //                     foreignField: "userId", // or "_id" depending on your user schema
        //                     as: "userInfo"
        //                 }
        //             },
        //             {
        //                 $unwind: "$userInfo"
        //             },
        //             {
        //                 $project: {
        //                     _id: 1,
        //                     classId: 1,
        //                     userId: 1,
        //                     createdAt: 1,
        //                     "userInfo.name": 1,
        //                     "userInfo.email": 1,
        //                     "userInfo.image": 1
        //                 }
        //             }
        //         ]).toArray();

        //         return res.json({
        //             success: true,
        //             count: students.length,
        //             data: students
        //         });

        //     } catch (error) {
        //         return res.status(500).json({
        //             success: false,
        //             message: error.message
        //         });
        //     }
        // });
        app.get("/classes/:id/students", verifyToken, verifyTrainer, async (req, res) => {
            try {
                const { id } = req.params;

                const students = await bookingCollection.aggregate([
                    {
                        $match: {
                            classId: id
                        }
                    },

                    // convert userId string → ObjectId
                    {
                        $addFields: {
                            userObjId: {
                                $toObjectId: "$userId"
                            }
                        }
                    },

                    {
                        $lookup: {
                            from: "user",
                            localField: "userObjId",
                            foreignField: "_id",
                            as: "userInfo"
                        }
                    },

                    {
                        $unwind: {
                            path: "$userInfo",
                            preserveNullAndEmptyArrays: true
                        }
                    },

                    {
                        $project: {
                            _id: 1,
                            classId: 1,
                            userId: 1,
                            createdAt: 1,

                            user: {
                                name: "$userInfo.name",
                                email: "$userInfo.email",
                                image: "$userInfo.image"
                            }
                        }
                    }
                ]).toArray();

                return res.json({
                    success: true,
                    data: students
                });

            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message
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
        app.get("/forum-posts/:id", verifyToken, async (req, res) => {
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
        app.post("/forum", verifyToken, verifyAdminOrTrainer, async (req, res) => {
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
        app.get("/forum/userId/:userId", verifyToken, verifyAdminOrTrainer, async (req, res) => {
            try {
                const { userId } = req.params;
                const userInfo = req?.userInfo;
                if (userId !== userInfo._id.toString()) {
                    return res.status(403).send({ message: "Forbidden Access" })
                }

                const result = await forumCollection
                    .find({ userId })
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
        app.delete("/forum/:id", verifyToken, verifyAdminOrTrainer, async (req, res) => {
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
        app.delete("/comments/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const { userId } = req.body;

                const comment = await commentCollection.findOne({ _id: new ObjectId(id) });

                if (!comment) {
                    return res.status(404).send({ message: "Comment not found" });
                }

                if (comment.user.id !== userId) {
                    return res.status(403).send({ message: "Not allowed" });
                }

                await commentCollection.deleteOne({ _id: new ObjectId(id) });

                res.send({ success: true, message: "Comment deleted" });
            } catch (error) {
                res.status(500).send(error);
            }
        });
        app.patch("/comments/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const { text, userId } = req.body;

                const comment = await commentCollection.findOne({ _id: new ObjectId(id) });

                if (!comment) {
                    return res.status(404).send({ message: "Comment not found" });
                }

                if (comment.user.id !== userId) {
                    return res.status(403).send({ message: "Not allowed" });
                }

                const result = await commentCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { text } }
                );

                res.send({ success: true, result });
            } catch (error) {
                res.status(500).send(error);
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


        // const { ObjectId } = require("mon/godb");

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

        // const { ObjectId } = require("mongodb");

        app.get("/favorites/check", async (req, res) => {
            try {
                const { userId, classId } = req.query;

                if (!userId || !classId) {
                    return res.json({
                        success: true,
                        isFavorite: false,
                    });
                }

                const exists = await favoriteCollection.findOne({
                    userId: userId,
                    classId: new ObjectId(classId), // ⭐ FIX HERE
                });

                return res.json({
                    success: true,
                    isFavorite: !!exists, // ⭐ MUST BE BOOLEAN
                });

            } catch (error) {
                return res.status(500).json({
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


        app.get('/bookings/user/:userId/class/:classId', async (req, res) => {
            try {
                const { userId, classId } = req.params;

                // const bookingCollection = database.collection('bookings');

                const booking = await bookingCollection.findOne({
                    userId,
                    classId,
                });

                // ✅ IMPORTANT CHANGE HERE
                return res.json({
                    success: true,
                    data: booking || null,
                });
                console.log('hit hocche')

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });
        app.get('/bookings/user/:userId', async (req, res) => {
            try {
                const { userId } = req.params;

                // ❗ validation (important)
                if (!userId) {
                    return res.status(400).json({
                        success: false,
                        message: "userId is required",
                    });
                }

                // ❗ convert to string safe side (your DB uses string)
                const query = { userId: userId.toString() };

                const bookings = await bookingCollection
                    .find(query)
                    .toArray();

                return res.status(200).json({
                    success: true,
                    totalBookings: bookings.length,
                    data: bookings,
                });

            } catch (error) {
                console.error("GET bookings error:", error);

                return res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });

        //counts--------------------------------
        //count booking 
        app.get("/users/:userId/stats", async (req, res) => {
            try {
                const { userId } = req.params;

                if (!userId) {
                    return res.status(400).json({
                        success: false,
                        message: "userId is required",
                    });
                }

                // bookings count
                const bookingCount = await bookingCollection.countDocuments({
                    userId: userId.toString(),
                });

                // favorites count
                const favoriteCount = await favoriteCollection.countDocuments({
                    userId: userId.toString(),
                });

                return res.status(200).json({
                    success: true,
                    data: {
                        bookingCount,
                        favoriteCount,
                    },
                });

            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });
        //count class and forum: 
        // app.get("/users/:userId/content-stats", async (req, res) => {
        //     try {
        //         const { userId } = req.params;

        //         if (!userId) {
        //             return res.status(400).json({
        //                 success: false,
        //                 message: "userId is required",
        //             });
        //         }

        //         // user created classes count
        //         const classCount = await classCollection.countDocuments({
        //             userId: userId,
        //         });

        //         // user forum posts count
        //         const forumCount = await forumCollection.countDocuments({
        //             userId: userId,
        //         });

        //         return res.status(200).json({
        //             success: true,
        //             data: {
        //                 classCount,
        //                 forumCount,
        //             },
        //         });

        //     } catch (error) {
        //         return res.status(500).json({
        //             success: false,
        //             message: error.message,
        //         });
        //     }
        // });

        // app.get("/users/:userId/total-students", async (req, res) => {
        //     try {
        //         const { userId } = req.params;

        //         if (!userId) {
        //             return res.status(400).json({
        //                 success: false,
        //                 message: "userId is required",
        //             });
        //         }

        //         // 1. get all classes of this trainer
        //         const classes = await classCollection
        //             .find({ userId: userId })
        //             .project({ _id: 1 })
        //             .toArray();

        //         const classIds = classes.map(c => c._id.toString());

        //         if (classIds.length === 0) {
        //             return res.json({
        //                 success: true,
        //                 totalStudents: 0,
        //             });
        //         }

        //         // 2. count all bookings for those classes
        //         const totalStudents = await bookingCollection.countDocuments({
        //             classId: { $in: classIds }
        //         });

        //         return res.json({
        //             success: true,
        //             totalStudents,
        //         });

        //     } catch (error) {
        //         return res.status(500).json({
        //             success: false,
        //             message: error.message,
        //         });
        //     }
        // });
        app.get("/users/:userId/total-stats", verifyToken, verifyTrainer, async (req, res) => {
            try {
                const { userId } = req.params;
                if (userId !== req.userInfo._id.toString()) {
                    console.log('milenai ')
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                if (userId === req.userInfo._id.toString()) {
                    console.log('milche')
                }

                const classes = await classCollection.find({ userId }).toArray();
                const classIds = classes.map(c => c._id.toString());

                const totalBookings = await bookingCollection.countDocuments({
                    classId: { $in: classIds }
                });

                const totalClasses = classes.length;

                const forumCount = await forumCollection.countDocuments({ userId });

                return res.json({
                    success: true,
                    data: {
                        totalClasses,
                        totalBookings,
                        forumCount,
                    }
                });

            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
        app.get("/admin/overview-stats",verifyToken,verifyAdmin, async (req, res) => {
            try {
                // 1. Total Users
                const totalUsers = await userCollection.countDocuments({});

                // 2. Total Classes
                const totalClasses = await classCollection.countDocuments({});

                // 3. Total Bookings
                const totalBookedClasses = await bookingCollection.countDocuments({});

                // 4. Total Forum Posts
                const totalForumPosts = await forumCollection.countDocuments({});

                // 5. Total Comments
                const totalComments = await commentCollection.countDocuments({});

                // 6. Total Apply as Trainer
                const totalTrainerApplications =
                    await applyAsTrainerCollection.countDocuments({});

                return res.status(200).json({
                    success: true,
                    data: {
                        totalUsers,
                        totalClasses,
                        totalBookedClasses,
                        totalForumPosts,
                        totalComments,
                        totalTrainerApplications,
                    },
                });

            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });


        //apply trainer:
        app.post("/apply-trainer", async (req, res) => {
            try {
                const data = req.body;

                const {
                    userId,
                    experience,
                    specialty,
                    description,
                } = data;

                // validation
                if (!userId || !experience || !specialty || !description) {
                    return res.status(400).send({
                        success: false,
                        message: "All fields are required",
                    });
                }

                const applyAsTrainerCollection =
                    database.collection("applyastrainer");

                // duplicate check (same user 2nd time apply block)
                const existing = await applyAsTrainerCollection.findOne({
                    userId,
                });

                if (existing) {
                    return res.status(409).send({
                        success: false,
                        message: "You already applied as trainer",
                    });
                }

                const newData = {
                    ...data,
                    status: "Pending",
                    createdAt: new Date(),
                };

                const result = await applyAsTrainerCollection.insertOne(newData);

                res.status(201).send({
                    success: true,
                    message: "Application submitted successfully",
                    data: result,
                });

            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.get("/apply-trainer/:userId", async (req, res) => {
            try {
                const { userId } = req.params;

                const applyAsTrainerCollection =
                    database.collection("applyastrainer");

                const result = await applyAsTrainerCollection.findOne({
                    userId,
                });

                return res.status(200).send({
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
        //get trainers:
        app.get("/apply-trainer", async (req, res) => {
            try {
                const applications = await applyAsTrainerCollection
                    .find({})
                    .sort({ createdAt: -1 })
                    .toArray();

                res.json({
                    success: true,
                    data: applications,
                });

            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
        app.patch("/apply-trainer/:id/approve", async (req, res) => {
            try {
                const { id } = req.params;

                // 1. get application
                const application = await applyAsTrainerCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!application) {
                    return res.status(404).json({
                        message: "Application not found",
                    });
                }

                // 2. update application
                await applyAsTrainerCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            status: "Approved",
                            feedback: req.body.feedback || "",
                        },
                    }
                );

                // 3. update user role
                await userCollection.updateOne(
                    { _id: new ObjectId(application.userId) },
                    {
                        $set: { role: "trainer" },
                    }
                );

                res.json({
                    success: true,
                    message: "Trainer approved",
                });

            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });


        app.patch("/apply-trainer/:id/reject", async (req, res) => {
            try {
                const { id } = req.params;

                // 1. get application
                const application = await applyAsTrainerCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!application) {
                    return res.status(404).json({
                        success: false,
                        message: "Application not found",
                    });
                }

                // 2. update application status
                await applyAsTrainerCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            status: "Rejected",
                            feedback: req.body.feedback || "",
                        },
                    }
                );

                // 3. 🔥 REVERT ROLE → user
                await userCollection.updateOne(
                    { _id: new ObjectId(application.userId) },
                    {
                        $set: { role: "user" },
                    }
                );

                res.json({
                    success: true,
                    message: "Application rejected & role reset to user",
                });

            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });

        //users---------------------
        // app.get("/users", async (req, res) => {
        //     try {
        //         const users = await userCollection.find({}).toArray();

        //         res.json({
        //             success: true,
        //             data: users,
        //         });

        //     } catch (error) {
        //         res.status(500).json({ message: error.message });
        //     }
        // });
        app.get("/users", async (req, res) => {
            try {
                const { search } = req.query;

                let query = {};

                // 🔍 EMAIL SEARCH (case insensitive)
                if (search) {
                    query.email = {
                        $regex: search,
                        $options: "i",
                    };
                }

                const users = await userCollection
                    .find(query)
                    .toArray();

                res.json({
                    success: true,
                    data: users,
                });

            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
        //block and unblock
        app.patch("/users/:id/status", async (req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.body;

                const result = await userCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { status } }
                );

                res.json({
                    success: true,
                    message: `User ${status} successfully`,
                });

            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
        //make admin:
        app.patch("/users/:id/make-admin", async (req, res) => {
            try {
                const { id } = req.params;

                await userCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { role: "admin" } }
                );

                res.json({
                    success: true,
                    message: "User promoted to admin",
                });

            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        });



        app.get("/transactions", async (req, res) => {
            try {
                const transactions = await bookingCollection
                    .find({
                        transactionId: { $exists: true }
                    })
                    .sort({ paymentDate: -1 })
                    .toArray();

                res.json({
                    success: true,
                    data: transactions,
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });


        app.get("/trainers", async (req, res) => {
            try {
                const trainers = await userCollection
                    .find({ role: "trainer" })
                    .toArray();

                res.json({
                    success: true,
                    data: trainers,
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.patch("/users/:id/remove-trainer", async (req, res) => {
            try {
                const { id } = req.params;

                await userCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            role: "user",
                        },
                    }
                );

                res.json({
                    success: true,
                    message: "Trainer role removed successfully",
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        });

        const { ObjectId } = require("mongodb");

        app.get("/users/:id", async (req, res) => {
            try {
                const { id } = req.params;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({
                        success: false,
                        message: "Invalid user id",
                    });
                }

                const user = await userCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!user) {
                    return res.status(404).send({
                        success: false,
                        message: "User not found",
                    });
                }

                return res.send({
                    success: true,
                    data: user,
                });
            } catch (error) {
                return res.status(500).send({
                    success: false,
                    message: "Server error",
                    error: error.message,
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