import React, { useMemo, useRef } from "react";

export default function DeliveryNoteTemplate({
  data = {
    date: "",
    vin: "",
    customerName: "",
    phone: "",
    email: "",
    approvalNo: "",
    modificationsTitle: "MODIFICATIONS",
    financialCleared: false,
    approvedBy: "",
    pdiDoneBy: "",
    invoiceNo: "",
    jcNo: "",
    paymentConfirmed: false,
    notes: "",
    receivedBy: "",
    receivedDate: "",
    items: [
      { description: "", quantity: "", notes: "" },
    ],
    company: {
      name: "GILANI MOBILITY",
      phones: ["+971 4 881 8426", "+971 54 320 0677"],
      email: "sales@gilanimobility.ae",
      trn: "TRN: 104019044700003",
      address: "Warehouse #5-17th St., 917th St. Umm Ramool, Dubai, UAE",
    },
  },
  onClose,
}) {
  const printRef = useRef(null);
  
  // Ensure at least 5 empty rows for manual fill
  const rows = useMemo(() => {
    const items = data.items?.length ? data.items : [];
    const emptyRows = Array(Math.max(5 - items.length, 0)).fill({ description: "", quantity: "", notes: "" });
    return [...items, ...emptyRows];
  }, [data.items]);

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Note - ${data.invoiceNo || 'Print'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #fff; }
          @page { size: A4; margin: 10mm; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div style={styles.page}>
      {/* Print styles */}
      <style>{printCss}</style>

      <div ref={printRef} style={styles.sheet}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.logoBox}>
            <img src="/gm-header.png" alt="Gilani Mobility" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
          </div>

          <div style={styles.titleBox}>
            <div style={styles.title}>DELIVERY NOTE</div>

            <div style={styles.metaGrid}>
              <div style={styles.metaRow}>
                <div style={styles.metaLabel}>Date</div>
                <div style={styles.metaValue}>{data.date}</div>
              </div>
              <div style={styles.metaRow}>
                <div style={styles.metaLabel}>VIN #</div>
                <div style={styles.metaValue}>{data.vin}</div>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER + COMPANY */}
        <div style={styles.twoCol}>
          <div style={styles.block}>
            <div style={styles.blockHeader}>CUSTOMER DETAIL</div>
            <div style={styles.blockBody}>
              <Field label="Customer Name" value={data.customerName} />
              <Field label="Phone No." value={data.phone} />
              <Field label="Email" value={data.email} />
            </div>
          </div>

          <div style={styles.block}>
            <div style={styles.blockHeader}>COMPANY DETAIL</div>
            <div style={styles.blockBody}>
              <div style={styles.companyName}>{data.company?.name}</div>
              <div style={styles.smallText}>
                {data.company?.phones?.filter(Boolean).join(" / ")}
              </div>
              <div style={styles.smallText}>{data.company?.email}</div>
              <div style={styles.smallText}>{data.company?.trn}</div>
              <div style={styles.smallText}>{data.company?.address}</div>
            </div>
          </div>
        </div>

        {/* MODIFICATIONS TABLE */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>{data.modificationsTitle}</div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 45 }}>#</th>
                <th style={{ ...styles.th }}>Description</th>
                <th style={{ ...styles.th, width: 90 }}>Qty</th>
                <th style={{ ...styles.th, width: 180 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it, idx) => (
                <tr key={idx}>
                  <td style={styles.tdCenter}>{idx + 1}</td>
                  <td style={styles.td}>{it.description}</td>
                  <td style={styles.tdCenter}>{it.quantity}</td>
                  <td style={styles.td}>{it.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* APPROVALS + INVOICE */}
        <div style={styles.threeCol}>
          <div style={styles.block}>
            <div style={styles.blockHeader}>FINANCIAL</div>
            <div style={styles.blockBody}>
              <CheckboxField label="Financial Cleared" checked={data.financialCleared} />
              <Field label="By" value={data.approvedBy} />
            </div>
          </div>

          <div style={styles.block}>
            <div style={styles.blockHeader}>QUALITY</div>
            <div style={styles.blockBody}>
              <Field label="PDI Done By" value={data.pdiDoneBy} />
            </div>
          </div>

          <div style={styles.block}>
            <div style={styles.blockHeader}>REFERENCE</div>
            <div style={styles.blockBody}>
              <Field label="Invoice #" value={data.invoiceNo} />
              <Field label="JC #" value={data.jcNo} />
              <CheckboxField label="Payment Confirmed" checked={data.paymentConfirmed} />
            </div>
          </div>
        </div>

        {/* NOTES */}
        <div style={styles.block}>
          <div style={styles.blockHeader}>NOTES</div>
          <div style={{ ...styles.blockBody, minHeight: 80 }}>
            <div style={styles.noteText}>{data.notes}</div>
          </div>
        </div>

        {/* DECLARATION */}
        <div style={styles.declaration}>
          <div style={styles.declLine}>
            • The customer has received a demonstration on how to operate the product and can use it safely.
          </div>
          <div style={styles.declLine}>
            • Thank you for your purchase from Gilani Mobility. We appreciate your trust in our products and look forward to serving you again.
          </div>
          <div style={styles.declLine}>
            • The customer is aware that the vehicle has been modified and changes have been implemented due to the modifications.
          </div>
        </div>

        {/* SIGNATURES */}
        <div style={styles.twoCol}>
          <div style={styles.block}>
            <div style={styles.blockHeader}>RECEIVED BY</div>
            <div style={styles.blockBody}>
              <Field label="Name" value={data.receivedBy} />
              <Field label="Date" value={data.receivedDate} />
              <div style={styles.signatureLine}>Signature:</div>
              <div style={styles.signatureBox} />
            </div>
          </div>

          <div style={styles.block}>
            <div style={styles.blockHeader}>AUTHORIZED SIGNATURE</div>
            <div style={styles.blockBody}>
              <Field label="Name" value={data.approvedBy} />
              <div style={styles.signatureLine}>Signature:</div>
              <div style={styles.signatureBox} />
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS - Outside printRef so they don't appear in print */}
      <div className="no-print" style={styles.actions}>
        <button style={styles.btn} onClick={handlePrint}>
          🖨️ Print / Save as PDF
        </button>
        {onClose && (
          <button style={{ ...styles.btn, marginLeft: 10, background: '#f3f4f6' }} onClick={onClose}>
            ✕ Close
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={styles.fieldRow}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.fieldValue}>{value || ""}</div>
    </div>
  );
}

function CheckboxField({ label, checked }) {
  return (
    <div style={styles.fieldRow}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.fieldValue}>
        <span style={{
          display: 'inline-block',
          width: 16,
          height: 16,
          border: '2px solid #333',
          marginRight: 6,
          textAlign: 'center',
          lineHeight: '12px',
          fontSize: 12,
          fontWeight: 'bold',
        }}>
          {checked ? '✓' : ''}
        </span>
      </div>
    </div>
  );
}

