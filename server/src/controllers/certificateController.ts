import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';

/**
 * @desc Generate a certificate PDF
 * @route POST /api/v1/certificates/generate
 * @access Public (or Private depending on your need, for now Public)
 */
export const generateCertificate = async (req: Request, res: Response) => {
  try {
    const { name, eventName, date, issueId } = req.body;

    if (!name || !eventName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both name and eventName for the certificate.',
      });
    }

    const certificateDate = date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString();
    const certificateId = issueId || `CERT-${Math.floor(Math.random() * 1000000)}`;

    // Set response headers to indicate a PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate_${name.replace(/\s+/g, '_')}.pdf`);

    // Create a new PDF document (landscape mode for certificate)
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 50,
    });

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // --- Draw Certificate ---

    // Border
    doc
      .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .lineWidth(5)
      .strokeColor('#1F4E79')
      .stroke();

    // Inner Border
    doc
      .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .lineWidth(2)
      .strokeColor('#5B9BD5')
      .stroke();

    // Title
    doc
      .font('Helvetica-Bold')
      .fontSize(40)
      .fillColor('#1F4E79')
      .text('CERTIFICATE OF APPRECIATION', 0, 120, { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(16)
      .fillColor('#333333')
      .text('This certificate is proudly presented to', 0, 200, { align: 'center' });

    // Name
    doc
      .font('Helvetica-Bold')
      .fontSize(32)
      .fillColor('#000000')
      .text(name, 0, 250, { align: 'center' });

    doc
      .moveTo(250, 290)
      .lineTo(590, 290)
      .lineWidth(1)
      .strokeColor('#000000')
      .stroke();

    // Event/Course Description
    doc
      .font('Helvetica')
      .fontSize(16)
      .fillColor('#333333')
      .text(`for their outstanding participation and contribution in`, 0, 310, { align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor('#1F4E79')
      .text(eventName, 0, 350, { align: 'center' });

    // Date & Signature blocks
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor('#000000')
      .text(`Date: ${certificateDate}`, 150, 450);

    doc
      .moveTo(150, 445)
      .lineTo(280, 445)
      .stroke();
    
    doc.text(`ID: ${certificateId}`, 150, 470);

    doc.text('Authorized Signature', 550, 450);
    
    doc
      .moveTo(550, 445)
      .lineTo(700, 445)
      .stroke();

    // Finalize the PDF and end the stream
    doc.end();

  } catch (error) {
    console.error('Error generating certificate:', error);
    // Note: If the stream has already started piping, sending JSON will fail.
    // In this case, we'll try to set status 500 if headers aren't sent.
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'An error occurred while generating the certificate.',
      });
    }
  }
};
