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
var cors = require("cors");

var corsOptions = {
  origin: /oort\.codyhatfield\.me$/,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

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

async function getAccessToken(res: any, userId: any) {
  const SmartcarUser = Moralis.Object.extend("SmartcarUser");
  const query = new Moralis.Query(SmartcarUser);
  query.equalTo("userId", userId);
  const results = await query.find();

  if (results.length == 0) {
    res.sendStatus(404);
    return;
  }

  const user = results[0];
  let accessToken = user.get("accessToken");

  try {
    await smartcar.getUser(accessToken);
  } catch (err) {
    const refreshToken = user.get("refreshToken");
    const tokens = await smartcarClient.exchangeRefreshToken(refreshToken);

    accessToken = tokens.accessToken;

    user.set("accessToken", tokens.accessToken);
    user.set("refreshToken", tokens.refreshToken);
    user.set("refreshExpiration", tokens.refreshExpiration);
    await user.save();
  }

  await smartcar.getUser(accessToken);
  return accessToken;
}

router.options("/users/:userId", cors(corsOptions));
router.post(
  "/users/:userId",
  cors(corsOptions),
  async (req: any, res: any, next: any) => {
    try {
      const userId = req.params.userId;
      await Moralis.start({
        serverUrl: process.env.MORALIS_SERVER_URL,
        appId: process.env.MORALIS_APP_ID,
        masterKey: process.env.MORALIS_MASTER_KEY,
      });
      const SmartcarUser = Moralis.Object.extend("SmartcarUser");

      const tokens = await smartcarClient.exchangeCode(req.body.code);
      const smartcarUser = await smartcar.getUser(tokens.accessToken);

      const moralisSmartcarUser = new SmartcarUser();
      moralisSmartcarUser.set("userId", userId);
      moralisSmartcarUser.set("smartcarUserId", smartcarUser.id);
      moralisSmartcarUser.set("accessToken", tokens.accessToken);
      moralisSmartcarUser.set("refreshToken", tokens.refreshToken);
      moralisSmartcarUser.set("refreshExpiration", tokens.refreshExpiration);
      await moralisSmartcarUser.save();

      const vehicles = await smartcar.getVehicles(tokens.accessToken);
      res.json({ success: true, ...vehicles });
    } catch (err) {
      next(err);
    }
  }
);

router.options("/users/:userId/token", cors(corsOptions));
router.get(
  "/users/:userId/token",
  cors(corsOptions),
  async (req: any, res: any, next: any) => {
    // TODO: Authentication

    try {
      await Moralis.start({
        serverUrl: process.env.MORALIS_SERVER_URL,
        appId: process.env.MORALIS_APP_ID,
        masterKey: process.env.MORALIS_MASTER_KEY,
      });

      const userId = req.params.userId;
      const accessToken = await getAccessToken(res, userId);

      await did.authenticate();
      const jwe = await did.createDagJWE(accessToken, [did.id]);
      const encodedJwe = dagJose.encode(jwe);

      res.json({ encryptedToken: base58btc.encode(encodedJwe).toString() });
    } catch (err) {
      next(err);
    }
  }
);

router.options("/users/:userId/vehicles", cors(corsOptions));
router.get(
  "/users/:userId/vehicles",
  cors(corsOptions),
  async (req: any, res: any, next: any) => {
    try {
      await Moralis.start({
        serverUrl: process.env.MORALIS_SERVER_URL,
        appId: process.env.MORALIS_APP_ID,
        masterKey: process.env.MORALIS_MASTER_KEY,
      });
      const userId = req.params.userId;
      const accessToken = await getAccessToken(res, userId);

      const vehicles = await smartcar.getVehicles(accessToken);
      const vehicleInfo = await Promise.all(
        vehicles.vehicles.map(async (v: any) => {
          const vehicle = new smartcar.Vehicle(v, accessToken);
          const attributes = await vehicle.attributes();
          const vin = await vehicle.vin();

          return {
            ...attributes,
            vin: vin.vin,
          };
        })
      );

      res.json({ success: true, vehicles: vehicleInfo });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
