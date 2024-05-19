use aiken/hash.{Hash, Blake2b_224}
use aiken/transaction/credential.{VerificationKey}

pub type PubKeyHash = Hash<Blake2b_224, VerificationKey>
