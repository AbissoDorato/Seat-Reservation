/**
 * @param id number that identifies the theathre generated when the theater is insered in the database
 * @param name name of the theatre
 * @param columns number of columns present in the theatre (used to compute the total number of seats)
 * @param rows number of colmuns present in the theatre (used to compute the total number of seats)
 * @param concert list of concert in that theatre
 * @param type it can be small, medium or large based on the size of the theatre
 *
 */
// Definizione del costruttore Theatre
function Theatre(id_t, name, rows, columns, type) {
  this.id_t = id_t || "N/A"; // Assicurati di avere un valore di fallback se undefined
  this.name = name || "Unknown"; // Fallback per il nome
  this.rows = rows !== undefined ? rows : 0; // Fallback per le righe
  this.columns = columns !== undefined ? columns : 0; // Fallback per le colonne
  this.type = type || "Unknown"; // Fallback per il tipo
}
/**
 * @param id_c id of the concert
 * @param id_t id of the theatre
 * @param id name of the concert
 */

function Concert(id_c, theater_id, name) {
  this.id_c = id_c || "N/A"; // key
  this.id_t = theater_id || "N/A"; // foreign key
  this.id = name || "Unknown";
}

export { Theatre, Concert };
