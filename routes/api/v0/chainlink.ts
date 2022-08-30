import { Router } from "express";
import "dotenv/config";
import * as smartcar from "smartcar";
import { Resolver } from "did-resolver";
import WebResolver from "web-did-resolver";
import KeyResolver from "key-did-resolver";
import { DID } from "dids";
import { fromString } from "uint8arrays/from-string";
import { Ed25519Provider } from "key-did-provider-ed25519";
import * as dagJose from "dag-jose";
import { base58btc } from "multiformats/bases/base58";
import { Requester, Validator } from "@chainlink/external-adapter";

const customParams = {
  vehicleId: ["vehicleId"],
  encToken: ["encToken"],
  endpoint: false,
};

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

router.post("/", async (req: any, res: any, next: any) => {
  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(req.body, customParams);

  const jobRunID = validator.validated.id;

  try {
    // Validating vehicleId
    const vehicleId = validator.validated.data.vehicleId;
    // Validating encryptedToken
    const encryptedToken = validator.validated.data.encToken;

    const jwe = dagJose.decode(base58btc.decode(encryptedToken)) as any;

    await did.authenticate();
    const accessToken = await did.decryptDagJWE(jwe);

    const scVehicle = new smartcar.Vehicle(vehicleId, accessToken);
    const odometer = await scVehicle.odometer();
    const location = await scVehicle.location();
    const fuel = await scVehicle.fuel();
    const battery = await scVehicle.battery();

    res.json({ jobRunID, data: { ...odometer, ...location, ...fuel, ...battery } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
