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
  Network,
  PolicyId,
  RewardAddress,
  Script,
  SpendingValidator,
  TxComplete,
  Unit,
  UTxO,
  WalletApi,
} from "lucid-cardano";
import { getPoolList, getPoolMetadata, getStakeInfo } from "./util/blockfrost";

type Json = Record<string, any>;
type Wallet = {
  name: string;
  icon: string;
  apiVersion: string;
  enable(): Promise<WalletApi>;
  isEnabled(): Promise<boolean>;
};

const KeyName = "Cdev Meetup";
const KeyNameHex = fromText(KeyName);

const SmartContract = {
  spend:
    // spending validator: [hello.spend]
    "59079b01000032323232323232323232322322232533333301000215323233300a3001300c37540082a6601692011d52756e6e696e672032206172672076616c696461746f72207374616b6500132533300b32323232323253330113370e90030020a9980919800a450c4b657920506f6c696379496400375201a26600401601a2a66602266e1d20040041533012330014890a43726564656e7469616c0030173014375400a26600401601a294088dcc99191998008009980c9ba937306e64010cc064dd49b98491023a20003301937526e60dcca4410122003301937526e60c8dcc9919980080098071b8d002488100222533301833710004900008008991919199803003180980299b8b33700004a66603666e200092014148180520ae013371666e000054ccc06ccdc4000a4028290300a415c0200866e18009202033706002901019b8e0040023766006660326ea4dcc1b9948810122004bd7024500222533301a0021001132333004004301e0035333017300e371a00426e600044cdc500119b8a00537300026e64dd7180e0011b98491002232323300100137586010602c6ea8008894ccc060004528099299980a99191980080099198008009bab300d301b375400644a66603a002297ae01323332223233001001003225333023001100313233025374e6604a6ea4018cc094c088004cc094c08c0052f5c066006006604e004604a0026eb8c070004dd5980e800998018019810801180f80091299980e0008a50132533301932533301a3371e6eb8c080dd61810001805099198008009bac302130223022302230223022302230223022301e375401444a66604000229404c94ccc074cdc79bae302300200414a226600600600260460022940c94ccc068c044c070dd500089bae3020301d375400226eb8c080c074dd50009805980e1baa300b301c375400829444cc00c00c004c07c004c028c060dd5180d8010a51133003003001301b0013003301437540044602a002601e6ea8004c004c03cdd50031180918098008a4c2a660189211856616c696461746f722072657475726e65642066616c7365001365653333330120051533300a3001300c375400a2a66601c601a6ea8014526153300b00816153300b00816153300b00816153300b00816153300b00816153300b00816153300b49011d52756e6e696e672033206172672076616c696461746f72207370656e640013322322533300e53300f373264646660020026602a6ea4dcc1b9948810c4b657920506f6c6963794964003301537526e61241023a20003301537526e60dcca4410122003301537526e60c8dcc9919980080098051b8d002488100222533301433710004900008008991919199803003180780299b8b33700004a66602e66e200092014148180520ae013371666e000054ccc05ccdc4000a4028290300a415c0200866e18009202033706002901019b8e00400237666ea4030cc054dd49b98373291010122004bd702450022253330160021001132333004004301a0035333013300a371a00426e600044cdc500119b8a00537300026e64dd7180c0011b9849100132533300f3370e900118089baa3001301237540042646464660020026eb0c010c054dd500111299980b8008a50132533301432323300100132330010013756601260346ea800c894ccc07000452f5c0264666444646600200200644a6660440022006264660486e9ccc090dd4803198121810800998121811000a5eb80cc00c00cc098008c090004dd7180d8009bab301c001330030033020002301e00122533301b00114a0264a66603064a66603266e3cdd7180f9bac301f003015132330010013758604060426042604260426042604260426042603a6ea8028894ccc07c004528099299980e19b8f375c604400400829444cc00c00c004c08800452819299980c9808180d9baa0011375c603e60386ea80044dd7180f980e1baa0013009301b3754601260366ea8010528899801801800980f0009803180b9baa301a00214a22660060060026034002600260266ea800c8c05800454cc0412412c657870656374205370656e64285f293a20536372697074507572706f7365203d206374782e707572706f73650016230153016001149854cc03d2411856616c696461746f722072657475726e65642066616c7365001365653333330140011533300c3003300e37540022a666020601e6ea8004526153300d00a16153300d00a16153300d00a16153300d00a16153300d00a16153300d00a1653333330120051533300a3001300c375400a2a66601c601a6ea8014526153300b00916153300b00916153300b00916153300b00916153300b00916153300b009163010300d37540086e1d2000370090008a998048008b0a998048008b0a998048008b0a998048008b248191496e636f72726563742072656465656d6572207479706520666f722076616c696461746f72207370656e642e0a2020202020202020202020202020202020202020446f75626c6520636865636b20796f7520686176652077726170706564207468652072656465656d657220747970652061732073706563696669656420696e20796f757220706c757475732e6a736f6e00375c0029210f5f72656465656d65723a20566f69640049010c5f646174756d3a20566f6964005734ae7155ceaab9e5573eae815d0aba257481",
  mint:
    // minting validator: [hello.mint]
    "5904340100003232323232323232323232223232253330083253330093004300b3754002264a660166e64c8c8ccc004004cc044dd49b98373291010c4b657920506f6c6963794964003301137526e61241023a20003301137526e60dcca4410122003301137526e60c8dcc9919980080099b80371a0049000a450022253330103371000490000800899191919980300319b8000548004cdc599b80002533301333710004900a0a40c0290570099b8b33700002a66602666e200052014148180520ae010043370c004901019b8300148080cdc70020011bb33752006660226ea4dcc1b994890122004bd7024500222533301200210011323330040043016003533300f300a371a00426e600044cdc500119b8a00537300026e64dd7180a0011b984910013232533300c32330010013758600660206ea8008894ccc048004528099299980799baf300530123754602a00401829444cc00c00c004c0540044c94ccc04400454cc03802c584c94ccc048c05400854ccc038cdc3a40046eb4c0440045288a998078060b0a998078060b180980099299980699b8748008c03cdd50008a5eb7bdb1804dd5980998081baa0013233001001323300100137566028602a602a602a602a60226ea800c894ccc04c00452f5bded8c0264646464a66602666e4522100002153330133371e91010000210031005133018337606ea4008dd3000998030030019bab3015003375c6026004602e004602a00244a666024002298103d87a80001323232325333012337220120042a66602466e3c0240084cdd2a40006602e6e980052f5c02980103d87a8000133006006003375660280066eb8c048008c058008c05000454cc0352416165787065637420547275653a20426f6f6c203d0a20202020202074786e2e696e707574730a20202020202020207c3e20616e7928666e28696e70757429207b20696e7075742e6f75747075745f7265666572656e6365203d3d207574786f207d2900163001300e3754008460220026eb8c03cc030dd50008a99805248133657870656374204d696e7428706f6c6963795f6964293a20536372697074507572706f7365203d206374782e707572706f73650016300e300f300b37540022930a99804a491856616c696461746f722072657475726e65642066616c73650013656533333300e002153330063001300837540042a66601460126ea8008526153300700516153300700516153300700516153300700516153300700516153300700516370e90002497b657870656374205b50616972285f2c2031295d203d0a20202020202074786e2e6d696e740a20202020202020207c3e2066726f6d5f6d696e7465645f76616c756528290a20202020202020207c3e20746f6b656e7328706f6c6963795f6964290a20202020202020207c3e20646963742e746f5f706169727328290049010f5f72656465656d65723a20566f6964005734ae7155ceaab9e5573eae815d0aba257481",
  stake:
    // staking validator: [hello.stake]
    "59079b01000032323232323232323232322322232533333301000215323233300a3001300c37540082a6601692011d52756e6e696e672032206172672076616c696461746f72207374616b6500132533300b32323232323253330113370e90030020a9980919800a450c4b657920506f6c696379496400375201a26600401601a2a66602266e1d20040041533012330014890a43726564656e7469616c0030173014375400a26600401601a294088dcc99191998008009980c9ba937306e64010cc064dd49b98491023a20003301937526e60dcca4410122003301937526e60c8dcc9919980080098071b8d002488100222533301833710004900008008991919199803003180980299b8b33700004a66603666e200092014148180520ae013371666e000054ccc06ccdc4000a4028290300a415c0200866e18009202033706002901019b8e0040023766006660326ea4dcc1b9948810122004bd7024500222533301a0021001132333004004301e0035333017300e371a00426e600044cdc500119b8a00537300026e64dd7180e0011b98491002232323300100137586010602c6ea8008894ccc060004528099299980a99191980080099198008009bab300d301b375400644a66603a002297ae01323332223233001001003225333023001100313233025374e6604a6ea4018cc094c088004cc094c08c0052f5c066006006604e004604a0026eb8c070004dd5980e800998018019810801180f80091299980e0008a50132533301932533301a3371e6eb8c080dd61810001805099198008009bac302130223022302230223022302230223022301e375401444a66604000229404c94ccc074cdc79bae302300200414a226600600600260460022940c94ccc068c044c070dd500089bae3020301d375400226eb8c080c074dd50009805980e1baa300b301c375400829444cc00c00c004c07c004c028c060dd5180d8010a51133003003001301b0013003301437540044602a002601e6ea8004c004c03cdd50031180918098008a4c2a660189211856616c696461746f722072657475726e65642066616c7365001365653333330120051533300a3001300c375400a2a66601c601a6ea8014526153300b00816153300b00816153300b00816153300b00816153300b00816153300b00816153300b49011d52756e6e696e672033206172672076616c696461746f72207370656e640013322322533300e53300f373264646660020026602a6ea4dcc1b9948810c4b657920506f6c6963794964003301537526e61241023a20003301537526e60dcca4410122003301537526e60c8dcc9919980080098051b8d002488100222533301433710004900008008991919199803003180780299b8b33700004a66602e66e200092014148180520ae013371666e000054ccc05ccdc4000a4028290300a415c0200866e18009202033706002901019b8e00400237666ea4030cc054dd49b98373291010122004bd702450022253330160021001132333004004301a0035333013300a371a00426e600044cdc500119b8a00537300026e64dd7180c0011b9849100132533300f3370e900118089baa3001301237540042646464660020026eb0c010c054dd500111299980b8008a50132533301432323300100132330010013756601260346ea800c894ccc07000452f5c0264666444646600200200644a6660440022006264660486e9ccc090dd4803198121810800998121811000a5eb80cc00c00cc098008c090004dd7180d8009bab301c001330030033020002301e00122533301b00114a0264a66603064a66603266e3cdd7180f9bac301f003015132330010013758604060426042604260426042604260426042603a6ea8028894ccc07c004528099299980e19b8f375c604400400829444cc00c00c004c08800452819299980c9808180d9baa0011375c603e60386ea80044dd7180f980e1baa0013009301b3754601260366ea8010528899801801800980f0009803180b9baa301a00214a22660060060026034002600260266ea800c8c05800454cc0412412c657870656374205370656e64285f293a20536372697074507572706f7365203d206374782e707572706f73650016230153016001149854cc03d2411856616c696461746f722072657475726e65642066616c7365001365653333330140011533300c3003300e37540022a666020601e6ea8004526153300d00a16153300d00a16153300d00a16153300d00a16153300d00a16153300d00a1653333330120051533300a3001300c375400a2a66601c601a6ea8014526153300b00916153300b00916153300b00916153300b00916153300b00916153300b009163010300d37540086e1d2000370090008a998048008b0a998048008b0a998048008b0a998048008b248191496e636f72726563742072656465656d6572207479706520666f722076616c696461746f72207370656e642e0a2020202020202020202020202020202020202020446f75626c6520636865636b20796f7520686176652077726170706564207468652072656465656d657220747970652061732073706563696669656420696e20796f757220706c757475732e6a736f6e00375c0029210f5f72656465656d65723a20566f69640049010c5f646174756d3a20566f6964005734ae7155ceaab9e5573eae815d0aba257481",
};

