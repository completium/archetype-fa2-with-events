const {
  deploy,
  getAccount,
  getValueFromBigMap,
  setQuiet,
  expectToThrow,
  exprMichelineToJson,
  setMockupNow,
  getEndpoint,
  isMockup,
  setEndpoint
} = require('@completium/completium-cli');
const { errors, mkTransferPermit, mkTransferGaslessArgs } = require('./utils');
const assert = require('assert');

require('mocha/package.json');

setQuiet('true');

const mockup_mode = true;

// contracts
let fa2;

// accounts
const owner  = getAccount(mockup_mode ? 'alice'      : 'fa2-events-owner');
const user   = getAccount(mockup_mode ? 'bob'        : 'fa2-events-user');

//set endpointhead
setEndpoint(mockup_mode ? 'mockup' : 'https://ithacanet.ecadinfra.com');

const amount = 1000;
let tokenId = 0;

describe('Contract deployment', async () => {
  it('FA2 contract deployment should succeed', async () => {
      [fa2, _] = await deploy(
          './contracts/fa2.arl',
          {
              parameters: {
                  owner: owner.pkh,
              },
              as: owner.pkh,
          }
      );
  });
});

describe('Minting', async () => {
  it('Mint', async () => {
      await fa2.mint({
          arg: {
              itokenid: tokenId,
              iowner: owner.pkh,
              iamount: amount,
              itokenMetadata: null
          },
          as: owner.pkh,
      });
  });
});

describe('Transfering', async () => {
  it('Transfer', async () => {
      await fa2.transfer({
          arg: {
              txs: [[owner.pkh, [[user.pkh, tokenId, 100]]]],
          },
          as: owner.pkh,
      });
  });
});
