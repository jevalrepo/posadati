/**
 * Backend de Posada TI 2026 (Google Apps Script).
 * Despliegue: Implementar > Nueva implementación > Aplicación web
 *   - Ejecutar como: Yo
 *   - Quién tiene acceso: Cualquier usuario
 * Copia la URL (termina en /exec) en VITE_APPS_SCRIPT_URL.
 *
 * Contrato:
 *   GET  ?action=list  -> { ok, files: [{ id, name, createdAt }] }
 *   POST (text/plain, JSON { name, mimeType, data(base64) }) -> { ok, id }
 */
var FOLDER_ID = '1VmFykBhQ5UK3BvDpXXkfHH-3-J06-nro';

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var it = folder.getFiles(), files = [];
    while (it.hasNext()) {
      var f = it.next();
      if (String(f.getMimeType()).indexOf('image/') === 0) {
        files.push({ id: f.getId(), name: f.getName(), createdAt: f.getDateCreated().toISOString() });
      }
    }
    files.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
    return json_({ ok: true, files: files });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (String(body.mimeType).indexOf('image/') !== 0) throw new Error('Solo imágenes');
    var ext = (body.mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    var name = Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyyMMdd-HHmmss') + '-' +
      Math.floor(Math.random() * 1e4) + '.' + ext;
    var blob = Utilities.newBlob(Utilities.base64Decode(body.data), body.mimeType, name);
    var file = DriveApp.getFolderById(FOLDER_ID).createFile(blob);
    // Las miniaturas necesitan que el archivo sea visible con el enlace
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return json_({ ok: true, id: file.getId() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
