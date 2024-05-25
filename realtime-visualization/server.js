const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());

const mongoUri = "mongodb://tux:password@10.198.137.166:27017";
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

app.get("/data", async (req, res) => {
  const {
    db,
    collection,
    page = 1,
    pageSize = 10000,
    useRAxis = false,
  } = req.query;
  if (!db || !collection) {
    return res.status(400).send("Database and collection are required");
  }

  const skip = (page - 1) * pageSize;
  const limit = parseInt(pageSize, 10);

  try {
    const client = mongoose.connection.client;
    const database = client.db(db);
    console.log(`Fetching data from ${db}.${collection}`);

    let results;
    let total;

    if (db === "perf_data") {
      results = await database
        .collection(collection)
        .aggregate([
          {
            $match: {},
          },
          {
            $project: {
              _id: 0,
              symbol: 1,
              percentage: 1,
            },
          },
          {
            $sort: { symbol: 1 },
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ])
        .toArray();
      total = await database.collection(collection).countDocuments();
    } else {
      if (useRAxis === "true") {
        // Absolute 값이 체크된 경우
        results = await database
          .collection(collection)
          .aggregate([
            {
              $project: {
                _id: 0,
                timestamp: 1,
                page: {
                  $subtract: [
                    { $toLong: "$page" },
                    {
                      $toLong: {
                        $reduce: {
                          input: {
                            $map: {
                              input: {
                                $split: ["$page", ""],
                              },
                              as: "char",
                              in: {
                                $convert: {
                                  input: "$$char",
                                  to: "int",
                                  onError: 0,
                                  onNull: 0,
                                },
                              },
                            },
                          },
                          initialValue: Number.MAX_VALUE,
                          in: {
                            $min: ["$$value", "$$this"],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
            {
              $sort: { page: 1 },
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ])
          .toArray();
        total = await database.collection(collection).countDocuments();
      } else {
        // 기존 쿼리
        results = await database
          .collection(collection)
          .find(
            {},
            {
              projection: {
                _id: 0,
                timestamp: 1,
                page: 1,
              },
            }
          )
          .sort({ page: 1 })
          .skip(skip)
          .limit(limit)
          .toArray();
        total = await database.collection(collection).countDocuments();
      }
    }

    console.log(`Fetched data:`, results);

    res.json({ data: results, total });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send(error);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
