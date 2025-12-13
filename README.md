# Merchtopia Backend

Merchtopia is a product management application that allows for admin to create, read, update and delete product descriptions,
update stock, and for end users to buy product.

## Description

## Prerequisites

- Node.js: >=v24.3.0
- Docker: >=29.1.3

## Project setup

```bash
# Start PostgreSQL database
$ ./scripts/setup-db.sh

# Install dependencies
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Schema Changes and Migration

MikroORM is used to manage the entity models, as well as to handle database operations, including connecting and migrations.
We check in these generated migrations to keep a lineage of database changes as well as to keep developers in sync.
In order to make changes to the schema and db:

- Create or edit the entity in src/entities
- Run `npx mikro-orm migration:create` to generate the migration
- Look through the migration generated. This is not always perfect on the first go. Add in a `down` method for rollback
- Run `npx mikro-orm migration:up` to execute the changes to the database

```bash
# To generate migration
$ npx mikro-orm migration:create

# To run migration
$ npx mikro-orm migration:up
```
