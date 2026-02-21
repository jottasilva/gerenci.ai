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
