const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Hello from the back end')
});

app.listen(port, () => {
    console.log('This is ok!');
})