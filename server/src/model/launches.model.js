const axios = require('axios')

const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo')

const launches = new Map();

const DEFAULT_FLIGHTNUMBER = 100;

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

// const launch = {
//     flightNumber: 100, //flight_number
//     mission: 'Kepler Exploration X', //name
//     rocket: 'Explorer IS1', //rocket.name
//     launchDate: new Date('December 27, 2030'), //date_local
//     target: 'Kepler-442 b',
//     customers: ['ZTM', 'NASA'], //payloads.customers
//     upcoming: true, //upcoming
//     success: true, //success
// };

// // launches.set(launch.flightNumber, launch);
// saveLaunch(launch)

async function populateLaunches() {
    console.log('Downlaoding SpaceX data...')
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: "rocket",
                    select: {
                        name: 1
                    }
                },
                {
                    path: "payloads",
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    });

    const launchDocs = response.data.docs;

    for (const launchDoc of launchDocs) {
        const paylods = launchDoc['payloads'];
        const customers = paylods.flatMap((payload) => payload['customers'])

        const launchData = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers: customers
        };

        await saveLaunch(launchData);
        // console.log(`${launchData.flightNumber} ${launchData.mission}`);

    }
}

async function loadLaunchesData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        mission: 'FalconSat',
        rocket: 'Falcon 1'
    })

    if(firstLaunch) {
        console.log(`Launches already loaded!`);
    }else {
        await populateLaunches();
    } 
}

async function findLaunch(filter) {
    return await launchesDatabase.findOne(filter)
} 

async function existsLaunchWithId(launchId) {
    return await findLaunch({
        flightNumber: launchId
    })
};

async function getAllLaunches(skip, limit) {
    return await launchesDatabase.find({}, {'_id': 0, '__v': 0})
                    .sort({ flightNumber: 1 })
                    .skip(skip)
                    .limit(limit);
};

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDatabase.findOne()
                        .sort('-flightNumber');
    
    if(!latestLaunch) {
        return DEFAULT_FLIGHTNUMBER
    }

    return latestLaunch.flightNumber;
}

async function saveLaunch(newLaunch) {
    try {
        return await launchesDatabase.findOneAndUpdate({
            flightNumber: newLaunch.flightNumber
        }, newLaunch, {
            upsert: true
        })
    } catch (error) {
        console.log(`couldn't save launch: ${error}`)   
    }
}

async function scheduleNewLaunch(newLaunch) {
    try {
        const planet = await planets.findOne({keplerName: newLaunch.target});

        if(!planet) {
            throw new Error(`Planet doesn't exist in list of planets`)
        }

        const latestFlightNumber = await getLatestFlightNumber() + 1;

        const latestLaunch = Object.assign(newLaunch, {
            flightNumber: latestFlightNumber,
            customers: ['ZTM', 'NASA'],
            upcoming: true,
            success: true,
        })
    
        return await saveLaunch(latestLaunch);
    } catch (error) {
        throw new Error(`couldn't schedule new launch`)
    }
}


async function abortLaunch(launchId) {
    const aborted = await launchesDatabase.updateOne({
        flightNumber: launchId
    }, {
        upcoming: false,
        success: false
    })
    // console.log(aborted)

    return aborted.modifiedCount === 1
}


module.exports = {
    existsLaunchWithId,
    getAllLaunches,
    scheduleNewLaunch,
    abortLaunch,
    loadLaunchesData
};