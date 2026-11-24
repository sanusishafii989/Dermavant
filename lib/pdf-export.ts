import { jsPDF } from "jspdf";
import type { MedicalHistoryItem, PatientVitalsSummary } from "@/types/history";

interface ExportPDFParams {
  patientName: string;
  vitals?: PatientVitalsSummary | null;
  items: MedicalHistoryItem[];
}

export function generateMedicalHistoryPDF({ patientName, vitals, items }: ExportPDFParams) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = margin + 10;
      drawHeader();
    }
  };

  const drawHeader = () => {
    // Header Banner
    doc.setFillColor(11, 19, 43); // Dark Navy
    doc.rect(0, 0, pageWidth, 24, "F");

    doc.setTextColor(0, 229, 255); // Cyan
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("DERMAVANT", margin, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("CONTINUOUS MEDICAL HISTORY ARCHIVE", margin, 18);

    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    const exportDateStr = `Exported: ${new Date().toLocaleDateString(undefined, {
      dateStyle: "medium",
    })}`;
    doc.text(exportDateStr, pageWidth - margin - doc.getTextWidth(exportDateStr), 15);
  };

  // 1. Render Cover Header
  drawHeader();
  y = 32;

  // Patient Info Box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "F");
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Patient: ${patientName}`, margin + 5, y + 8);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Record ID: AH-PAT-${Math.floor(100000 + Math.random() * 900000)}`, margin + 5, y + 16);
  doc.text(`Total Recorded Care Events: ${items.length}`, margin + 110, y + 16);

  y += 28;

  // 2. Render Vitals Section
  if (vitals) {
    checkPageBreak(35);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(11, 19, 43);
    doc.text("PATIENT VITALS & HEALTH PROFILE", margin, y);
    y += 3;

    doc.setDrawColor(0, 229, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 40, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);

    const bloodGroupText = `Blood Group: ${vitals.bloodGroup || "Not specified"}`;
    const bpText = `Blood Pressure: ${vitals.bloodPressure || "120/80 mmHg"}`;
    const heightText = `Height: ${vitals.height ? `${vitals.height} cm` : "N/A"}`;
    const weightText = `Weight: ${vitals.weight ? `${vitals.weight} kg` : "N/A"}`;

    doc.text(bloodGroupText, margin, y);
    doc.text(bpText, margin + 50, y);
    doc.text(heightText, margin + 100, y);
    doc.text(weightText, margin + 140, y);
    y += 6;

    const allergiesStr =
      vitals.allergies && vitals.allergies.length > 0 ? vitals.allergies.join(", ") : "None recorded";
    const chronicStr =
      vitals.chronicConditions && vitals.chronicConditions.length > 0
        ? vitals.chronicConditions.join(", ")
        : "None recorded";

    doc.text(`Allergies: ${allergiesStr}`, margin, y);
    y += 5;
    doc.text(`Chronic Conditions: ${chronicStr}`, margin, y);
    y += 5;

    if (vitals.emergencyContact) {
      doc.text(
        `Emergency Contact: ${vitals.emergencyContact.name} (${vitals.emergencyContact.phone})`,
        margin,
        y
      );
      y += 5;
    }

    y += 6;
  }

  // 3. Render Medical History Records
  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(11, 19, 43);
  doc.text("CLINICAL CARE TIMELINE", margin, y);
  y += 3;

  doc.setDrawColor(255, 183, 3);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 35, y);
  y += 7;

  if (items.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text("No medical history entries found in record archive.", margin, y);
    y += 10;
  } else {
    items.forEach((item, index) => {
      checkPageBreak(35);

      // Card Header
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const titleText = `${index + 1}. ${item.title}`;
      doc.text(titleText, margin + 4, y + 6.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const dateText = new Date(item.date).toLocaleDateString(undefined, { dateStyle: "medium" });
      doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText) - 4, y + 6.5);

      y += 13;

      // Doctor Details if available
      if (item.doctorName) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(14, 116, 144);
        doc.text(`Provider: ${item.doctorName} (${item.doctorSpecialization || "Specialist"})`, margin + 4, y);
        y += 5;
      }

      // Symptoms / Notes
      if (item.symptoms) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const splitSymptoms = doc.splitTextToSize(`Reported Symptoms: ${item.symptoms}`, contentWidth - 8);
        checkPageBreak(splitSymptoms.length * 4);
        doc.text(splitSymptoms, margin + 4, y);
        y += splitSymptoms.length * 4.5;
      }

      if (item.clinicalNotes) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const splitNotes = doc.splitTextToSize(`Clinical Notes: ${item.clinicalNotes}`, contentWidth - 8);
        checkPageBreak(splitNotes.length * 4);
        doc.text(splitNotes, margin + 4, y);
        y += splitNotes.length * 4.5;
      }

      // Diagnosis
      if (item.diagnosis && item.diagnosis.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(180, 83, 9);
        doc.text(item.category === "ai_triage" ? "Possible explanations (AI triage):" : "Diagnosis:", margin + 4, y);
        y += 4;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        item.diagnosis.forEach((d) => {
          const diagStr = typeof d === "string"
            ? d
            : item.category === "ai_triage"
              ? `${d.condition} (AI estimate: ${(d.confidence * 100).toFixed(0)}%)`
              : `${d.condition} (${(d.confidence * 100).toFixed(0)}% confidence)`;
          checkPageBreak(4);
          doc.text(`• ${diagStr}`, margin + 8, y);
          y += 4;
        });
        if (item.category === "ai_triage") {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          const note = "AI estimates are model-generated and are not validated diagnostic probabilities.";
          const wrappedNote = doc.splitTextToSize(note, contentWidth - 12);
          checkPageBreak(wrappedNote.length * 3.5);
          doc.text(wrappedNote, margin + 8, y);
          y += wrappedNote.length * 3.5;
        }
      }

      // Prescriptions
      if (item.prescriptions && item.prescriptions.length > 0) {
        checkPageBreak(12 + item.prescriptions.length * 5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(14, 116, 144);
        doc.text("Prescribed Medications:", margin + 4, y);
        y += 4;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        item.prescriptions.forEach((p) => {
          const rxLine = `• ${p.medication_name} (${p.dosage}) - ${p.frequency} for ${p.duration} ${p.instructions ? `[${p.instructions}]` : ""}`;
          const splitRx = doc.splitTextToSize(rxLine, contentWidth - 12);
          checkPageBreak(splitRx.length * 4);
          doc.text(splitRx, margin + 8, y);
          y += splitRx.length * 4;
        });
      }

      // Recommendation
      if (item.recommendation) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const splitRec = doc.splitTextToSize(`Recommendation: ${item.recommendation}`, contentWidth - 8);
        checkPageBreak(splitRec.length * 4);
        doc.text(splitRec, margin + 4, y);
        y += splitRec.length * 4;
      }

      y += 5;
    });
  }

  // 4. Render Footer Page Numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Dermavant • Confidential Medical Document", margin, pageHeight - 7);

    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 7);
  }

  // Save PDF
  const safeName = patientName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const dateSuffix = new Date().toISOString().slice(0, 10);
  doc.save(`Dermavant_Medical_History_${safeName}_${dateSuffix}.pdf`);
}
