import { defineNuxtModule } from 'nuxt/kit'
import fs from 'node:fs'

const OUTPUT_FOLDER = '.output/server'
const MIGRATIONS_SOURCE_FOLDER = 'migrations'
const MIGRATIONS_DEST_FOLDER = `${OUTPUT_FOLDER}/migrations`

export default defineNuxtModule({
  setup(options, nuxt) {
    nuxt.hook('nitro:build:public-assets', copyMigrationsOnBuild)
  },
})

function copyMigrationsOnBuild() {
  console.info(`Copying migrations to folder ${MIGRATIONS_DEST_FOLDER}`)

  if (!fs.existsSync(OUTPUT_FOLDER)) throw 'Output folder does not exist, aborting'
  if (!fs.existsSync(MIGRATIONS_SOURCE_FOLDER)) throw 'Migrations folder does not exist, aborting'

  if (fs.existsSync(MIGRATIONS_DEST_FOLDER)) {
    console.warn('Migrations output folder already exists, it will be erased')
    fs.rmSync(MIGRATIONS_DEST_FOLDER, { recursive: true, force: true })
    if (fs.existsSync(MIGRATIONS_DEST_FOLDER)) throw 'Could not erase existing migrations output folder, aborting'
  }

  fs.cpSync(MIGRATIONS_SOURCE_FOLDER, MIGRATIONS_DEST_FOLDER, { recursive: true, preserveTimestamps: true })
  if (!fs.existsSync(MIGRATIONS_DEST_FOLDER)) throw 'Failed copying the migrations folder, aborting'

  console.info(`Done copying migrations`)
}