export default function App() {
  const [lucid, setLucid] = useState<Lucid>();
  const [wallets, setWallets] = useState<Wallet[]>();
  const [userAddress, setUserAddress] = useState<Address>(""); // Address = `addr_...`
  const [scriptAddress, setScriptAddress] = useState<Address>(""); // `${PaymentPart}${StakingPart}`
  const [stakeAddress, setStakeAddress] = useState<RewardAddress>(""); // RewardAddress = `stake_...`
  const [stakeAddressInfo, setStakeAddressInfo] = useState<Json>();
  const [stakePoolInfo, setStakePoolInfo] = useState<Json>();
  const [stakingValidator, setStakingValidator] = useState<Script>();
  const [spendingValidator, setSpendingValidator] = useState<SpendingValidator>();
  const [mintingValidator, setMintingValidator] = useState<MintingPolicy>();
  const [policyID, setPolicyID] = useState<PolicyId>();

  const [keyUnit, setKeyUnit] = useState<Unit>(); // Unit = `${PolicyID}${AssetName}`
  const [keyUTxO, setKeyUTxO] = useState<UTxO>();

  useEffect(() => {
    async function initLucid() {
      // Create `.env.local` file and set your Blockfrost URL and ProjectID
      const blockfrost = new Blockfrost(process.env.NEXT_PUBLIC_BF_URL!, process.env.NEXT_PUBLIC_BF_PID);
      const lucid = await Lucid.new(blockfrost, process.env.NEXT_PUBLIC_CARDANO_NETWORK as Network);
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

      //#region Staking part
      const stakingScript = applyParamsToScript(SmartContract.stake, [keyPolicy]);
      const stakingValidator: Script = {
        type: "PlutusV2",
        script: applyDoubleCborEncoding(stakingScript),
      };
      setStakingValidator(stakingValidator);

      const stakingHash = lucid.utils.validatorToScriptHash(stakingValidator);
      const stakingCredential = lucid.utils.scriptHashToCredential(stakingHash);
      const stakingAddress = lucid.utils.credentialToRewardAddress(stakingCredential);
      setStakeAddress(stakingAddress);
      //#endregion

      //#region Payment part
      const spendingScript = applyParamsToScript(SmartContract.spend, [keyPolicy]);
      const spendingValidator: SpendingValidator = {
        type: "PlutusV2",
        script: applyDoubleCborEncoding(spendingScript),
      };
      setSpendingValidator(spendingValidator);
      //#endregion

      const address = lucid.utils.validatorToAddress(spendingValidator, stakingCredential);
      setScriptAddress(address);
    });
  }, [userAddress]);

  useEffect(() => {
    if (!stakeAddress) return; // skip
    getStakeInfo(stakeAddress).then(setStakeAddressInfo).catch(console.log);
  }, [stakeAddress]);

  useEffect(() => {
    if (!stakeAddressInfo?.pool_id) return; // skip
    getPoolMetadata(stakeAddressInfo.pool_id).then(setStakePoolInfo).catch(console.log);
  }, [stakeAddressInfo]);

  async function findKeyInWallet(lucid: Lucid): Promise<[Unit, UTxO?]> {
    const utxos = await lucid.wallet.getUtxos();

    let asset = "";
    const keyUTxO = utxos.find((utxo) => {
      // find a UTxO with the key in its assets
      return Object.keys(utxo.assets).find((key) => {
        // find the asset by key name hex
        if (key.endsWith(KeyNameHex)) {
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
      <div className="flex gap-2 size-fit m-auto">
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
              [`${policyID}${KeyNameHex}`]: 1n, // BigInt(1)
            },
            Data.void()
          )
          .attachMetadata(
            721, // CIP-25
            {
              [policyID]: {
                [KeyName]: {
                  name: KeyName,
                  image: "ipfs://QmbEHFjoftYWAEEbMhU1BcR24fqpAVtFuZYNPZduUVZezL",
                },
              },
            }
          )
          .attachMintingPolicy(mintingValidator)
          .complete();
      },

      register: async () => {
        if (!stakeAddress) {
          throw "Invalid Stake Address";
        }

        return await lucid.newTx().registerStake(stakeAddress).complete();
      },

      deregister: async () => {
        if (!keyUTxO) {
          throw "Key Not Found";
        }

        if (!stakeAddress) {
          throw "Invalid Stake Address";
        }

        if (!stakingValidator) {
          throw "Uninitialized Staking Validator";
        }

        return await lucid
          .newTx()
          .readFrom([keyUTxO])
          .deregisterStake(stakeAddress, Data.void())
          .attachCertificateValidator(stakingValidator)
          .addSigner(userAddress)
          .complete();
      },

      delegate: async () => {
        if (!keyUTxO) {
          throw "Key Not Found";
        }

        if (!stakeAddress) {
          throw "Invalid Stake Address";
        }

        if (!stakingValidator) {
          throw "Uninitialized Staking Validator";
        }

        const pools = await getPoolList();
        if (!pools?.length) {
          throw "No Pool Available";
        }

        return await lucid
          .newTx()
          .readFrom([keyUTxO])
          .delegateTo(stakeAddress, pools[0], Data.void())
          .attachCertificateValidator(stakingValidator)
          .addSigner(userAddress)
          .complete();
      },

      ["withdraw stake reward"]: async () => {
        if (!keyUTxO) {
          throw "Key Not Found";
        }

        if (!stakeAddress) {
          throw "Invalid Stake Address";
        }

        if (!stakingValidator) {
          throw "Uninitialized Staking Validator";
        }

        const { rewards } = await lucid.provider.getDelegation(stakeAddress);
        if (!rewards) {
          throw "Nothing to Withdraw";
        }

        return await lucid
          .newTx()
          .readFrom([keyUTxO])
          .withdraw(stakeAddress, rewards, Data.void())
          .attachCertificateValidator(stakingValidator)
          .addSigner(userAddress)
          .complete();
      },
    };

    async function submitTx(tx: TxComplete) {
      const txSigned = await tx.sign().complete();
      const txHash = txSigned.submit();
      return txHash;
    }

    function ActionButton(props: { action: string; className: string }) {
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
          className={props.className}
        >
          {action}
        </Button>
      );
    }

    return (
      <div className="flex flex-col gap-2 w-fit mx-auto">
        <div className="flex flex-col">
          {userAddress && <span>{`User address: ${userAddress}`}</span>}
          {scriptAddress && <span>{`Script address: ${scriptAddress}`}</span>}
          {policyID && <span>{`Key Policy: ${policyID}`}</span>}
        </div>

        <hr />

        <div className="flex flex-col gap-2">
          {keyUnit == undefined && !scriptAddress && <span>Loading...</span>}

          {/* Mint */}
          {"" === keyUnit && <ActionButton action="mint" className="bg-gradient-to-tr from-red-500 to-yellow-500 text-white shadow-lg capitalize w-fit" />}

          {/* Deposit | Withdraw */}
          {scriptAddress && (
            <div className="flex gap-2">
              {["deposit", "withdraw"].map((action) => (
                <ActionButton key={action} action={action} className="bg-gradient-to-tr from-green-500 to-cyan-500 text-black shadow-lg capitalize w-fit" />
              ))}
            </div>
          )}

          <hr />

          {/* Stake Info */}
          {stakeAddress && stakeAddressInfo && (
            <div className="flex flex-col bg-gradient-to-tr from-blue-500 to-pink-500 text-white shadow-lg rounded-[20px] px-4 py-2.5 max-w-full">
              <span>{`${stakeAddress}:`}</span>
              <pre className="whitespace-break-spaces">{JSON.stringify(stakeAddressInfo, null, 4)}</pre>
            </div>
          )}

          {/* Register | Delegate | Withdraw Stake Reward | Deregister */}
          {stakeAddress && (
            <div className="flex gap-2">
              {["register", "delegate", "withdraw stake reward", "deregister"].map((action) => (
                <ActionButton key={action} action={action} className="bg-gradient-to-tr from-blue-500 to-pink-500 text-white shadow-lg capitalize w-fit" />
              ))}
            </div>
          )}

          {/* Pool Info */}
          {stakeAddressInfo?.pool_id && stakePoolInfo && (
            <div className="flex flex-col bg-gradient-to-tr from-blue-500 to-pink-500 text-white shadow-lg rounded-[20px] px-4 py-2.5 max-w-full">
              <span>{`${stakeAddressInfo?.pool_id}:`}</span>
              <pre className="whitespace-break-spaces">{JSON.stringify(stakePoolInfo, null, 4)}</pre>
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
        <div className="text-center w-full">NO CARDANO WALLET</div>
      )
    ) : (
      <div className="text-center w-full">BROWSING CARDANO WALLETS</div>
    )
  ) : (
    <div className="text-center w-full">INITIALIZING LUCID</div>
  );
}
