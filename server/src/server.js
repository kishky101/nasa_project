const http = require('http');

require('dotenv').config({path: __dirname + "/.env"});

const {mongoConnect} = require('./services/mongo')

const app = require('./app');
const {loadAllPlanets} = require('./model/planets.model');
const {loadLaunchesData} = require('./model/launches.model')


const server = http.createServer(app);

const PORT = process.env.PORT || 8000;



async function startServer() {
    await mongoConnect();
    await loadAllPlanets();
    await loadLaunchesData();

    server.listen(PORT, () => {
        console.log(`Listening on port ${PORT}...`)
    })
};

startServer();
