async function req(path: string) {
  const rsp = await fetch(
    `${process.env.NEXT_PUBLIC_BF_URL}${path}`, // https://cardano-preview.blockfrost.io/api/v0
    {
      headers: { project_id: process.env.NEXT_PUBLIC_BF_PID! }, // Blockfrost ProjectID
    }
  );
  return await rsp.json();
}

export const getStakeInfo = (stakeAddress: string) => req(`/accounts/${stakeAddress}`);
export const getPoolList = () => req(`/pools`);
export const getPoolMetadata = (poolID: string) => req(`/pools/${poolID}/metadata`);
