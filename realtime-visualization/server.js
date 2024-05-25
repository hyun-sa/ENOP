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
      if (useRAxis === "true") {
        // Maximum 값이 체크된 경우
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
                // Remove the "%" sign and convert to a float
                percentage: {
                  $toDouble: {
                    $substr: [
                      "$percentage",
                      0,
                      { $subtract: [{ $strLenCP: "$percentage" }, 1] },
                    ],
                  },
                },
                children: 1,
              },
            },
            {
              $sort: { percentage: -1 },
            },
            {
              $limit: 10,
            },
            {
              $unwind: {
                path: "$children",
                preserveNullAndEmptyArrays: true,
              },
            },
          ])
          .toArray();
        total = 10; // 상위 10개의 데이터만 선택할 때 total을 10으로 설정
      } else {
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
                children: 1,
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
            {
              $unwind: {
                path: "$children",
                preserveNullAndEmptyArrays: true,
              },
            },
          ])
          .toArray();
        total = await database.collection(collection).countDocuments();
      }
    } else {
      if (useRAxis === "true") {
        // Absolute 값이 체크된 경우
        const initialResults = await database
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

        if (initialResults.length > 0) {
          const minPage = parseInt(`0x${initialResults[0].page}`, 16);
          results = initialResults.map((doc) => ({
            ...doc,
            page: (parseInt(`0x${doc.page}`, 16) - minPage)
              .toString(16)
              .toUpperCase(),
          }));
        } else {
          results = initialResults;
        }

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
