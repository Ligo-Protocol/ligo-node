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
import * as dagJose from "dag-jose";
import { base58btc } from "multiformats/bases/base58";

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

router.get(
  "/vehicles/:vehicleId/odometer",
  async (req: any, res: any, next: any) => {
    try {
      const encryptedToken = req.query.encryptedToken;
      const vehicleId = req.params.vehicleId;

      const jwe = dagJose.decode(base58btc.decode(encryptedToken)) as any;

      await did.authenticate();
      const accessToken = await did.decryptDagJWE(jwe);

      const scVehicle = new smartcar.Vehicle(vehicleId, accessToken);
      const odometer = await scVehicle.odometer();

      res.json(odometer);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
