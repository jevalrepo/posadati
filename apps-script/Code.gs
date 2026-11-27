// Script original en uso (Web App). Contrato:
//   GET  (sin parámetros) -> { success, files: [{ id, name }] }
//   POST text/plain JSON { files: [{ name, type, dataUrl }] } -> { success, files: [{ id, name }] }
// Las fotos se ven en el portal si la CARPETA está compartida como "Cualquier persona con el enlace".
const FOLDER_ID = "1VmFykBhQ5UK3BvDpXXkfHH-3-J06-nro";

function fileToMeta(file) {
  return { id: file.getId(), name: file.getName() };
}

function doPost(e) {
  try {
    var outputData = { success: true, files: [] };
    if (!e || !e.postData || !e.postData.contents) {
      outputData.success = false;
      outputData.error = 'SIN_POSTDATA_JSON: no llegó contenido en el cuerpo.';
      return jsonResponse(outputData);
    }
    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      outputData.success = false;
      outputData.error = 'JSON_INVÁLIDO: ' + err;
      return jsonResponse(outputData);
    }
    if (!payload.files || !Array.isArray(payload.files) || payload.files.length === 0) {
      outputData.success = false;
      outputData.error = 'SIN_FILES: arreglo files vacío o no enviado.';
      return jsonResponse(outputData);
    }
    var folder = DriveApp.getFolderById(FOLDER_ID);
    payload.files.forEach(function (f) {
      if (!f.dataUrl || !f.name) return;
      var matches = f.dataUrl.match(/^data:(.+);base64,(.*)$/);
      var contentType, base64Data;
      if (matches && matches.length === 3) {
        contentType = matches[1];
        base64Data = matches[2];
      } else {
        contentType = f.type || "application/octet-stream";
        base64Data = f.dataUrl;
      }
      var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, f.name);
      outputData.files.push(fileToMeta(folder.createFile(blob)));
    });
    return jsonResponse(outputData);
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var filesIt = folder.getFiles();
    var result = [];
    while (filesIt.hasNext()) result.push(fileToMeta(filesIt.next()));
    return jsonResponse({ success: true, files: result });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

function jsonResponse(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
