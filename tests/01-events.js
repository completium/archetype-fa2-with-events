const {
  deploy,
  getAccount,
  setQuiet,
  setEndpoint
} = require('@completium/completium-cli');

require('mocha/package.json');

const mockup_mode = false;

// contracts
let fa2;

// accounts
const owner = getAccount(mockup_mode ? 'alice' : 'fa2-events-owner');
const user  = getAccount(mockup_mode ? 'bob'   : 'fa2-events-user');

setQuiet(mockup_mode);

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
          },
          as: owner.pkh,
      });
  });
});

describe('Transfering', async () => {
  it('Transfer', async () => {
      await fa2.transfer({
          arg: {
              txs: [[owner.pkh, [[user.pkh, tokenId, 100]]], [owner.pkh, [[user.pkh, tokenId, 200]]]],
          },
          as: owner.pkh,
      });
  });
});


describe('Burning', async () => {
  it('Burn', async () => {
      await fa2.burn({
          arg: {
              itokenid: tokenId,
              iamount: 300,
          },
          as: owner.pkh,
      });
  });
});
