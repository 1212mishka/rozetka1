import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('phones.db');

export function createLaptopsTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS laptops (
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
export function removeDuplicateLaptops() {
  db.execSync(`
    DELETE FROM laptops
    WHERE id NOT IN (
      SELECT MIN(id) FROM laptops GROUP BY name
    );
  `);
}
export function migrateLaptopsTable() {
  try {
    db.execSync(`ALTER TABLE laptops ADD COLUMN release_year INTEGER;`);
  } catch (e) {
    // колонка уже существует — игнорируем
  }
}

export function laptopExists(name) {
  const result = db.getAllSync('SELECT id FROM laptops WHERE name = ?', [name]);
  return result.length > 0;
}

export function addLaptop(p) {
  const statement = db.prepareSync(`
    INSERT INTO laptops (name, price, discount, old_price, description, reviews, questions, specs, video, payment, warranty, delivery, image, release_year)
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

export function updateLaptop(p) {
  db.execSync(`
    UPDATE laptops SET
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

export function getLaptops() {
  return db.getAllSync('SELECT * FROM laptops');
}