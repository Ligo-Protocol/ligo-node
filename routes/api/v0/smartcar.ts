import { Router } from "express";
import "dotenv/config";
import * as smartcar from "smartcar";
import Moralis from "moralis/node";
import { Resolver } from "did-resolver";
import WebResolver from "web-did-resolver";
import KeyResolver from "key-did-resolver";
import { DID } from "dids";
import { fromString } from "uint8arrays/from-string";
import { Ed25519Provider } from "key-did-provider-ed25519";

const smartcarClient = new smartcar.AuthClient({
  testMode: true,
});

const webResolver = WebResolver.getResolver();
const keyResolver = KeyResolver.getResolver();
const seed = fromString(process.env.KEY_SEED!, "base16");
const provider = new Ed25519Provider(seed);

const did = new DID({
  provider,
  resolver: new Resolver({
    ...webResolver,
    ...keyResolver,
  }),
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

    const vehicleInfo = await Promise.all(
      vehicles.vehicles.map(async (v: any) => {
        const scVehicle = new smartcar.Vehicle(v, tokens.accessToken);
        const attributes = await scVehicle.attributes();

        const moralisVehicle = new Vehicle();
        moralisVehicle.set("vehicleId", attributes.id);
        moralisVehicle.set("accessToken", tokens.accessToken);
        moralisVehicle.set("refreshToken", tokens.refreshToken);
        moralisVehicle.set("refreshExpiration", tokens.refreshExpiration);
        await moralisVehicle.save();

        delete attributes["meta"];
        return attributes;
      })
    );

    res.json({ success: true, vehicles: vehicleInfo });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/vehicles/:vehicleId/token",
  async (req: any, res: any, next: any) => {
    // TODO: Authentication

    try {
      await Moralis.start({
        serverUrl: process.env.MORALIS_SERVER_URL,
        appId: process.env.MORALIS_APP_ID,
        masterKey: process.env.MORALIS_MASTER_KEY,
      });

      const vehicleId = req.params.vehicleId;
      const Vehicle = Moralis.Object.extend("Vehicle");
      const query = new Moralis.Query(Vehicle);
      query.equalTo("vehicleId", vehicleId);
      const results = await query.find();

      if (results.length == 0) {
        res.sendStatus(404);
        return;
      }

      const vehicle = results[0];
      let accessToken = vehicle.get("accessToken");

      try {
        const scVehicle = new smartcar.Vehicle(vehicleId, accessToken);
        await scVehicle.permissions();
      } catch (err) {
        const refreshToken = vehicle.get("refreshToken");
        const tokens = await smartcarClient.exchangeRefreshToken(refreshToken);

        accessToken = tokens.accessToken;

        vehicle.set("accessToken", tokens.accessToken);
        vehicle.set("refreshToken", tokens.refreshToken);
        vehicle.set("refreshExpiration", tokens.refreshExpiration);
        await vehicle.save();
      }

      const scVehicle = new smartcar.Vehicle(vehicleId, accessToken);
      await scVehicle.permissions();

      await did.authenticate();
      const jwe = await did.createDagJWE(accessToken, [did.id]);

      res.json({ encryptedToken: jwe });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
