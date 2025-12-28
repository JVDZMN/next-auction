require('dotenv').config()

module.exports = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5434/next_auction_db"
    }
  }
}
