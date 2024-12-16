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

Since all transactions must go on chain and [Boltz](https://boltz.exchange) must earn something for the service they provide, there are fees to be paid:

- The minimum cost for sending a payment is around 200 sats;
- The average cost for sending **or receiving** a payment is around 400 sats plus 0.1% of the amount;
- Transactions between Helm wallets don’t pay Boltz fees but can take up to 1 minute to complete;
- Amounts are limited between 1.000 and 25.000.000 sats.

## Availability

To minimize censorship, this app is available in different urls. You can restore your 12 words mnemonic on any of this websites and you will get your coins and transaction list:

- [https://helm-wallet.pages.dev](https://helm-wallet.pages.dev)
- [https://bordalix.gitlab.io/helm-wallet/](https://bordalix.gitlab.io/helm-wallet/)

You can also clone the code and run it on your own machine, is as easy as:

```
$ git clone bordalix/helm-wallet
$ cd helm-wallet
$ yarn
$ yarn start
```

To minimize censorship, the code is available from several sources:

- [https://github.com/bordalix/helm-wallet](https://github.com/bordalix/helm-wallet)
- [https://gitlab.com/bordalix/helm-wallet](https://gitlab.com/bordalix/helm-wallet)
- [https://bitbucket.org/bordalix/helm-wallet](https://bitbucket.org/bordalix/helm-wallet)

As soon as the code is stable, I'll also put it on bittorrent and ipfs.

## Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

⚠️ You need yarn v1, for some reason it doesn't work with yarn v2 (under investigation) ⚠️

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
