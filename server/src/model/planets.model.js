const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");

const planets = require('./planets.mongo');

function HabiltablePlanetFilter(planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}

const habitablePlanets = [];
function loadAllPlanets() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv")
    )
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        if (HabiltablePlanetFilter(data)) {
          await savePlanets(data)
        }
      })
      .on("error", (err) => {
        console.log("error: ", err);
        reject(err);
      })
      .on("end", async () => {
        resolve();
        const totalHabitablePlanets = (await getAllPlanets()).length
        // console.log(await getAllPlanets())
        console.log(`${totalHabitablePlanets} plantes are the total habitable planets discovered`)
      });
  });
}

async function savePlanets(planet) {
  try {
    // const firstPlanet = await planets.findOne({ keplerName: "Kepler-1410 b" });

    // if(firstPlanet) {
    //   console.log('planets already loaded!')
    //   return
    // }

    await planets.updateOne({
      keplerName: planet.kepler_name
    }, {
      keplerName: planet.kepler_name
    }, {
      upsert: true
    })
  } catch (error) {
    console.log(`couldn't save planet: ${error}`)
  }
}

async function getAllPlanets() {
  return await planets.find({}, {'_id': 0, '__v': 0})
};

module.exports = {
  loadAllPlanets,
  getAllPlanets,
};
