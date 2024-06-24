use aiken/list.{any, has}
use aiken/transaction.{ScriptContext}
use aiken/transaction/credential.{
  Credential, ScriptCredential, VerificationKeyCredential,
}
use aiken/transaction/value.{PolicyId, flatten}

pub fn unwrap_credential(credential: Credential) -> ByteArray {
  when credential is {
    VerificationKeyCredential(pkh) -> pkh
    ScriptCredential(validator_hash) -> validator_hash
  }
}

pub fn must_show_key(context ctx: ScriptContext, key_policy: PolicyId) -> Bool {
  let txn = ctx.transaction

  let input <- any(txn.reference_inputs)
  let output = input.output

  let asset <- any(flatten(output.value))
  let (policy_id, _, _) = asset

  let pkh = output.address.payment_credential |> unwrap_credential

  // return:
  and {
    policy_id == key_policy,
    txn.extra_signatories |> has(pkh),
  }
}