const printCss = `
@media print {
  .no-print { display: none !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 10mm; }
}
`;

const styles = {
  page: {
    background: "#f2f2f2",
    padding: 16,
    fontFamily: "Arial, sans-serif",
  },
  sheet: {
    width: "210mm",
    minHeight: "297mm",
    margin: "0 auto",
    background: "#fff",
    padding: 14,
    border: "1px solid #ccc",
  },

  header: { display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, marginBottom: 10 },
  logoBox: { height: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 4 },
  logoPlaceholder: { fontWeight: 700, fontSize: 14 },

  titleBox: { padding: 10, position: "relative" },
  title: { fontSize: 22, fontWeight: 800, letterSpacing: 1, textAlign: "center" },

  metaGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 },
  metaRow: { display: "grid", gridTemplateColumns: "90px 1fr" },
  metaLabel: { padding: "6px 8px", fontWeight: 700 },
  metaValue: { padding: "6px 8px" },

  approvalStrip: {
    position: "absolute",
    bottom: 8,
    right: 10,
    fontSize: 11,
    padding: "3px 6px",
    border: "1px solid #000",
    background: "#fff",
  },
  approvalText: { fontWeight: 700 },

  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 },
  threeCol: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 },

  block: {},
  blockHeader: { padding: "6px 8px", fontWeight: 800, borderBottom: "1px solid #ccc" },
  blockBody: { padding: 8 },

  fieldRow: { display: "grid", gridTemplateColumns: "120px 1fr", marginBottom: 6 },
  fieldLabel: { fontWeight: 700, fontSize: 12 },
  fieldValue: { fontSize: 12, borderBottom: "1px solid #bbb", paddingBottom: 2 },

  companyName: { fontWeight: 900, fontSize: 14, marginBottom: 6 },
  smallText: { fontSize: 11, marginTop: 3, lineHeight: 1.2 },

  section: { marginTop: 10 },
  sectionHeader: { padding: "6px 8px", fontWeight: 900, borderBottom: "1px solid #ccc" },

  table: { width: "100%", borderCollapse: "collapse" },
  th: { border: "1px solid #000", padding: 8, fontSize: 12, textAlign: "left", background: "#f7f7f7" },
  td: { border: "1px solid #000", padding: 8, fontSize: 12, verticalAlign: "top" },
  tdCenter: { border: "1px solid #000", padding: 8, fontSize: 12, textAlign: "center", verticalAlign: "top" },

  noteText: { fontSize: 12, whiteSpace: "pre-wrap" },

  declaration: {
    marginTop: 10,
    border: "2px solid #000",
    padding: 10,
    fontSize: 12,
    lineHeight: 1.35,
  },
  declLine: { marginBottom: 4 },
  declLineStrong: { marginTop: 6, fontWeight: 800 },

  signatureLine: { fontSize: 12, fontWeight: 700, marginTop: 10 },
  signatureBox: { height: 50, border: "1px solid #000", marginTop: 6 },

  actions: { display: "flex", justifyContent: "flex-end", marginTop: 10 },
  btn: {
    border: "2px solid #000",
    padding: "8px 12px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
};
