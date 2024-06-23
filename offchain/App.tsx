import { useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import { Address, applyDoubleCborEncoding, applyParamsToScript, Blockfrost, Data, Lucid, SpendingValidator, TxComplete, WalletApi } from "lucid-cardano";

type Wallet = {
  name: string;
  icon: string;
  apiVersion: string;
  enable(): Promise<WalletApi>;
  isEnabled(): Promise<boolean>;
};

const SmartContract = {
  spend:
    "5902990100003232323232323232323232232232322322533300b32533300c3370e900118071baa30123013300f3754004264a6601c6e64c8c8ccc004004cc050dd49b98373291011165787472615f7369676e61746f72696573003301437526e61241023a20003301437526e60dcca4410122003301437526e60c8dcc9919980080099b80371a0049000a450022253330133371000490000800899191919980300319b8000548004cdc599b80002533301633710004900a0a40c0290570099b8b33700002a66602c66e200052014148180520ae010043370c004901019b8300148080cdc70020011bb3300330123754008660286ea4dcc1b994890122004bd70245002225333015002100113233300400430190035333012300c371a00426e600044cdc500119b8a00537300026e64dd7180b8011b9849100132330010013758600460226ea800c894ccc04c004528099299980819b8f375c602c00401829444cc00c00c004c0580048c04cc050c050c050c050c050c050c050c05000454cc03524012c657870656374205370656e64285f293a20536372697074507572706f7365203d206374782e707572706f736500163011300e37540022930a998062491856616c696461746f722072657475726e65642066616c736500136565333333011001153330093003300b37540022a66601a60186ea8004526153300a00716153300a00716153300a00716153300a00716153300a00716153300a00716533333300f002153330073001300937540042a66601660146ea8008526153300800616153300800616153300800616153300800616153300800616153300800616370e90001bae00149010f5f72656465656d65723a20566f69640049010c5f646174756d3a20566f6964005734ae7155ceaab9e5573eae815d0aba257481",
  mint: "",
  stake: "",
};

export default function App() {
  const [lucid, setLucid] = useState<Lucid>();
  const [wallets, setWallets] = useState<Wallet[]>();
  const [userAddress, setUserAddress] = useState<Address>("");
  const [scriptAddress, setScriptAddress] = useState<Address>("");
  const [spendingValidator, setSpendingValidator] = useState<SpendingValidator>();

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
    if (!lucid) return; // skip
    if (!userAddress) return; // skip

    const pkh = lucid.utils.paymentCredentialOf(userAddress).hash;

    const script = applyParamsToScript(SmartContract.spend, [pkh]);
    const validator: SpendingValidator = {
      type: "PlutusV2",
      script: applyDoubleCborEncoding(script),
    };
    setSpendingValidator(validator);

    const address = lucid.utils.validatorToAddress(validator);
    setScriptAddress(address);
  }, [userAddress]);

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
        if (!spendingValidator) {
          throw "Uninitialized Spending Validator";
        }

        const utxos = await lucid.utxosAt(scriptAddress);
        if (!utxos.length) {
          throw "Empty Script Address";
        }

        const tx = await lucid.newTx().collectFrom(utxos, Data.void()).attachSpendingValidator(spendingValidator).addSigner(userAddress).complete();
        return tx;
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
          className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize"
        >
          {action}
        </Button>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <span>{`User address: ${userAddress}`}</span>
        <span>{`Script address: ${scriptAddress}`}</span>

        {scriptAddress && ( // Actions:
          <div className="flex gap-2">
            {["deposit", "withdraw"].map((action) => (
              <ActionButton key={action} action={action} />
            ))}
          </div>
        )}
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
