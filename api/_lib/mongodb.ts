import { MongoClient, Db, Collection } from 'mongodb';

export interface StockPriceDocument {
  scripCode: string;
  shortName: string;
  scripName: string;
  isin?: string;
  category?: string;
  ltp: number;
  ltpPaise: number;
  change: number;
  percentChange: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  asOn: string;
  source: 'BSE_INDIA' | 'BSE_INDIA_LIVE' | string;
  updatedAt: Date;
}

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'ArthResearch';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error('MONGODB_URI is not configured in environment');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 2000,
    connectTimeoutMS: 2000,
  });

  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  // Initialize indexes safely in the background
  try {
    const collection = db.collection<StockPriceDocument>('StockPrices');
    await Promise.all([
      collection.createIndex({ scripCode: 1 }, { unique: true }),
      collection.createIndex({ shortName: 1 }),
      collection.createIndex({ updatedAt: -1 })
    ]);
  } catch (idxErr) {
    // Indexes might already exist
  }

  return { client, db };
}

export async function getStockPricesCollection(): Promise<Collection<StockPriceDocument>> {
  const { db } = await connectToDatabase();
  return db.collection<StockPriceDocument>('StockPrices');
}
