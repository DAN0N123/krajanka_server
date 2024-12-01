const express = require("express");
const router = express.Router();
const connection = require("../database");
const { Route } = connection.models;
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

async function createPlanAndAddStops() {
  // Plan details
  const planData = {
    title: "Test",
    starts: {
      day: 31,
      month: 5,
      year: 2023,
    },
  };

  // First create a plan for a specific day. Here we create one named "Test" for
  // the day 2023-05-31.
  const planResponse = await axios.post(
    "https://api.getcircuit.com/public/v0.2b/plans",
    planData,
    {
      auth: { username: apiKey },
    }
  );

  // The response will return an object similar to the following:
  // {
  //   "id": "plans/FQ95Ex714KYeojkeIm77",
  //   "title": "Test",
  //   "starts": {
  //     "day": 31,
  //     "month": 5,
  //     "year": 2023
  //   },
  //   ...
  // }
  const plan = planResponse.data;
  console.log(plan);

  // Stop details. Remember to provide valid addresses.
  const stopData = [
    {
      address: {
        addressLineOne: "Some valid address",
      },
    },
    {
      address: {
        addressLineOne: "Some other valid address",
      },
    },
  ];

  // Now, with the returned ID, we can add stops to this plan
  const stopsImportResponse = await axios.post(
    `https://api.getcircuit.com/public/v0.2b/${plan.id}/stops:import`,
    stopData,
    {
      auth: { username: apiKey },
    }
  );

  // With proper addresses the above request will return a response similar to the
  // following:
  // {
  //   "success": [
  //     "plans/FQ95Ex714KYeojkeIm77/stops/vgsTiQi85ueWRs1JnXx7",
  //     "plans/FQ95Ex714KYeojkeIm77/stops/q0HUM8SwBPt8n3pYZOeO"
  //   ],
  //   "failed": []
  // }
  const stops = stopsImportResponse.data;
  console.log(stops);

  // If you wish to retrieve more information about one of the create stops you can
  // issue a GET request for it:
  const stopGetResponse = await axios.get(
    `https://api.getcircuit.com/public/v0.2b/${stops.success[0]}`,
    {
      auth: { username: apiKey },
    }
  );

  // The response will return information about the stop.
  const stopInfo = stopGetResponse.data;
  console.log(stopInfo);
}
