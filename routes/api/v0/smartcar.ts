import { Router } from "express";
import "dotenv/config";
import * as smartcar from "smartcar";
import Moralis from "moralis/node";

const smartcarClient = new smartcar.AuthClient({
  testMode: true,
});

var router = Router();

router.post("/authorize", async (req: any, res: any, next: any) => {
  try {
    await Moralis.start({
      serverUrl: process.env.MORALIS_SERVER_URL,
      appId: process.env.MORALIS_APP_ID,
      masterKey: process.env.MORALIS_MASTER_KEY,
    });
    const Vehicle = Moralis.Object.extend("Vehicle");

    const tokens = await smartcarClient.exchangeCode(req.body.code);
    const vehicles = await smartcar.getVehicles(tokens.accessToken);

    await Promise.all(
      vehicles.vehicles.map(async (v: any) => {
        const scVehicle = new smartcar.Vehicle(v, tokens.accessToken);
        const attributes = await scVehicle.attributes();

        const moralisVehicle = new Vehicle();
        moralisVehicle.set("vehicleId", attributes.id);
        moralisVehicle.set("accessToken", tokens.accessToken);
        moralisVehicle.set("refreshToken", tokens.refreshToken);
        moralisVehicle.set("refreshExpiration", tokens.refreshExpiration);
        await moralisVehicle.save();
      })
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
