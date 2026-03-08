import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const safeFormat = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return val.toLocaleString('id-ID');
};

export const generateInvoicePDF = (order, shouldSave = true, masterCategories = []) => {
  try {
    const doc = new jsPDF();
  
  // Header / Kop Surat
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("KOPERASI MI DARUN NAJAH SROBYONG", 105, 15, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Desa Srobyong, Kec. Mlonggo, Kab. Jepara, Jawa Tengah", 105, 21, { align: "center" });
  doc.text("BUKTI PEMBAYARAN KOPERASI MADRASAH", 105, 28, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // Student Details
  doc.setFontSize(10);
  doc.text(`No. Pesanan: ${order.id || 'N/A'}`, 14, 40);
  doc.text(`Nama Wali: ${order.guardianName}`, 14, 46);
  doc.text(`Nama Siswa: ${order.studentName}`, 14, 52);
  doc.text(`Alamat: ${order.address}`, 14, 58);
  doc.text(`Jenis Kelamin: ${order.gender}`, 130, 46);

  // Student Benefit Status
  let detailStartY = 65;
  if (order.studentBenefitStatus && order.studentBenefitStatus !== 'none') {
    const benefitLabel = order.studentBenefitStatus === 'yatim' ? 'YATIM / PIATU' : (order.studentBenefitNote || 'Keistimewaan Khusus');
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.setTextColor(4, 120, 87);
    doc.text(`Status: ${benefitLabel}`, 14, 64);
    doc.setTextColor(0,0,0); doc.setFont("helvetica", "normal");
    detailStartY = 70;
  }

  // Table Data
  let tableData = [];
  
  if (order.items && Array.isArray(order.items)) {
    // Sort items by category name alphabetically (Kategori A first, then B)
    const sortedItems = [...order.items].sort((a, b) => {
      const nameA = (a.categoryName || '').toLowerCase();
      const nameB = (b.categoryName || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

    sortedItems.forEach((item, index) => {
      const label = item.type ? `${item.type} (${item.name})` : item.name;
      tableData.push([
        index + 1, 
        label, 
        item.categoryName || '-',
        item.price ? `Rp ${safeFormat(item.price)}` : '0'
      ]);
    });
  } else {
    // Legacy support
    const legacyItems = [];
    if (order.uniforms) {
      order.uniforms.forEach(u => legacyItems.push({ label: `${u.type} (${u.size})`, cat: 'Seragam', price: u.price }));
    }
    if (order.attributes) {
      order.attributes.forEach(a => legacyItems.push({ label: a.name, cat: 'Atribut', price: a.price }));
    }
    legacyItems.forEach((item, index) => tableData.push([index + 1, item.label, item.cat, `Rp ${safeFormat(item.price)}`]));
  }

  autoTable(doc, {
    startY: detailStartY,
    head: [['No', 'Keterangan Item', 'Kategori', 'Harga (Rp)']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87] }, // Emerald-700
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 80 },
      2: { cellWidth: 50 },
      3: { halign: 'right' }
    }
  });

  // Category notes below the table
  const categoriesWithNotes = masterCategories.filter(c => c.notes && c.notes.trim());
  let notesY = doc.lastAutoTable.finalY + 4;
  categoriesWithNotes.forEach(cat => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 100, 20);
    const lines = doc.splitTextToSize(`* ${cat.name}: ${cat.notes}`, 182);
    doc.text(lines, 14, notesY);
    notesY += lines.length * 4 + 2;
    doc.setTextColor(0,0,0);
  });
  const finalY = notesY + 6;
  
  // Totals
  doc.setFont("helvetica", "bold");
  doc.text("RINGKASAN PEMBAYARAN", 14, finalY);
  
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", 120, finalY + 10);
  doc.text(`Rp ${safeFormat(order.subTotal)}`, 196, finalY + 10, { align: 'right' });
  
  doc.text("Potongan (Diskon)", 120, finalY + 16);
  doc.text(`Rp ${safeFormat(order.discount)}`, 196, finalY + 16, { align: 'right' });
  
  doc.setFont("helvetica", "bold");
  doc.text("Total Biaya", 120, finalY + 24);
  doc.text(`Rp ${safeFormat(order.grandTotal)}`, 196, finalY + 24, { align: 'right' });
  
  doc.setFont("helvetica", "normal");
  doc.text("Total Terbayar", 120, finalY + 30);
  doc.text(`Rp ${safeFormat(order.amountPaid)}`, 196, finalY + 30, { align: 'right' });
  
  doc.text("Sisa Tagihan", 120, finalY + 36);
  doc.setTextColor(order.remaining > 0 ? 255 : 0, 0, 0); 
  doc.text(`Rp ${safeFormat(order.remaining)}`, 196, finalY + 36, { align: 'right' });
  doc.setTextColor(0, 0, 0); 
  
  doc.setFont("helvetica", "bold");
  doc.text("STATUS", 14, finalY + 10);
  doc.setFontSize(14);
  
  if (order.status === 'Lunas') doc.setTextColor(4, 120, 87);
  else if (order.status === 'Belum Lunas') doc.setTextColor(234, 179, 8);
  else doc.setTextColor(220, 38, 38);
  
  doc.text(order.status.toUpperCase(), 14, finalY + 18);
  doc.setTextColor(0,0,0);
  
    const historyData = order.paymentHistory.map((payment, idx) => [
      idx + 1,
      new Date(payment.date).toLocaleDateString('id-ID'),
      `Rp ${safeFormat(payment.amount)}`,
      payment.receivedBy || '-'
    ]);
    
    autoTable(doc, {
      startY: finalY + 45,
      head: [['No', 'Tanggal', 'Nominal', 'Petugas']],
      body: historyData,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 10 }, 
        1: { cellWidth: 40 }, 
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'center' }
      }
    });
  
  const signatureY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : finalY + 40) + 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Srobyong, " + new Date().toLocaleDateString('id-ID'), 150, signatureY);
  doc.text("Petugas Koperasi", 150, signatureY + 5);
  
  doc.setFont("helvetica", "bold");
  const signerName = order.updatedBy || order.createdBy || "...................................";
  doc.text(`( ${signerName} )`, 150, signatureY + 25);
  doc.setFont("helvetica", "normal");

  if (shouldSave) {
    doc.save(`Nota_${order.studentName.replace(/\s+/g, '_')}.pdf`);
  }
  
  return doc.output('blob');
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
};

