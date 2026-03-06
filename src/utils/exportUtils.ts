import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Utility to export data to CSV
 */
export const exportToCSV = (filename: string, data: any[], headers?: string[]) => {
    if (!data || !data.length) return;

    const separator = ';';
    const keys = Object.keys(data[0]);

    const csvContent = [
        // Headers
        (headers || keys).join(separator),
        // Rows
        ...data.map(row =>
            keys.map(key => {
                const val = row[key] === null || row[key] === undefined ? '' : row[key];
                // Escape quotes and handle strings with separators
                const strVal = String(val).replace(/"/g, '""');
                return strVal.includes(separator) || strVal.includes('"') || strVal.includes('\n')
                    ? `"${strVal}"`
                    : strVal;
            }).join(separator)
        )
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Utility to export data to PDF with multiple sections
 */
export const exportToPDF = (filename: string, sections: { title: string; data: any[]; headers: string[]; keys: string[] }[]) => {
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    sections.forEach((section, index) => {
        if (index > 0) doc.addPage();

        // Header - Dark background style
        doc.setFillColor(3, 3, 3);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("GERENC.AI", 20, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("GESTÃO NA PALMA DA MÃO", 20, 32);

        doc.setFontSize(14);
        doc.text(section.title.toUpperCase(), pageWidth - 20, 27, { align: 'right' });

        // Content
        const tableBody = section.data.map(item => section.keys.map(key => item[key] || ''));

        autoTable(doc, {
            startY: 50,
            head: [section.headers],
            body: tableBody,
            theme: 'striped',
            headStyles: {
                fillColor: [16, 185, 129], // primary emerald color
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [51, 51, 51]
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: 50, bottom: 20 },
            didDrawPage: (data: any) => {
                // Footer
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(8);
                const str = "Página " + doc.internal.getNumberOfPages();
                doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
                doc.text(new Date().toLocaleString(), 20, pageHeight - 10);
                doc.text("desenvolvido por JRSN.SPACE", pageWidth - 20, pageHeight - 10, { align: 'right' });
            }
        });
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};
