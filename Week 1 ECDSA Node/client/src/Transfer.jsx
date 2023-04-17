import { useState } from "react";
import server from "./server";
import { secp256k1 as secp } from "ethereum-cryptography/secp256k1";
import { toHex, utf8ToBytes } from "ethereum-cryptography/utils";
import { keccak256 } from "ethereum-cryptography/keccak";

function Transfer({ privateKey, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();
    console.log("privateKey :>> ", privateKey);
    try {
      const address = toHex(secp.getPublicKey(privateKey));const {
        data: { nonce },
      } = await server.get(`nonce/${address}`);
      console.log('nonce :>> ', nonce);
      const transaction = {
        from: address,
        to: recipient,
        value: parseInt(sendAmount),
        nonce,
      };
      // hash the transaction
      const txHash = keccak256(utf8ToBytes(JSON.stringify(transaction)));

      // create signature from the hash
      const signature = secp.sign(txHash, privateKey).toCompactHex();

      const {
        data: { balance },
      } = await server.post(`send`, {
        transaction,
        signature,
      });
      setBalance(balance);
    } catch (ex) {
      console.log(ex);
      // alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
