# TOKEN SHOGUN

## Repository Structure

> [!IMPORTANT]
> This repository contains three .kiro directories.
> - [`.kiro`](.kiro)
> - [`apps/game/.kiro`](apps/game/.kiro)
> - [`apps/platform/.kiro`](apps/platform/.kiro)

## How To Play

1. Clone this repository.
```shell
git clone git@github.com:h-persimmon/kiro-sample-004.git
```
```shell
cd kiro-sample-004
```

2. Install the packages.
```shell
pnpm install
```

3. Create a `.env` file and add your Bedrock API keys.
```shell
cp apps/platform/.env.sample apps/platform/.env
```
```shell
kiro apps/platform/.env # add your Bedrock API keys
```

4. Start the app.
```shell
pnpm dev
```

5. Access `localhost:3000` and enjoy TOKEN SHOGUN!!
