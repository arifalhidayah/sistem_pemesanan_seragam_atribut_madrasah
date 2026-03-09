/**
 * HELPER: Convert Blob to Base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * --- KONFIGURASI GOOGLE DRIVE ---
 * Masukkan URL Web App dari Google Apps Script Anda di sini.
 */
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyS43z7yVOpSWY-Q42eOj9DJhHBxOHO9HCm8UoyFbFNPXz4AIziyVT8SXntAp1eE8O4/exec";

/**
 * Uploads a PDF blob to Google Drive (via Apps Script) and returns a WhatsApp URL.
 * @param {Object} order - The order data
 * @param {Blob} pdfBlob - The generated PDF blob
 * @returns {Promise<string|null>} - The WhatsApp URL or null on failure
 */
export const uploadAndGetWhatsAppLink = async (order, pdfBlob) => {
  if (!order.whatsappNumber) return null;
  if (!pdfBlob) return null;

  if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.includes("SALIN_URL")) {
    alert("Gagal Kirim WA: Anda belum memasukkan URL Web App Google di WhatsAppUtils.js!");
    return null;
  }

  try {
    // 1. Convert PDF to Base64
    const base64Data = await blobToBase64(pdfBlob);
    const fileName = `Nota_${order.studentName.replace(/\s+/g, '_')}.pdf`;

    // 2. Upload to Google Apps Script
    // PENTING: Kirim body sebagai 'text/plain' (bukan 'application/json') agar
    // browser Safari di iOS tidak memicu CORS preflight (OPTIONS request).
    // Google Apps Script tidak merespons preflight, sehingga menyebabkan error di Safari/iPhone.
    // Request dengan Content-Type text/plain adalah "simple request" yang tidak memerlukan preflight.
    // Data JSON tetap bisa di-parse di sisi Apps Script menggunakan JSON.parse(e.postData.contents).
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({
        data: base64Data,
        name: fileName
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }

    const downloadURL = result.url;

    // 3. Format WhatsApp message
    const formattedNumber = order.whatsappNumber.startsWith('0')
      ? '62' + order.whatsappNumber.slice(1)
      : order.whatsappNumber;

    const paidAmount = (order.grandTotal || 0) - (order.remaining || 0);
    const remainingLine = order.remaining > 0
      ? `*Sisa Tagihan:* Rp ${order.remaining.toLocaleString('id-ID')}%0A`
      : `*Sisa Tagihan:* _LUNAS_ ✅%0A`;

    const message = `*NOTA PEMESANAN KOPERASI MI*%0A` +
      `------------------------------------%0A` +
      `*Wali:* ${order.guardianName}%0A` +
      `*Siswa:* ${order.studentName}%0A` +
      `------------------------------------%0A` +
      `*Total Biaya:* Rp ${order.grandTotal.toLocaleString('id-ID')}%0A` +
      `*Sudah Dibayar:* Rp ${paidAmount.toLocaleString('id-ID')}%0A` +
      remainingLine +
      `*Status:* ${order.status}%0A` +
      `------------------------------------%0A` +
      `*DOWNLOAD NOTA (GOOGLE DRIVE):*%0A${downloadURL}%0A%0A` +
      `_Terima kasih telah melakukan pemesanan di Koperasi MI Darun Najah Srobyong._`;

    return `https://wa.me/${formattedNumber}?text=${message}`;
  } catch (error) {
    console.error("WhatsApp Integration Error (Google Drive):", error);
    alert("Pesan Sistem: Gagal mengunggah PDF ke Google Drive. Pastikan URL Script benar dan sudah di-Deploy sebagai 'Anyone'.");
    return null;
  }
};
