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

  txn.reference_inputs
    |> any(
        fn(input) {
          let output = input.output

          output.value
            |> flatten()
            |> any(
                fn(asset) {
                  let (policy_id, _, _) = asset

                  policy_id == key_policy && (
                    txn.extra_signatories
                      |> has(
                          output.address.payment_credential
                            |> unwrap_credential,
                        )
                  )
                },
              )
        },
      )
}
