{
  description = "A Nix flake for SafeHaven dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    nixpkgs,
    flake-utils,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {inherit system;};

        # NodeJS environment
        fixedNode = pkgs.nodejs_24;

        checkProject = pkgs.writeShellScriptBin "check_project" ''
          set -e

          pushd backend
            echo "::group::sqlx migrations checks"
              echo "Create the database"
              cargo sqlx database create

              echo "Run the migrations"
              cargo sqlx migrate run

              echo "Check the migrations"
              cargo sqlx prepare --check
            echo "::endgroup::"

            echo "::group::Backend tests"
              cargo test
            echo "::endgroup::"

            echo "::group::Backend lint"
              cargo fmt -- --check
              cargo clippy -- -D warnings
            echo "::endgroup::"

            echo "::group::OpenAPI sync checks"
              cargo run -- openapi ../frontend/calc-openapi.json
              if ! diff ../frontend/calc-openapi.json ../frontend/openapi.json; then
                echo "OpenAPI has changed, please run 'cargo run -- openapi ../frontend/openapi.json' in the frontend"
                exit 1
              fi
              rm ../frontend/calc-openapi.json
            echo "::endgroup::"
          popd

          pushd frontend
            echo "::group::Frontend checks"
              npm ci
              npm run generate-api
              npm run lint
            echo "::endgroup::"
          popd
        '';

        regenApi = pkgs.writeShellScriptBin "regen_api" ''
          set -e

          pushd backend
            cargo run -- openapi ../frontend/openapi.json
          popd

          pushd frontend
            npm run generate-api
          popd
        '';

        processConfigFile = let
          processes = {
            backend = {
              command = "cargo run -- serve";
              working_dir = "./backend";
            };
            frontend = {
              command = "npm run dev";
              working_dir = "./frontend";
            };
          };
        in
          pkgs.writeText "process.yaml" (builtins.toJSON {
            version = "0.5";
            processes = processes;
          });

        startDevEnv = pkgs.writeShellScriptBin "start_dev_env" ''
          set -e
          ${pkgs.process-compose}/bin/process-compose -f ${processConfigFile}
        '';
      in
        with pkgs; {
          packages = {inherit backend frontend dockerImage;};
          devShells.default = mkShell {
            buildInputs = [
              # Rust toolchain
              rustc
              cargo
              rustfmt
              clippy
              # Various scripts
              checkProject
              regenApi
              startDevEnv
              # Backend
              sqlx-cli
              # Frontend
              fixedNode
              # Nix formatting
              alejandra
              # Process composing
              process-compose
              # PostgreSQL and PostGIS
              (postgresql_16.withPackages (p: with p; [postgis])).out
            ];
            DATABASE_URL = "postgres://postgres:postgres@localhost:5432/safehaven";
          };
        }
    );
}
