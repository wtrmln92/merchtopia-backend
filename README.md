# Merchtopia Backend

Merchtopia is a product management application that allows for admin to create, read, update and delete product descriptions, update stock, and for end users to buy product.

## Description

This is the backend providing the business logic and persistence as well as authentication. The main stack consists of:

- nestjs
- mikroorm
- postgresql
- typescript
- swagger
- passport

The dev database is hosted using a docker container and is accessed as entities through MikroOrm. We use session based auth for the admin functions and users are persisted on the database with their passwords hashed.

## Project Organisation

The project is split into 3 main repositories. The first one being this which is the backend, an admin UI, and a shop UI for public use.

The backend represents the business logic and is split up into modules:

- product: processes product information including price, description, title, sku, and flags to control if it is on sale
- shop: provides access to catalog of items on sale, and product information
- auth: provides authentication services to log the user in and out, as well as to persist session login
- stock: handles StockTransactions, which represent restocking and reduction of stock either via sales or damage. This provides the system with counts of remaining stock

Users on the admin UI need to be authenticated. Users are added through a script `pnpm run create-user <user-email>` described in further detail below. The admin UI allows for management of product entries as well as stock.

Users of the shop are all treated as guests without login. They only see products that are on sale, and can only add to cart and purchase items that are still in stock

## Schema and entities

### User

- uuid (primary key)
- email
- passwordHash
- timestamps

### Product

- uuid (primary key)
- sku
- displayName
- description
- price
- isOnSale
- timestamps
- deletedAt

### StockTransaction

- uuid (primary key)
- product (foreign key to Product)
- quantity
- type
- referenceId
- notes
- createdAt

### Order

- uuid (primary key)
- customerName
- customerEmail
- status
- items (to many OrderItems)
- timestamps
- deletedAt

### OrderItem

- uuid (primary key)
- order (foreign key to Order)
- product (foreign key to Product)
- quantity
- unitPrice
- createdAt

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

## Add users:

To add users you either need to log in or for the first user, run a script

```bash
$ pnpm run create-user <user-email>

# Enter password when prompted
Password:
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
