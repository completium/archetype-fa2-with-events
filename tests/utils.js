const {
  getValueFromBigMap,
  exprMichelineToJson,
  packTyped,
  blake2b,
  sign,
  isMockup,
  jsonMichelineToExpr,
  runGetter,
} = require('@completium/completium-cli');

const transferParamType = exprMichelineToJson(
  '(list (pair (address %from_) (list %txs (pair (address %to_) (nat %token_id) (nat %amount)))))'
);

const singleStepTransferParamType = exprMichelineToJson("(list (pair (address %from_) (list %txs (pair (address %to_) (nat %token_id) (nat %amount)))))");


const permitDataType = exprMichelineToJson(
  '(pair (pair address chain_id) (pair nat bytes))'
);

const gaslessDataType = exprMichelineToJson(
  '(pair address (pair nat bytes))'
);

const gethashPermit = async (
  from,
  to,
  contract,
  amount,
  tokenid,
  permit_counter
) => {
  const michelsonData = `{ Pair "${from.pkh}" { Pair "${to.pkh}" (Pair ${tokenid} ${amount}) } }`;
  const transferParam = exprMichelineToJson(michelsonData);
  const permit = packTyped(transferParam, transferParamType);
  const hashPermit = blake2b(permit);
  return hashPermit
}

const signHashPermit = async (
  hashPermit,
  contract,
  permit_counter
) => {
  const chainid = isMockup()
    ? 'NetXynUjJNZm7wi'
    : 'NetXZSsxBpMQeAT'; // else hangzhou
  const permitData = exprMichelineToJson(
    `(Pair (Pair "${contract}" "${chainid}") (Pair ${permit_counter} 0x${hashPermit}))`
  );
  const tosign = packTyped(permitData, permitDataType);
  return { hashPermit, tosign };
}

const gettosign = async (
  from,
  to,
  contract,
  amount,
  tokenid,
  permit_counter
) => {
  const hashPermit = await gethashPermit(from, to, contract, amount, tokenid, permit_counter);
  return signHashPermit(hashPermit, contract, permit_counter)
}

exports.getTransferPermitData = gettosign
exports.getSignHashPermit = signHashPermit

exports.mkTransferPermit = async (
  from,
  to,
  contract,
  amount,
  tokenid,
  permit_counter
) => {
  const { hashPermit, tosign } = await gettosign(from, to, contract, amount, tokenid, permit_counter);
  const signature = await sign(tosign, { as: from.name });
  return { hash: hashPermit, sig: signature };
};

exports.mkTransferGaslessArgs = async (
  from,
  to,
  contract,
  amount,
  tokenid,
  permit_counter,
  signer
) => {
  const michelsonData = `{ Pair "${from.pkh}" { Pair "${to.pkh}" (Pair ${tokenid} ${amount}) } }`;
  const transferParam = exprMichelineToJson(michelsonData);
  const permit = packTyped(transferParam, singleStepTransferParamType);
  const hashPermit = blake2b(permit);
  const permitData = exprMichelineToJson(
    `(Pair "${contract}" (Pair ${permit_counter} 0x${hashPermit}))`
  );
  const tosign = packTyped(permitData, gaslessDataType);
  const signature = await sign(tosign, { as: signer });
  return { hash: hashPermit, sig: signature, tosign: tosign };
};


const getCounter = async (c, k) => {
  const storage = await c.getStorage();
  const id = storage.counter;
  const key = exprMichelineToJson(`"${k}"`);
  const keytyp = exprMichelineToJson('address');
  const res = await getValueFromBigMap(id, key, keytyp);
  if (res == null) {
    return 0;
  }
  const data = jsonMichelineToExpr(res);
  return parseInt(data);
}

const packDataToSign = async (ccounter, ccollection, cseller, owner, user, tokenId) => {
  const michelsonDataType = exprMichelineToJson('(pair address (pair nat address))');
  const michelsonData = `(Pair "${ccollection.address}" (Pair ${tokenId} "${user.pkh}"))`;
  const transferParam = exprMichelineToJson(michelsonData);
  const permit = packTyped(transferParam, michelsonDataType);
  const hashPermit = blake2b(permit);

  const counter = await getCounter(ccounter, user.pkh);
  const chainid = isMockup() ? 'NetXynUjJNZm7wi' : 'NetXZSsxBpMQeAT'; // else hangzhou

  const permitDataType = exprMichelineToJson('(pair (pair address chain_id) (pair nat bytes))');
  const permitData = exprMichelineToJson(`(Pair (Pair "${cseller.address}" "${chainid}") (Pair ${counter} 0x${hashPermit}))`);
  const tosign = packTyped(permitData, permitDataType);

  return tosign;
}

