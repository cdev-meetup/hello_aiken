use aiken/dict
use aiken/list.{any}
use aiken/transaction.{
  Mint, OutputReference, ScriptContext, ScriptPurpose, Spend,
}
use aiken/transaction/value.{PolicyId, from_minted_value, tokens}
use hello_aiken/util.{must_show_key}
use string_util/cbor.{print}

validator(key_policy: PolicyId) {
  fn spend(_datum: Void, _redeemer: Void, context ctx: ScriptContext) -> Bool {
    trace print("PolicyId", key_policy)

    expect Spend(_): ScriptPurpose = ctx.purpose

    ctx |> must_show_key(key_policy)
  }
}

validator(utxo: OutputReference) {
  fn mint(_redeemer: Void, context ctx: ScriptContext) -> Bool {
    trace print("UTxO", utxo)

    expect Mint(policy_id): ScriptPurpose = ctx.purpose

    let txn = ctx.transaction

    expect True: Bool =
      txn.inputs
        |> any(fn(input) { input.output_reference == utxo })

    expect [Pair(_, 1)] =
      txn.mint
        |> from_minted_value()
        |> tokens(policy_id)
        |> dict.to_pairs()

    True
  }
}
