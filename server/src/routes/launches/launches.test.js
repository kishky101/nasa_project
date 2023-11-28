const supertest = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

const request = supertest(app);

describe("Testing Launches API", () => {
  beforeAll(async () => {
    await mongoConnect();
  });

  afterAll(async () => {
      await mongoDisconnect();
  })

  describe("Testing /GET launches", () => {
    test("should respond with 200 success", async () => {
      const response = await request
        .get("/v1/launches")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  describe("Testing /POST launches", () => {
    const completeLaunchData = {
      mission: "USS Enterprise",
      rocket: "NCC 1710-D",
      target: "kepler-62 f",
      launchDate: "January 28, 2028",
    };
    const launchDataWithoutDate = {
      mission: "USS Enterprise",
      rocket: "NCC 1710-D",
      target: "kepler-62 f",
    };
    const launchDataWithInvalidDate = {
      mission: "USS Enterprise",
      rocket: "NCC 1710-D",
      target: "kepler-62 f",
      launchDate: "hello",
    };

    test('It should respond with 201 created', async () => {
      const response = await request
        .post('/v1/launches')
        .send(completeLaunchData)
        .expect('Content-Type', /json/)
        .expect(201);
  
      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(responseDate).toBe(requestDate);
  
      expect(response.body).toMatchObject(launchDataWithoutDate);
    });

    test("should catch missing required properties", async () => {
      const response = await request
        .post("/v1/launches")
        .send(launchDataWithoutDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Missing required launch property",
      });
    });
    test("should catch invalid dates", async () => {
      const response = await request
        .post("/v1/launches")
        .send(launchDataWithInvalidDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Invalid launch Date",
      });
    });
  });
});