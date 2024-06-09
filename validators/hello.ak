use aiken/list.{has}
use aiken/transaction.{ScriptContext, ScriptPurpose, Spend}
use hello_aiken/alias.{PubKeyHash}
use string_util/cbor.{print}

validator(pkh: PubKeyHash) {
  fn spend(_datum: Void, _redeemer: Void, context ctx: ScriptContext) -> Bool {
    let txn = ctx.transaction

    expect Spend(_): ScriptPurpose = ctx.purpose

    trace print("extra_signatories", txn.extra_signatories)
    txn.extra_signatories |> has(pkh)
  }
}
