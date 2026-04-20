const express = require('express');
const { supabase, testConnection } = require('./config/db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Test database connection
testConnection();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, ()=>{
    console.log(`Server is listening on port ${port}`);
})
