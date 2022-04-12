const { deploy, setEndpoint, getAccount, setQuiet, getContract } = require('@completium/completium-cli');
const fs = require('fs');

// contracts
let fa2;

const stage = 'mockup'
const prefix = ''

const getName = name => stage + '_' + prefix + '_' + name

const env = {
  stages: {
    mockup: {
      quiet: true,
      endpoint: 'mockup',
      originator_alias: 'alice',
      owner: 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb',
      metadata: {
        fa2: undefined,
        counter: undefined,
        seller: undefined,
      }
    },
    testnet: {
      quiet: false,
      endpoint: 'https://ithacanet.ecadinfra.com',
      originator_alias: '',
      owner: '',
      metadata: {
        fa2: undefined,
        counter: undefined,
        seller: undefined,
      }
    },
    mainnet: {
      quiet: false,
      endpoint: 'https://mainnet.api.tez.ie',
      originator_alias: '',
      owner: '',
      metadata: {
        fa2: undefined,
        counter: undefined,
        seller: undefined,
      }
    }
  },
  contracts: {
    fa2: {
      id: 'fa2-events',
      path: './contracts/fa2.arl'
    },
  }
}

const objstage = env.stages[stage];
const originator_alias = objstage.originator_alias
const owner = objstage.owner

const originator = getAccount(originator_alias)

setEndpoint(objstage.endpoint);
setQuiet(objstage.quiet);

// describe("Fetch", async () => {

//   it("FA2", async () => {
//     fa2 = await getContract(getName(env.contracts.fa2.id))
//   });

// });

describe("Deploy", async () => {

  it("FA2", async () => {
    [fa2, _] = await deploy(env.contracts.fa2.path, {
      parameters: {
        owner: owner,
      },
      metadata_uri: objstage.metadata.fa2,
      named: getName(env.contracts.fa2.id),
      as: originator.pkh
    });
  });

});
