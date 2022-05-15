const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.njnzf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db("dental").collection("services")
        const bookingCollection = client.db("dental").collection("booking")


        //get all services api
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });
        //get my booking
        app.get('/booking', async (req, res) => {
            const patientEmail = req.query.email;
            const query = { patientEmail: patientEmail }
            const cursor = bookingCollection.find(query)
            const myBooking = await cursor.toArray();
            res.send(myBooking)
        })

        //post a booking api
        app.post('/booking', async (req, res) => {
            const newBooking = req.body;
            const query = { treatmentName: newBooking.treatmentName, date: newBooking.date, patientEmail: newBooking.patientEmail };
            const exist = await bookingCollection.findOne(query);
            if (exist) {
                return res.send({ success: false, newBooking: exist })
            }
            else {
                const result = await bookingCollection.insertOne(newBooking);
                res.send({ success: true, newBooking: result });
            }
        })

    }
    finally {

    }
}

/* 
client.connect(err => {
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object
    client.close();
  }); */



app.get('/', (req, res) => {
    res.send('Hello from the back end')
});

app.listen(port, () => {
    console.log('This is ok!');
});

run().catch(console.dir)