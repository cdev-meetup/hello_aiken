import { useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import {
  Address,
  applyDoubleCborEncoding,
  applyParamsToScript,
  Blockfrost,
  Constr,
  Data,
  fromText,
  Lucid,
  MintingPolicy,
  PolicyId,
  SpendingValidator,
  TxComplete,
  Unit,
  UTxO,
  WalletApi,
} from "lucid-cardano";

type Wallet = {
  name: string;
  icon: string;
  apiVersion: string;
  enable(): Promise<WalletApi>;
  isEnabled(): Promise<boolean>;
};

const KeyName = fromText("Hello Aiken");

const SmartContract = {
  spend:
    // spending validator: [hello.spend]
    "5903880100003232323232323232323232232232322322533300b53300c37326464666002002660246ea4dcc1b99488108506f6c6963794964003301237526e61241023a20003301237526e60dcca4410122003301237526e60c8dcc9919980080099b80371a0049000a450022253330113371000490000800899191919980300319b8000548004cdc599b80002533301433710004900a0a40c0290570099b8b33700002a66602866e200052014148180520ae010043370c004901019b8300148080cdc70020011bb33752012660246ea4dcc1b994890122004bd70245002225333013002100113233300400430170035333010300a371a00426e600044cdc500119b8a00537300026e64dd7180a8011b9849100132533300c3370e900118071baa3001300f37540042646464660020026eb0c010c048dd500111299980a0008a501325333011323233001001323300100137566012602e6ea800c894ccc06400452f5c0264666444646600200200644a66603e0022006264660426e9ccc084dd480319810980f00099810980f800a5eb80cc00c00cc08c008c084004dd7180c0009bab301900133003003301d002301b00122533301800114a0264a66602aa66602a66e3cdd7180d9bac301b00201113322323300100100322533301d00114a0264a66603466e3cdd718100010020a511330030030013020001375860366038603860386038603860386038603860306ea8020c94ccc058c040c060dd500089bae301c3019375400226eb8c070c064dd50009804980c1baa3009301837540082940528899801801800980d8009803180a1baa301700214a2266006006002602e002600260206ea800c8c04c00454cc03524012c657870656374205370656e64285f293a20536372697074507572706f7365203d206374782e707572706f73650016230123013001149854cc0312411856616c696461746f722072657475726e65642066616c736500136565333333011001153330093003300b37540022a66601a60186ea8004526153300a00716153300a00716153300a00716153300a00716153300a00716153300a00716533333300f002153330073001300937540042a66601660146ea8008526153300800616153300800616153300800616153300800616153300800616153300800616370e90001bae00149010f5f72656465656d65723a20566f69640049010c5f646174756d3a20566f6964005734ae7155ceaab9e5573eae815d0aba257481",
  mint:
    // minting validator: [hello.mint]
    "590429010000323232323232323232323222323225333008533009373264646660020026601e6ea4dcc1b99489045554784f003300f37526e61241023a20003300f37526e60dcca4410122003300f37526e60c8dcc9919980080099b80371a0049000a4500222533300e3371000490000800899191919980300319b8000548004cdc599b80002533301133710004900a0a40c0290570099b8b33700002a66602266e200052014148180520ae010043370c004901019b8300148080cdc70020011bb30073300f37526e60dcca450122004bd7024500222533301000210011323330040043014003533300d3008371a00426e600044cdc500119b8a00537300026e64dd718090011b984910013253330093004300b37540022646464a66601864660020026eb0c00cc040dd50011129998090008a50132533300f3375e600a60246ea8c054008030528899801801800980a80089929998088008a998070058b0992999809180a8010a99980719b8748008dd698088008a51153300f00c16153300f00c16301300132533300d3370e900118079baa00114bd6f7b63009bab301330103754002646600200264660020026eacc050c054c054c054c054c044dd50019129998098008a5eb7bdb1804c8c8c8c94ccc04ccdc8a4500002153330133371e91010000210031005133018337606ea4008dd3000998030030019bab3015003375c6026004602e004602a00244a666024002298103d87a80001323232325333012337220120042a66602466e3c0240084cdd2a40006602e6e980052f5c02980103d87a8000133006006003375660280066eb8c048008c058008c05000454cc0352416165787065637420547275653a20426f6f6c203d0a20202020202074786e2e696e707574730a20202020202020207c3e20616e7928666e28696e70757429207b20696e7075742e6f75747075745f7265666572656e6365203d3d207574786f207d2900163001300e3754008460220026eb8c03cc030dd50008a99805248133657870656374204d696e7428706f6c6963795f6964293a20536372697074507572706f7365203d206374782e707572706f73650016300e300f300b37540022930a99804a491856616c696461746f722072657475726e65642066616c73650013656533333300e002153330063001300837540042a66601460126ea8008526153300700516153300700516153300700516153300700516153300700516153300700516370e90002497b657870656374205b50616972285f2c2031295d203d0a20202020202074786e2e6d696e740a20202020202020207c3e2066726f6d5f6d696e7465645f76616c756528290a20202020202020207c3e20746f6b656e7328706f6c6963795f6964290a20202020202020207c3e20646963742e746f5f706169727328290049010f5f72656465656d65723a20566f6964005734ae7155ceaab9e5573eae815d0aba257481",
  stake: "",
};

export default function App() {
  const [lucid, setLucid] = useState<Lucid>();
  const [wallets, setWallets] = useState<Wallet[]>();
  const [userAddress, setUserAddress] = useState<Address>("");
  const [scriptAddress, setScriptAddress] = useState<Address>("");
  const [spendingValidator, setSpendingValidator] = useState<SpendingValidator>();
  const [mintingValidator, setMintingValidator] = useState<MintingPolicy>();
  const [policyID, setPolicyID] = useState<PolicyId>();

  const [keyUnit, setKeyUnit] = useState<Unit>(); // Unit = `${PolicyID}${AssetName}`
  const [keyUTxO, setKeyUTxO] = useState<UTxO>();

  useEffect(() => {
    async function initLucid() {
      // Create `.env.local` file and set your Blockfrost Project ID as `NEXT_PUBLIC_BF_PID`
      const blockfrost = new Blockfrost("https://cardano-preview.blockfrost.io/api/v0", process.env.NEXT_PUBLIC_BF_PID);
      const lucid = await Lucid.new(blockfrost, "Preview");
      setLucid(lucid);
    }
    initLucid();

    const wallets = [];
    for (const key in window.cardano) {
      if (window.cardano[key].apiVersion) {
        wallets.push(window.cardano[key]);
      }
    }

    wallets.sort((l, r) => {
      return l.name.toUpperCase() < r.name.toUpperCase() ? -1 : 1;
    });
    setWallets(wallets);
  }, []);

  useEffect(() => {
    if (!lucid || !userAddress) return; // skip

    findKeyInWallet(lucid).then(([keyUnit, keyUTxO]) => {
      if (!keyUTxO) return; // skip

      const keyPolicy = keyUnit.substring(0, 56);
      setPolicyID(keyPolicy);

      const spendingScript = applyParamsToScript(SmartContract.spend, [keyPolicy]);
      const spendingValidator: SpendingValidator = {
        type: "PlutusV2",
        script: applyDoubleCborEncoding(spendingScript),
      };
      setSpendingValidator(spendingValidator);

      const address = lucid.utils.validatorToAddress(spendingValidator);
      setScriptAddress(address);
    });
  }, [userAddress]);

  async function findKeyInWallet(lucid: Lucid): Promise<[Unit, UTxO?]> {
    const utxos = await lucid.wallet.getUtxos();

    let asset = "";
    const keyUTxO = utxos.find((utxo) => {
      // find a UTxO with the key in its assets
      return Object.keys(utxo.assets).find((key) => {
        // find the asset by key name
        if (key.endsWith(KeyName)) {
          // if the name matches then save the key unit (PolicyID|AssetName)
          asset = key;
          return true;
        } else {
          return false;
        }
      });
    });

    setKeyUnit(asset);
    setKeyUTxO(keyUTxO);

    return [asset, keyUTxO];
  }

  function WalletsConnector(props: { lucid: Lucid; wallets: Wallet[] }) {
    const { lucid, wallets } = props;

    async function connectWallet(wallet: Wallet) {
      const api = await wallet.enable();
      lucid.selectWallet(api);

      const address = await lucid.wallet.address();
      setUserAddress(address);
    }

    return (
      <div className="flex gap-2">
        {wallets.map((wallet) => (
          <Button
            key={wallet.name}
            onClick={() => connectWallet(wallet)}
            radius="full"
            className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize"
          >
            {wallet.name}
          </Button>
        ))}
      </div>
    );
  }

  function Dashboard(props: { lucid: Lucid }) {
    const { lucid } = props;

    const actions: Record<string, () => Promise<TxComplete>> = {
      deposit: async () => {
        const tx = await lucid
          .newTx()
          .payToContract(scriptAddress, Data.void(), {
            lovelace: 42_000000n, // tsconfig.json => target: ESNext
          })
          .complete();
        return tx;
      },

      withdraw: async () => {
        if (!keyUTxO) {
          throw "Key Not Found";
        }

        if (!spendingValidator) {
          throw "Uninitialized Spending Validator";
        }

        const utxos = await lucid.utxosAt(scriptAddress);
        if (!utxos.length) {
          throw "Empty Script Address";
        }

        const tx = await lucid
          .newTx()
          .readFrom([keyUTxO])
          .collectFrom(utxos, Data.void())
          .attachSpendingValidator(spendingValidator)
          .addSigner(userAddress)
          .complete();
        return tx;
      },

      mint: async () => {
        const utxos = await lucid.wallet.getUtxos();
        if (!utxos.length) {
          throw "Empty Wallet Address";
        }

        const utxo = utxos[0];
        const txHash = new Constr(0, [String(utxo.txHash)]);
        const outputIndex = BigInt(utxo.outputIndex);
        const oRef = new Constr(0, [txHash, outputIndex]);

        const mintingScript = applyParamsToScript(SmartContract.mint, [oRef]);
        const mintingValidator: MintingPolicy = {
          type: "PlutusV2",
          script: applyDoubleCborEncoding(mintingScript),
        };

        const policyID = lucid.utils.mintingPolicyToId(mintingValidator);

        return await lucid
          .newTx()
          .collectFrom([utxo])
          .mintAssets(
            {
              [`${policyID}${KeyName}`]: 1n, // BigInt(1)
            },
            Data.void()
          )
          .attachMintingPolicy(mintingValidator)
          .complete();
      },
    };

    async function submitTx(tx: TxComplete) {
      const txSigned = await tx.sign().complete();
      const txHash = txSigned.submit();
      return txHash;
    }

    function ActionButton(props: { action: string }) {
      const { action } = props;
      const constructTx = actions[action];

      return (
        <Button
          onClick={() =>
            constructTx()
              .then((tx) => submitTx(tx).then(console.log).catch(console.log))
              .catch(console.log)
          }
          radius="full"
          className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize w-fit"
        >
          {action}
        </Button>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          {userAddress && <span>{`User address: ${userAddress}`}</span>}
          {scriptAddress && <span>{`Script address: ${scriptAddress}`}</span>}
          {policyID && <span>{`Key Policy: ${policyID}`}</span>}
        </div>

        <div className="flex flex-col gap-2">
          {!keyUnit && !scriptAddress && <span>Loading...</span>}

          {/* Mint */}
          {"" === keyUnit && <ActionButton action="mint" />}

          {/* Deposit | Withdraw */}
          {scriptAddress && (
            <div className="flex gap-2">
              {["deposit", "withdraw"].map((action) => (
                <ActionButton key={action} action={action} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return lucid ? (
    userAddress ? ( // when wallet connected:
      <Dashboard lucid={lucid} />
    ) : wallets ? (
      wallets.length ? ( // when no wallet connected yet, show wallet list:
        <WalletsConnector lucid={lucid} wallets={wallets} />
      ) : (
        <>NO CARDANO WALLET</>
      )
    ) : (
      <>BROWSING FOR WALLETS</>
    )
  ) : (
    <>INITIALIZING LUCID</>
  );
}
