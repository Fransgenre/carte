import { config } from './src/config.ts'
import { initDb, getPgp, getDb, checkConnection, type IDbLike, type IPgp } from './src/db.ts'
import { validateAccessTokens, validateCategories, validatePublicListedEntities, validatePublicEntities, validateAdminListedEntities, validateAdminEntities, validateViewerCachedEntities, validateAdminCachedEntities, validatePublicComments, validateAdminComments, validateAdminListedComments, validateFamilies, validateIcons, validateOptions, validateTags, validateUsers } from './src/validation/index.ts'

initDb(config)
const pgp = getPgp()
const db = getDb()
console.info('= Initialized database pool')

await ensureDatabaseConnectable(db)

try {
  await performValidations(db)
}
finally {
  closeDatabasePool(pgp)
}

async function ensureDatabaseConnectable(db: IDbLike) {
  if (!await checkConnection(db)) throw 'Could not connect to the database using the provided connection string'
  console.info('= Database connection established')
}

function closeDatabasePool(pgp: IPgp) {
  try {
    pgp.end()
  }
  finally {
    console.info('= Closed database pool')
  }
}

async function performValidations(db: IDbLike) {
  console.info('= Performing validations')

  console.info('== Validating access tokens')
  await validateAccessTokens(db)

  console.info('== Validating categories')
  await validateCategories(db)

  console.info('== Validating comments')
  await validatePublicComments(db)
  await validateAdminComments(db)
  await validateAdminListedComments(db)

  console.info('== Validating entities')
  await validatePublicListedEntities(db)
  await validatePublicEntities(db)
  await validateAdminListedEntities(db)
  await validateAdminEntities(db)

  console.info('== Validating cached entities')
  await validateViewerCachedEntities(db)
  await validateAdminCachedEntities(db)

  console.info('== Validating families')
  await validateFamilies(db)

  console.info('== Validating icons')
  await validateIcons(db)

  console.info('== Validating options')
  await validateOptions(db)

  console.info('== Validating tags')
  await validateTags(db)

  console.info('== Validating users')
  await validateUsers(db)

  console.info('= Finished validations')
}
