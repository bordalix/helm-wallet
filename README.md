# Helm wallet

The lightning wallet even your grandma can use.

## Goals

- [x] To make a self-custodial wallet where one can send and receive Lightning payments without the hustle of liquidity or channels management;
- [x] To make a very clear and simple UX (2 options top per screen) without compromising functionalities;
- [x] To make a web based Lightning wallet to escape App Stores censorship.

## Design

- It's a Liquid wallet that uses [Boltz](https://boltz.exchange) to disguise itself as a Lightning wallet that even your grandma can use;
- On the UI side, I do love brutalism.

## Drawbacks

Since all transactions must go on the Liquid chain and [Boltz](https://boltz.exchange) must earn something for the service they provide, there are fees to be paid:

- The minimum cost for sending a payment is around 200 sats;
- The average cost for sending **or receiving** a payment is around 400 sats plus 0.1% of the amount;
- Transactions between Helm wallets don’t pay Boltz fees but can take up to 1 minute to complete;
- Boltz swaps are limited between 1.000 and 25.000.000 sats.

## Main advantages

It's a [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps), which means it is
immune to app store censorship. The web app is completely independent, no server required. You can clone it, build it and run it from your own computer. Everything runs on the browser.

You can use [Tor](https://www.torproject.org) to hide your IP address from Boltz and the chain explorers.

## Availability

To minimize censorship, this app is available in different urls. You can restore your 12 words mnemonic on any of this websites and you will get your coins and transaction list:

- [https://helm-wallet.pages.dev](https://helm-wallet.pages.dev)
- [https://bordalix.gitlab.io/helm-wallet/](https://bordalix.gitlab.io/helm-wallet/)

You can also clone the code and run it on your own machine, is as easy as:

```
$ git clone bordalix/helm-wallet
$ cd helm-wallet
$ pnpm install
$ pnpm start
```

If you prefer Docker:

```
$ git clone bordalix/helm-wallet
$ cd helm-wallet
$ docker build -t helm-wallet .
$ docker run -p 8370:8370 helm-wallet
```

The app will be running on http://localhost:8370

To minimize censorship, the code is available from several sources:

- [https://github.com/bordalix/helm-wallet](https://github.com/bordalix/helm-wallet)
- [https://gitlab.com/bordalix/helm-wallet](https://gitlab.com/bordalix/helm-wallet)
- [https://bitbucket.org/bordalix/helm-wallet](https://bitbucket.org/bordalix/helm-wallet)

As soon as the code is stable, I'll also put it on bittorrent and ipfs.

## Development

This project uses [Vite](https://vite.dev/) and [pnpm](https://pnpm.io/).

`pnpm install`

The first time, to install all dependencies.

`pnpm start`

To run the app in development mode.

Open [http://localhost:8370](http://localhost:8370) to view it in the browser.

The page will reload if you make edits.

`pnpm lint`

To check of any lint errors.

`pnpm test`

Launches the test runner in the interactive watch mode.

`pnpm build`

Builds the app for production into the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

Check the [FAQ](https://helm-wallet.com/#faq).
