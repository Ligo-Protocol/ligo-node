// Test the encryption to a did:web
import "dotenv/config";
import { fromString } from "uint8arrays/from-string";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { Resolver } from "did-resolver";
import WebResolver from "web-did-resolver";
import KeyResolver from "key-did-resolver";
import { DID } from "dids";

const webResolver = WebResolver.getResolver();
const keyResolver = KeyResolver.getResolver();

const jwe = {
  protected: "eyJlbmMiOiJYQzIwUCJ9",
  iv: "EuFAILDLTi0WLNOa5OdyDAsXKhyrz1lY",
  ciphertext: "Z6vT1XrdDgJRPwAL1DiQ3jjPLI0SzKqF",
  tag: "ZsclmCqIKapjEcE_Y0yzDQ",
  recipients: [
    {
      encrypted_key: "_Ph7GUr2x1JiazOXhYStxVAnheb6ene-0pi6BqKaeS0",
      header: {
        alg: "ECDH-ES+XC20PKW",
        iv: "LmM7nR9Ui5BJbtCgVDuup-DzaUuIuDBT",
        tag: "LRSAfxXPLvMtQjUhTkcQAg",
        epk: {
          kty: "OKP",
          crv: "X25519",
          x: "NXNZD0GruSxdcVf6H0rV8e8W7ZQMZ_7OHbrQrKzWx10",
        },
        kid: "did:key:z6MkphrJeADYB4wrGcPAJNPnNJhAcS9cmTy5ZRwQUB63t9bV#z6LSsKGXpcg696pKp5B4B1HdvvCchCBvWPYMiCw8m2mKTNFX",
      },
    },
  ],
};

const seed = fromString(process.env.KEY_SEED, "base16");
const provider = new Ed25519Provider(seed);
const did = new DID({
  provider,
  resolver: new Resolver({
    ...webResolver,
    ...keyResolver,
  }),
});
await did.authenticate();

console.log(await did.decryptDagJWE(jwe));
