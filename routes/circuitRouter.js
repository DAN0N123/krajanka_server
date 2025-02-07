const express = require("express");
const router = express.Router();
const connection = require("../database");
const { Route } = connection.models;
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { geocodeAddress } = require("../misc/geocodeAddress");
const axios = require("axios");

async function getRouteId(name) {
  try {
    const response = await axios.get(
      "https://api.getcircuit.com/public/v0.2b/plans",
      {
        headers: {
          Authorization: `Bearer ${process.env.CIRCUIT_API_KEY}`,
        },
      }
    );

    const routeId = response.data.plans
      .find((plan) => plan.title === name)
      .id.split("/")[1];

    return routeId;
  } catch (error) {
    console.error("Error fetching routes:", error);
  }
}

async function addStopsToRoute(routeName, stops) {
  const routeId = await getRouteId(routeName);

  const response = await axios.post(
    `https://api.getcircuit.com/public/v0.2b/plans/${routeId}/stops:import`,
    stops,
    {
      headers: {
        Authorization: `Bearer ${process.env.CIRCUIT_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

router.post("/routes/:routeName/addStops", async (req, res) => {
  const routeName = req.params.routeName;
  const addresses = req.body.addresses;

  if (!Array.isArray(addresses) || addresses.length === 0) {
    return res.status(400).json({
      success: false,
      message:
        'Please provide a non-empty "addresses" array in the request body',
    });
  }

  try {
    const geocodePromises = addresses.map((addr) =>
      geocodeAddress(addr.addressName)
    );
    const geocodedResults = await Promise.all(geocodePromises);

    const stops = addresses.map(
      ({ addressName, phone, notes, paymentMethod }, index) => ({
        address: {
          addressName,
          latitude: geocodedResults[index].latitude,
          longitude: geocodedResults[index].longitude,
        },
        recipient: {
          phone,
        },
        notes: `${paymentMethod} ${notes || ""}`,
      })
    );
    const circuitApiResponse = await addStopsToRoute(routeName, stops);

    return res.status(200).json({
      success: true,
      routeName,
      circuitApiResponse,
    });
  } catch (error) {
    console.error("Error adding stops to Circuit:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
