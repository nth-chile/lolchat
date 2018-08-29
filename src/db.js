const MongoClient = require("mongodb").MongoClient;
const assert = require('assert');
const dbURL = `mongodb://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@ds125862.mlab.com:25862/lolchat`;

