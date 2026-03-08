/**
 * GOOGLE APPS SCRIPT CODE (VERSI CUSTOM FOLDER)
 * Tempelkan kode ini di https://script.google.com/
 */

// --- KONFIGURASI FOLDER ---
// Ganti dengan ID Folder Google Drive Anda (bisa dilihat di URL folder saat dibuka di browser)
// Contoh link: https://drive.google.com/drive/folders/1abc12345xyz...
// Maka ID-nya adalah: 1abc12345xyz...
var TARGET_FOLDER_ID = "13dDj3sKPWWBBGJhMnCMCarQAHKeI_vLm";

function doPost(e) {
  try {
    var fileData = JSON.parse(e.postData.contents);
    var fileName = fileData.name || "Nota_Pemesanan.pdf";
    var blob = Utilities.newBlob(Utilities.base64Decode(fileData.data), "application/pdf", fileName);

    var folder;
    // Cek jika ID folder sudah diisi (tidak kosong dan bukan teks instruksi default)
    if (TARGET_FOLDER_ID && TARGET_FOLDER_ID !== "" && !TARGET_FOLDER_ID.includes("ID_FOLDER")) {
      // Gunakan Folder ID yang ditentukan
      folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    } else {
      // Fallback ke folder default jika ID tidak diisi
      var folderName = "Nota_Koperasi_MI";
      var folders = DriveApp.getFoldersByName(folderName);
      folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    }

    // Simpan file
    var file = folder.createFile(blob);

    // Atur izin Publik agar link bisa dibuka walimurid
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      url: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("Service is running with Custom Folder support!");
}
