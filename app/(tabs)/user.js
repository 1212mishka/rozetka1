export function getUsers() {
  return db.getAllSync('SELECT * FROM users');
}

export function deleteUser(id) {
  db.execSync(`DELETE FROM users WHERE id = ${id};`);
}