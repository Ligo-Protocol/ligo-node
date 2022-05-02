import { Router } from "express";
import "dotenv/config";
import * as smartcar from "smartcar";

const smartcarClient = new smartcar.AuthClient({
  testMode: true,
});

var router = Router();

router.post("/authorize", async (req: any, res: any, next: any) => {
  try {
    // exchange auth code for access token
    const tokens = await smartcarClient.exchangeCode(req.body.code);
    // get the user's vehicles
    const vehicles = await smartcar.getVehicles(tokens.accessToken);
    // instantiate first vehicle in vehicle list
    const vehicle = new smartcar.Vehicle(
      vehicles.vehicles[0],
      tokens.accessToken
    );
    // get identifying information about a vehicle
    const attributes = await vehicle.attributes();
    res.json(attributes);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
