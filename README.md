<p align="center"><img src=".github/assets/banner.webp" alt="SafeHaven Banner"/></p>

An open-source project to create a map of safe spaces for people in need.

## Deploy

We provide docker images that are ready to deploy SafeHaven. You can find the releases in the
[packages view of the SafeHavenMaps organisation](https://github.com/SafeHavenMaps/safehaven/pkgs/container/safehaven).

### Pre-requisites

- A PostgreSQL server with PostGIS

### Prepare the database

Create a database:

```sql
CREATE DATABASE safehaven;
```

SafeHaven leverages PostgreSQL's full text search capabilities. You can help the indexer by setting a locale on the database:

```sql
ALTER DATABASE safehaven SET default_text_search_config = 'pg_catalog.french';
```

## Configure

SafeHaven is initialized with a default user named `admin` with a random password, which can be retrieved from backend logs.
The administration panel will provide you with the ability to create new users and manage the application.

To learn more about the configuration, you can visit [our documentation website](https://docs.safehavenmaps.org).

### Start the docker container:

```bash
docker run -d \
  -e SH__DATABASE__URL="postgresql://user:password@host/safehaven" \  # Set the database path
  -e SH__DATABASE__POOL_SIZE="5" \                                    # Set the number of connections to the database
  -e SH__SECURE_COOKIE="true" \                                       # Activate if you have a reverse proxy with HTTPS.
  -e SH__TOKEN_SECRET="SecretForValidatingAngSigningTokens" \         # Set a secret that will be used to sign sessions
  ghcr.io/safehavenmaps/safehaven:1.0.0                               # Change latest to the latest version, check the releases
```

## Contributing

We welcome contributions from everyone.

To spin up a development environment, follow these steps:

### Pre-requisites

1. A PostgreSQL 16 server with the PostGIS extension
2. Node 24 and npm
3. A Rust toolchain with Cargo

A PostgreSQL server (1.) can be started using Docker Compose.

Node, npm (2.) and a Rust toolchain (3.) can be installed using the Nix flake *(option B)*.

### Steps without using Nix *(option A)*

- Clone the repository
- Run `npm ci` to install the Node dependencies
- Run `docker compose up -d` to start a PostgreSQL server
- Run `npm run dev` to start the development processes

### Steps using Nix *(option B)*

- Clone the repository
- Run `nix develop` to enter the development environment
- Run `npm ci` to install the Node dependencies
- Run `docker compose up -d` to start a PostgreSQL server
- To start the development processes, either:
  - run `start_dev_env` to use [process-compose](https://github.com/F1bonacc1/process-compose)
  - run `npm run dev` to use [npm-run-all2](https://github.com/bcomnes/npm-run-all2)

### The admin panel

The admin panel should now be available at http://localhost:3000/admin.

If no admin user exists in the database, the backend creates one and displays its password in the logs.

You may use the admin panel to create an access token, which you can then use to access:

- The map view at `http://localhost:3000/map/<token>`
- The search view at `http://localhost:3000/search/<token>`
- The add view at `http://localhost:3000/add/<token>`

### Regenerating the API specification and client

If you use the Nix flake, you can run `regen_api`.

Otherwise, follow these steps:

- In the `backend` directory, run `cargo run -- openapi ../frontend/openapi.json`
- In the `frontend` directory, run `npm run generate-api`

## License

Licensed under the GNU General Public License v3.0, see [LICENSE](LICENSE).
