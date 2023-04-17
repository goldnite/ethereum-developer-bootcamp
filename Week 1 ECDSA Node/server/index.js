const express = require("express");
const app = express();
const cors = require("cors");
const { secp256k1: secp } = require("ethereum-cryptography/secp256k1");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");
const port = 3042;

app.use(cors());
app.use(express.json());

/* Key pairs
Private key: 26c9710dd6ff88261698a73650d6374127ae1bfb9215460a106883c6d8538a05
Public Key: 02d26f38649c954f8858693ce73947e68e502c8c9f2727fdf2d7585349bfbe370e

Private key: ec0642f4a8afed16a73c0f828c688c19cb87545598bf516f9eba73fd60147d44
Public Key: 0336efc7fedfe5efca740fddf6f0fcb4b1d5f672dda053530bacf63834e1193496

Private key: 74ab7103c8c2280aba1cb5b964cc4a1de04ba9fc81aab000513265d9103309a0
Public Key: 03778a57ea2a094b95bc4bc55bed4b36772eebf6e259a748115c05e1430dbdb20e 
*/

const balances = {
  "02d26f38649c954f8858693ce73947e68e502c8c9f2727fdf2d7585349bfbe370e": 100,
  "0336efc7fedfe5efca740fddf6f0fcb4b1d5f672dda053530bacf63834e1193496": 50,
  "03778a57ea2a094b95bc4bc55bed4b36772eebf6e259a748115c05e1430dbdb20e": 75,
};

const nonces = {
  "02d26f38649c954f8858693ce73947e68e502c8c9f2727fdf2d7585349bfbe370e": 0,
  "0336efc7fedfe5efca740fddf6f0fcb4b1d5f672dda053530bacf63834e1193496": 0,
  "03778a57ea2a094b95bc4bc55bed4b36772eebf6e259a748115c05e1430dbdb20e": 0,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.get("/nonce/:address", (req, res) => {
  const { address } = req.params;
  const nonce = nonces[address] || 0;
  res.send({ nonce });
});

app.post("/send", (req, res) => {
  const { transaction, signature } = req.body;
  const { from: sender, to: recipient, value: amount, nonce } = transaction;

  console.log("transaction :>> ", transaction);
  console.log("signature :>> ", signature);

  initializeAddress(sender);
  initializeAddress(recipient);

  // calculate txHash and verify signature
  const txHash = keccak256(utf8ToBytes(JSON.stringify(transaction)));
  const isValid = secp.verify(signature, toHex(txHash), sender);

  if (!isValid || nonce != nonces[sender])
    res.status(400).send({ message: "Invalid signature!" });
  nonces[sender]++;

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function initializeAddress(address) {
  if (!balances[address]) {
    balances[address] = 0;
    nonces[address] = 0;
  }
}
