use aiken/list.{has}
use aiken/transaction.{ScriptContext}
use hello_aiken/alias.{PubKeyHash}
use string_util/cbor.{print}

validator(pkh: PubKeyHash) {
  fn spend(_datum: Data, _redeemer: Data, context ctx: ScriptContext) -> Bool {
    let txn = ctx.transaction

    trace print("extra_signatories", txn.extra_signatories)
    txn.extra_signatories |> has(pkh)
  }
}
