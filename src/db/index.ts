import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
// Schema must be passed to drizzle() to enable relational queries (db.query)
const db = drizzle(client, { schema });

const allExecutives = await db.select().from(schema.executives);