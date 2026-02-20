const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

let db, diagrams, users, imageBucket;

async function connect() {
  await client.connect();
  db = client.db('archflow_db');
  diagrams = db.collection('diagrams');
  users = db.collection('users');
  imageBucket = new GridFSBucket(db, { bucketName: 'images' });

  // Create indexes
  await diagrams.createIndex({ updatedAt: -1 });
  await diagrams.createIndex({ userId: 1, updatedAt: -1 });
  await users.createIndex({ email: 1 }, { unique: true });

  console.log('Connected to MongoDB');
  return { db, diagrams, imageBucket };
}

function getDiagrams() { return diagrams; }
function getUsers() { return users; }
function getImageBucket() { return imageBucket; }
function getDb() { return db; }
function toObjectId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

module.exports = { connect, getDiagrams, getUsers, getImageBucket, getDb, toObjectId, ObjectId };
