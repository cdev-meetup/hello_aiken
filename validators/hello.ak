use aiken/dict
use aiken/list.{any}
use aiken/transaction.{
  Mint, OutputReference, Publish, ScriptContext, ScriptPurpose, Spend,
  WithdrawFrom,
}
use aiken/transaction/value.{PolicyId, from_minted_value, tokens}
use hello_aiken/util.{must_show_key}
use string_util/cbor.{print}

validator(utxo: OutputReference) {
  fn mint(_redeemer: Void, context ctx: ScriptContext) -> Bool {
    expect Mint(policy_id): ScriptPurpose = ctx.purpose
    trace print("Key PolicyId", policy_id)

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

validator(key_policy: PolicyId) {
  fn spend(_datum: Void, _redeemer: Void, context ctx: ScriptContext) -> Bool {
    trace print("Key PolicyId", key_policy)

    expect Spend(_): ScriptPurpose = ctx.purpose

    ctx |> must_show_key(key_policy)
  }

  fn stake(_redeemer: Void, context ctx: ScriptContext) -> Bool {
    when ctx.purpose is {
      Publish(_) -> {
        trace print("Key PolicyId", key_policy)
        ctx |> must_show_key(key_policy)
      }

      WithdrawFrom(credential) -> {
        trace print("Credential", credential)
        ctx |> must_show_key(key_policy)
      }

      _ -> False
    }
  }
}
