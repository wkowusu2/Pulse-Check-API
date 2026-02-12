const express = require('express'); 

const monitorRouter = require('./src/routes/monitor-route.js');

const app = express(); 

app.use(express.json()); 

app.use("/api", monitorRouter);


const PORT = 4000;


app.listen(PORT, () => {
    console.log("Server is running on port:", PORT);
});