const mongoose=require("mongoose");
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)

const db=mongoose.connection;

db.on('connected',()=>{
    console.log("Connected to MongoDB");
})

db.on('error',(err)=>{
    console.error(`Error in Connection to MongoDb: ${err}`)
})

db.on('disconnected',()=>{
    console.log("Disconnected from MongoDB");
})

module.exports=db;