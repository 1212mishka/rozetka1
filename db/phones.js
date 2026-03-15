import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('phones.db');

export function createPhonesTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS phones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price INTEGER,
      discount INTEGER,
      old_price INTEGER,
      description TEXT,
      reviews TEXT,
      questions TEXT,
      specs TEXT,
      video TEXT,
      payment TEXT,
      warranty TEXT,
      delivery TEXT,
      image TEXT,
      release_year INTEGER
    );
  `);
}

export function migratePhonesTable() {
  try {
    db.execSync(`ALTER TABLE phones ADD COLUMN release_year INTEGER;`);
  } catch (e) {
    // колонка уже существует — игнорируем
  }
}

export function phoneExists(name) {
  const result = db.getAllSync('SELECT id FROM phones WHERE name = ?', [name]);
  return result.length > 0;
}

export function addPhone(p) {
  const statement = db.prepareSync(`
    INSERT INTO phones (name, price, discount, old_price, description, reviews, questions, specs, video, payment, warranty, delivery, image, release_year)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  try {
    statement.executeSync([
      p.name, p.price, p.discount, p.old_price, p.description,
      p.reviews, p.questions, p.specs, p.video, p.payment,
      p.warranty, p.delivery, p.image, p.release_year ?? null
    ]);
  } finally {
    statement.finalizeSync();
  }
}

export function updatePhone(p) {
  db.execSync(`
    UPDATE phones SET
      price = ${p.price},
      discount = ${p.discount},
      old_price = ${p.old_price},
      image = '${p.image}',
      description = '${p.description}',
      payment = '${p.payment}',
      warranty = '${p.warranty}',
      delivery = '${p.delivery}',
      release_year = ${p.release_year ?? null}
    WHERE name = '${p.name}';
  `);
}

export function getPhones() {
  return db.getAllSync('SELECT * FROM phones');
}