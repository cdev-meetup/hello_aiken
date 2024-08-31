import { applyParamsToScript, Constr } from "lucid-cardano";

export const applyOutputReferenceToMintingScript = (mintingScript: string, txHash: string, txIndex: number) =>
  applyParamsToScript(mintingScript, [
    // OutputReference:
    new Constr(0, [
      new Constr(0, [String(txHash)]), // TransactionID
      BigInt(txIndex), // OutputIndex
    ]),
  ]);
