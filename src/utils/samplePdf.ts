import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Creates a professional sample PDF document for immediate testing
 */
export async function createSamplePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Colors
  const primaryColor = rgb(0.09, 0.16, 0.28); // #172554 slate-900
  const bodyColor = rgb(0.2, 0.25, 0.33); // #334155
  const mutedColor = rgb(0.45, 0.52, 0.6); // #718096
  const lineStroke = rgb(0.8, 0.84, 0.88); // subtle divider

  // Top header bar
  page.drawRectangle({
    x: 40,
    y: height - 60,
    width: width - 80,
    height: 3,
    color: rgb(0.12, 0.35, 0.8), // royal blue accent
  });

  // Title
  page.drawText('ACTA DE CONFORMIDAD Y ACUERDO COMERCIAL', {
    x: 40,
    y: height - 90,
    size: 16,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText('DOCUMENTO OFICIAL DE VALIDACIÓN CON 3 FIRMAS REQUERIDAS', {
    x: 40,
    y: height - 106,
    size: 8.5,
    font: fontRegular,
    color: mutedColor,
  });

  // Metadata block
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  page.drawText(`Fecha de Emisión: ${dateStr}`, {
    x: 40,
    y: height - 135,
    size: 9,
    font: fontRegular,
    color: bodyColor,
  });

  page.drawText('Referencia: EXP-2026-F3-0094', {
    x: width - 200,
    y: height - 135,
    size: 9,
    font: fontRegular,
    color: bodyColor,
  });

  // Horizontal divider
  page.drawLine({
    start: { x: 40, y: height - 145 },
    end: { x: width - 40, y: height - 145 },
    thickness: 1,
    color: lineStroke,
  });

  // Body content
  let cursorY = height - 175;

  const drawParagraph = (title: string, text: string) => {
    page.drawText(title, {
      x: 40,
      y: cursorY,
      size: 11,
      font: fontBold,
      color: primaryColor,
    });
    cursorY -= 16;

    const words = text.split(' ');
    let currentLine = '';
    const maxWidth = width - 80;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = fontRegular.widthOfTextAtSize(testLine, 9.5);
      if (textWidth > maxWidth) {
        page.drawText(currentLine, {
          x: 40,
          y: cursorY,
          size: 9.5,
          font: fontRegular,
          color: bodyColor,
        });
        currentLine = word;
        cursorY -= 14;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, {
        x: 40,
        y: cursorY,
        size: 9.5,
        font: fontRegular,
        color: bodyColor,
      });
      cursorY -= 22;
    }
  };

  drawParagraph(
    '1. MANIFESTACIÓN DE LAS PARTES',
    'Por el presente instrumento, las partes interesadas declaran su mutuo acuerdo y total conformidad con respecto a los términos, condiciones y entregables especificados en el proyecto institucional adjunto. Todas las cláusulas han sido revisadas en su totalidad conforme a los estándares de calidad vigentes.'
  );

  drawParagraph(
    '2. OBLIGACIONES Y ENTREGABLES TÉCNICOS',
    'El contratista ha suministrado satisfactoriamente la totalidad de los servicios pactados, verificados en campo por el supervisor designado. Se deja constancia de que los entregables cumplen a cabalidad con las especificaciones técnicas y los cronogramas formalizados previamente.'
  );

  drawParagraph(
    '3. CONVALIDACIÓN Y VALIDEZ LEGAL',
    'Para que el presente documento goce de plena validez jurídica y administrativa, se exige de manera indispensable la suscripción y rúbrica de las tres (3) partes intervinientes: Parte Solicitante / Contratante, Parte Proveedora / Contratista y el Supervisor / Testigo de Conformidad.'
  );

  // Signature guide boxes at bottom
  cursorY = 190;

  page.drawText('SUSCRIPCIÓN Y RÚBRICA DE LAS TRES (3) PARTES INTERVINIENTES', {
    x: 40,
    y: cursorY + 25,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });

  const colWidth = (width - 80 - 40) / 3; // 3 columns with 20px gap

  const signers = [
    { label: 'PARTE 1: CONTRATANTE', sub: 'Firma / Rúbrica Digital' },
    { label: 'PARTE 2: PROVEEDOR', sub: 'Firma / Rúbrica Digital' },
    { label: 'PARTE 3: SUPERVISOR / TESTIGO', sub: 'Firma / Rúbrica Digital' },
  ];

  signers.forEach((signer, index) => {
    const colX = 40 + index * (colWidth + 20);

    // Dotted or dashed signature box placeholder
    page.drawRectangle({
      x: colX,
      y: 90,
      width: colWidth,
      height: 95,
      borderWidth: 1,
      borderColor: rgb(0.85, 0.88, 0.92),
      color: rgb(0.98, 0.99, 1.0),
    });

    // Signature line
    page.drawLine({
      start: { x: colX + 12, y: 125 },
      end: { x: colX + colWidth - 12, y: 125 },
      thickness: 1,
      color: rgb(0.6, 0.65, 0.72),
    });

    // Labels
    page.drawText(signer.label, {
      x: colX + 10,
      y: 110,
      size: 7.5,
      font: fontBold,
      color: primaryColor,
    });

    page.drawText(signer.sub, {
      x: colX + 10,
      y: 98,
      size: 7,
      font: fontOblique,
      color: mutedColor,
    });
  });

  // Footer
  page.drawText('Documento generado para suscripción digital múltiple · FirmaPDF', {
    x: 40,
    y: 35,
    size: 7.5,
    font: fontRegular,
    color: mutedColor,
  });

  page.drawText('Página 1 de 1', {
    x: width - 85,
    y: 35,
    size: 7.5,
    font: fontRegular,
    color: mutedColor,
  });

  return await pdfDoc.save();
}