exports.getPackDataToSign = packDataToSign

exports.getBuySignature = async (ccounter, ccollection, cseller, owner, user, tokenId) => {
  const tosign = await packDataToSign(ccounter, ccollection, cseller, owner, user, tokenId)
  const signature = await sign(tosign, { as: owner.name });

  return signature.prefixSig
}

exports.getLazyMintSignature = async (ccollection, owner, user, tokenId) => {
  const dataType = exprMichelineToJson('(pair address (pair nat (pair address (pair (map string bytes) (list (pair address nat))))))');
  const data = exprMichelineToJson(`(Pair "${ccollection.address}" (Pair ${tokenId} (Pair "${user.pkh}" (Pair {} {}))))`);

  const tosign = packTyped(data, dataType);
  const signature = await sign(tosign, { as: owner.name });

  return signature.prefixSig
}


exports.getCounter = async (c, pkh) => {
  const storage = await c.getStorage();

  const a = await getValueFromBigMap(
    parseInt(storage.permits),
    exprMichelineToJson(`"${pkh}"`),
    exprMichelineToJson(`address`)
  );

  return a
}

/**
 * Returns pkh's quota
 * @param {counter contract completium object} c
 * @param {user address} pkh
 */
exports.getQuota = async (c, pkh) => {
  const quota = await runGetter("get_counter", c.address, { argMichelson: `"${pkh}"`, as: pkh });
  return Number.parseInt(quota)
}

exports.getTokenOwner = async (c, token) => {
  let storage = await c.getStorage();
  let id = storage.ledger;
  let key = { int: "" + token };
  let keytyp = { prim: "nat" };
  let res = await getValueFromBigMap(id, key, keytyp);
  return (res == null ? null : res.string);
}

exports.checkEqualEpsilon = (value, target, epsilon) => Math.abs(value - target) < epsilon;

exports.toHex = (s) => s.split("").map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
exports.fromHex = (h) => h.split(/(\w\w)/g).filter(p => !!p).map(c => String.fromCharCode(parseInt(c, 16))).join("")

exports.errors = {
  CALLER_NOT_OWNER: '"CALLER_NOT_OWNER"',
  CONTRACT_NOT_PAUSED: '"CONTRACT_NOT_PAUSED"',
  CONTRACT_PAUSED: '"CONTRACT_PAUSED"',
  EXPIRY_TOO_BIG: '"EXPIRY_TOO_BIG"',
  FA2_INSUFFICIENT_BALANCE: '"FA2_INSUFFICIENT_BALANCE"',
  FA2_INVALID_AMOUNT: '"FA2_INVALID_AMOUNT"',
  FA2_NOT_OPERATOR: '"FA2_NOT_OPERATOR"',
  INVALID_AMOUNT: '"INVALID_AMOUNT"',
  INVALID_CALLER: '"InvalidCaller"',
  KEY_EXISTS: '(Pair "KeyExists" "ledger")',
  LEDGER_NOT_FOUND: '(Pair "AssetNotFound" "ledger")',
  MISSIGNED: '(Pair "MISSIGNED"',
  NO_ENTRY_FOR_USER: '"NO_ENTRY_FOR_USER"',
  NOT_FOUND: '"NotFound"',
  OVER_QUOTA: '"OVER_QUOTA"',
  PERMIT_EXPIRED: '"PERMIT_EXPIRED"',
  PERMIT_NOT_FOUND: '"PERMIT_NOT_FOUND"',
  PERMIT_USER_NOT_FOUND: '"PERMIT_USER_NOT_FOUND"',
  SIGNER_NOT_FROM: '"SIGNER_NOT_FROM"',
  TOKEN_METADATA_KEY_EXISTS: '(Pair "KeyExists" "token_metadata")',
  TOKEN_NOT_FOUND: '"FA2_TOKEN_UNDEFINED"',
  FIAT_MANAGER_KEY_EXISTS: '(Pair "KeyExists" "fiat_manager")',
  CANNOT_BUY_TOKEN: '"CANNOT_BUY_TOKEN"'
};
