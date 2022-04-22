# archetype-fa2-with-events

## Install

If not already installed, install [completium-cli](https://completium.com/docs/cli/) with:
```bash
npm i -g @completium/completium-cli
```

then, init completium with:
```bash
completium-cli init
```

then, init local project:
```bash
npm i
```

## Import test accounts in completium

In order to import `owner` and `user` accounts from Ithaca (testnet) faucets:
```bash
npm run import
```

## Deploy, run mint and transfer example

To deploy the FA2, call `mint` and `transfer` entrypoints, run the following:
```bash
npm run process
```

See [scritps](./scripts) folder for more information.

