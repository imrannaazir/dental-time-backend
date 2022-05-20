//import
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());

//connect with db
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.njnzf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//jwt token function
const verifyJWT = (req, res, next) => {
    const authHeaders = req.headers.authorization;
    if (!authHeaders) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    else {
        const token = authHeaders.split(' ')[1]
        jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
            if (err) {
                return res.status(403).send({ message: 'access forbidden' })
            }
            else {
                req.decoded = decoded;
                console.log("last line of the fucntion", req.decoded);
                next()
            }
        })
    }
}


async function run() {
    try {
        await client.connect();
        // create collection
        const serviceCollection = client.db("dental").collection("services")
        const bookingCollection = client.db("dental").collection("booking")
        const userCollection = client.db("dental").collection("users")


        //get all services api
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        //get user api 
        app.get('/users', verifyJWT, async (req, res) => {
            const result = await userCollection.find({}).toArray()
            res.send(result)
        })

        //get my booking
        app.get('/booking', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const patientEmail = req.query.email;
            if (patientEmail === decodedEmail) {
                const query = { patientEmail: patientEmail }
                const cursor = bookingCollection.find(query)
                const myBooking = await cursor.toArray();
                res.send(myBooking)
            }
            else {
                res.status(403).send({ message: 'access forbidden' })
            }
        })

        //get available api
        app.get('/available', async (req, res) => {
            const date = req.query.date;
            const query = { date: date };
            const services = await serviceCollection.find().toArray();
            const myBooking = await bookingCollection.find(query).toArray()
            services.forEach(service => {
                const serviceBookings = myBooking.filter(b => b.treatmentName === service.name);
                const booked = serviceBookings.map(s => s.slot)
                service.booked = booked;
                const available = service.slots.filter(s => !booked.includes(s))
                service.slots = available
            })
            res.send(services)
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
        });

        // put user api
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const query = { email: email }
            const updatedUser = {
                $set: user
            }
            const option = { upsert: true }
            const result = await userCollection.updateOne(query, updatedUser, option)
            const token = jwt.sign({ email: email }, process.env.SECRET_TOKEN, { expiresIn: '1h' })
            res.send({ result, token });
        })

        //make admin put api
        app.put('/users/admin/:email', verifyJWT, async (req, res) => {
            console.log("hello");
            const email = req.params.email;
            console.log(email);
            const requester = req.decoded.email;
            console.log(requester);
            const query = { email: email }
            const updatedDoc = {
                $set: { role: 'admin' }
            }
            const result = await userCollection.updateOne(query, updatedDoc)
            res.send(result)

        })
    }

    finally {

    }
}

//call the run function
run().catch(console.dir)

//root api
app.get('/', (req, res) => {
    res.send('Hello from the back end')
});

//listening port
app.listen(port, () => {
    console.log('This is ok👍👍👍!');
});