export const generateReportPDF = (orders, financialSummary, categoryStats, masterCategories) => {
  try {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN REKAPITULASI PEMESANAN KOPERASI", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("MI DARUN NAJAH SROBYONG", 105, 21, { align: "center" });
    doc.text(`Periode Cetak: ${new Date().toLocaleDateString('id-ID')}`, 105, 27, { align: "center" });
    doc.line(14, 32, 196, 32);

    let currentY = 40;

    // 1. KEUANGAN
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("I. REKAPITULASI KEUANGAN", 14, currentY);
    autoTable(doc, {
      startY: currentY + 5,
      body: [
        ['Total Pemasukan (Cash/Transfer)', `Rp ${financialSummary.totalRevenue.toLocaleString('id-ID')}`],
        ['Total Piutang (Belum Bayar)', `Rp ${financialSummary.totalReceivables.toLocaleString('id-ID')}`],
        ['Estimasi Pendapatan Kotor', `Rp ${financialSummary.totalExpected.toLocaleString('id-ID')}`]
      ],
      theme: 'grid',
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // 2. REKAP PER KATEGORI
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("II. REKAPITULASI PESANAN PER KATEGORI", 14, currentY);
    currentY += 8;

    masterCategories.forEach((cat) => {
      const stats = categoryStats[cat.id] || {};
      if (Object.keys(stats).length === 0) return;

      doc.setFontSize(10); doc.setFont("helvetica", "bold");
      doc.text(`Kategori: ${cat.name}`, 14, currentY);
      currentY += 4;

      if (cat.type === 'grouped') {
        Object.entries(stats).forEach(([typeName, data]) => {
          const sizes = Array.from(new Set(cat.items.filter(i => i.type === typeName).map(i => i.name)));
          autoTable(doc, {
            startY: currentY,
            head: [['Gender / Size', ...sizes, 'Total']],
            body: [
              ['Putra', ...sizes.map(s => data.genderStats.Putra[s] || 0), sizes.reduce((sum, s) => sum + (data.genderStats.Putra[s]||0), 0)],
              ['Putri', ...sizes.map(s => data.genderStats.Putri[s] || 0), sizes.reduce((sum, s) => sum + (data.genderStats.Putri[s]||0), 0)]
            ],
            foot: [['TOTAL UNIT', ...sizes.map(s => (data.genderStats.Putra[s]||0) + (data.genderStats.Putri[s]||0)), data.count]],
            theme: 'grid',
            headStyles: { fillColor: [51, 65, 85], halign: 'center' },
            footStyles: { fillColor: [4, 120, 87], halign: 'center' },
            styles: { fontSize: 8, halign: 'center' }
          });
          currentY = doc.lastAutoTable.finalY + 8;
        });
      } else {
        const flatBody = Object.entries(stats).map(([name, data]) => [
          name, 
          Object.values(data.genderStats.Putra).reduce((a,b)=>a+b,0),
          Object.values(data.genderStats.Putri).reduce((a,b)=>a+b,0),
          data.count
        ]);
        autoTable(doc, {
          startY: currentY,
          head: [['Nama Item', 'Putra', 'Putri', 'Total']],
          body: flatBody,
          theme: 'grid',
          headStyles: { fillColor: [37, 99, 235] },
          styles: { fontSize: 8 },
          columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center', fontStyle: 'bold' } }
        });
        currentY = doc.lastAutoTable.finalY + 8;
      }
      
      // Page break if near bottom
      if (currentY > 250) { doc.addPage(); currentY = 20; }
    });

    doc.save(`Laporan_Koperasi_${new Date().toISOString().slice(0,10)}.pdf`);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const generateTailorReportPDF = (orders, categoryStats, masterCategories) => {
  try {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("REKAP PRODUKSI SERAGAM (UNTUK PENJAHIT)", 105, 15, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("MI DARUN NAJAH SROBYONG", 105, 21, { align: "center" });
    doc.line(14, 25, 196, 25);

    let currentY = 35;

    masterCategories.filter(c => c.type === 'grouped').forEach((cat) => {
      const stats = categoryStats[cat.id] || {};
      if (Object.keys(stats).length === 0) return;

      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text(`Rekap: ${cat.name}`, 14, currentY);
      currentY += 5;

      Object.entries(stats).forEach(([typeName, data]) => {
        const sizes = Array.from(new Set(cat.items.filter(i => i.type === typeName).map(i => i.name)));
        autoTable(doc, {
          startY: currentY,
          head: [[typeName, ...sizes, 'Total']],
          body: [
            ['Putra', ...sizes.map(s => data.genderStats.Putra[s] || 0), sizes.reduce((sum, s) => sum + (data.genderStats.Putra[s]||0), 0)],
            ['Putri', ...sizes.map(s => data.genderStats.Putri[s] || 0), sizes.reduce((sum, s) => sum + (data.genderStats.Putri[s]||0), 0)],
            ['TOTAL', ...sizes.map(s => (data.genderStats.Putra[s]||0) + (data.genderStats.Putri[s]||0)), data.count]
          ],
          theme: 'grid',
          headStyles: { fillColor: [51, 65, 85], halign: 'center' },
          styles: { fontSize: 9, halign: 'center' },
          columnStyles: { 0: { fontStyle: 'bold', halign: 'left' } }
        });
        currentY = doc.lastAutoTable.finalY + 10;
      });
      if (currentY > 250) { doc.addPage(); currentY = 20; }
    });

    // KHUSUS: Rekap Jilbab (biasanya di kategori flat/atribut)
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("III. REKAP JILBAB", 14, currentY);
    currentY += 5;

    const hijabStats = [];
    Object.values(categoryStats).forEach(cat => {
      Object.entries(cat).forEach(([name, data]) => {
        if (name.toLowerCase().includes("jilbab")) {
          hijabStats.push([
            name,
            Object.values(data.genderStats.Putra).reduce((a,b)=>a+b, 0),
            Object.values(data.genderStats.Putri).reduce((a,b)=>a+b, 0),
            data.count
          ]);
        }
      });
    });

    if (hijabStats.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Nama Item', 'Putra', 'Putri', 'Total']],
        body: hijabStats,
        theme: 'grid',
        headStyles: { fillColor: [190, 24, 93] }, // Pink/Rose for Hijab
        styles: { fontSize: 9, halign: 'center' },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(9); doc.setFont("helvetica", "italic");
      doc.text("Tidak ada pesanan jilbab.", 14, currentY);
      currentY += 10;
    }

    currentY += 10;
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("DAFTAR NAMA & UKURAN DETAIL", 14, currentY);
    
    const details = orders.flatMap(o => {
      const selections = o.categoriesSelections || {};
      return Object.values(selections).flat().filter(i => i.type).map(i => [
        o.studentName,
        o.gender,
        i.type,
        i.name
      ]);
    }).map((row, idx) => [idx+1, ...row]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['No', 'Nama Siswa', 'L/P', 'Jenis Seragam', 'Ukuran']],
      body: details,
      theme: 'grid',
      styles: { fontSize: 9 }
    });

    doc.save(`Pesanan_Penjahit_${new Date().toISOString().slice(0,10)}.pdf`);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
/**
 * Generates a complete financial detail report:
 * - Financial summary
 * - Aggregated cost per item type across all students
 * - Per-student itemized cost table
 */
export const generateFinancialDetailReportPDF = (orders, financialSummary) => {
  try {
    const doc = new jsPDF();

    // ── Header ──────────────────────────────────────────────────────────────
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("LAPORAN KEUANGAN LENGKAP", 105, 15, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("KOPERASI MI DARUN NAJAH SROBYONG", 105, 21, { align: "center" });
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, 105, 27, { align: "center" });
    doc.line(14, 31, 196, 31);

    let currentY = 38;

    // ── I. Ringkasan Keuangan ────────────────────────────────────────────────
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("I. RINGKASAN KEUANGAN", 14, currentY);
    autoTable(doc, {
      startY: currentY + 4,
      body: [
        ['Total Pemasukan (Lunas + DP)', `Rp ${safeFormat(financialSummary.totalRevenue)}`],
        ['Total Piutang (Belum Bayar)', `Rp ${safeFormat(financialSummary.totalReceivables)}`],
        ['Estimasi Pendapatan Kotor', `Rp ${safeFormat(financialSummary.totalExpected)}`],
        ['Jumlah Pesanan', `${orders.length} pesanan`],
        ['Lunas', `${orders.filter(o => o.status === 'Lunas').length} pesanan`],
        ['Belum Lunas', `${orders.filter(o => o.status === 'Belum Lunas').length} pesanan`],
        ['Belum Bayar', `${orders.filter(o => o.status === 'Belum Bayar').length} pesanan`],
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100 }, 1: { halign: 'right' } }
    });
    currentY = doc.lastAutoTable.finalY + 12;

    // ── II. Rekapitulasi Biaya Per Item ──────────────────────────────────────
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("II. REKAPITULASI BIAYA PER JENIS ITEM", 14, currentY);

    // Aggregate: { itemLabel: { count, totalCost } }
    const itemAgg = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const label = item.type ? `${item.type} (${item.name || '-'})` : (item.name || '-');
        const cat = item.categoryName || 'Lain-lain';
        const key = `${cat}||${label}`;
        if (!itemAgg[key]) itemAgg[key] = { label, cat, count: 0, totalCost: 0, price: item.price || 0 };
        itemAgg[key].count += 1;
        itemAgg[key].totalCost += (item.price || 0);
      });
    });

    const aggRows = Object.values(itemAgg)
      .sort((a, b) => a.cat.localeCompare(b.cat) || a.label.localeCompare(b.label))
      .map(r => [
        r.cat,
        r.label,
        `Rp ${safeFormat(r.price)}`,
        r.count,
        `Rp ${safeFormat(r.totalCost)}`
      ]);

    const totalItemCost = Object.values(itemAgg).reduce((s, r) => s + r.totalCost, 0);

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Kategori', 'Nama Item', 'Harga Satuan', 'Jml', 'Total Biaya']],
      body: aggRows,
      foot: [['', '', '', 'TOTAL', `Rp ${safeFormat(totalItemCost)}`]],
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [4, 120, 87] },
      footStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'right' },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 55 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 12 },
        4: { halign: 'right' }
      }
    });
    doc.save(`Laporan_Keuangan_Lengkap_${new Date().toISOString().slice(0,10)}.pdf`);
    return true;
  } catch (error) {
    console.error("Error generating financial detail report:", error);
    return false;
  }
};
