import type { Round } from '../types';

// @ts-ignore
const XLSX = window.XLSX;

export const exportToXlsx = (rounds: Round[]) => {
    const worksheetData = rounds.flatMap(round =>
        round.items.map(item => ({
            'Round ID': round.id,
            'Round Name': round.name,
            'Timestamp': new Date(round.timestamp).toLocaleString(),
            'Period From': round.period.from,
            'Period To': round.period.to,
            'Equipment': item.name,
            'Category': item.category,
            'Quantity': item.quantity,
            'Active Hours (per unit)': item.hours,
            'Idle Hours (per unit)': item.idleHours,
            'Estimated Fuel (Liters)': item.fuel != null ? item.fuel * item.quantity : 'N/A',
            'AI Justification': round.aiJustification || 'N/A',
        }))
    );
    
    if (worksheetData.length === 0) {
        alert("No data to export.");
        return;
    }

    const totalFuel = rounds.reduce((sum, round) => sum + round.totalFuel, 0);
    // FIX: Cast summary row to `any` to avoid type mismatch errors.
    // The summary row intentionally uses strings in columns inferred as numbers.
    worksheetData.push({
        'Round ID': '',
        'Round Name': '',
        'Timestamp': '',
        'Period From': '',
        'Period To': '',
        'Equipment': '',
        'Category': '',
        'Quantity': '',
        'Active Hours (per unit)': '',
        'Idle Hours (per unit)': 'TOTAL FUEL',
        'Estimated Fuel (Liters)': totalFuel.toFixed(2),
        'AI Justification': '',
    } as any);

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fuel Consumption Report');
    XLSX.writeFile(workbook, 'FuelConsumptionReport.xlsx');
};

export const exportToHtml = (rounds: Round[]) => {
    if (rounds.length === 0) {
        alert("No data to export.");
        return;
    }

    const totalFuel = rounds.reduce((sum, round) => sum + round.totalFuel, 0);

    let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Fuel Consumption Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f9; color: #333; }
                h1, h2, h3 { color: #1a202c; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4A5568; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                .round-header { background-color: #2D3748; color: white; padding: 10px; margin-top: 20px; border-radius: 5px; }
                .round-header h2 { margin-top: 0; }
                .round-header p { margin: 4px 0; }
                .total-footer { font-weight: bold; font-size: 1.2em; text-align: right; padding: 15px; background-color: #e2e8f0; margin-top: 20px; }
                .ai-justification { margin-top: 8px; padding: 8px; background-color: rgba(255, 255, 255, 0.1); border-left: 3px solid #4fd1c5; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <h1>Fuel Consumption Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
    `;

    rounds.forEach(round => {
        html += `
            <div class="round-header">
                <h2>Round: ${round.name}</h2>
                <p><strong>ID:</strong> ${round.id}</p>
                <p><strong>Timestamp:</strong> ${new Date(round.timestamp).toLocaleString()}</p>
                <p><strong>Period:</strong> ${round.period.from} to ${round.period.to}</p>
                <p><strong>Total Fuel for Round: ${round.totalFuel.toFixed(2)} Liters</strong></p>
                ${round.aiJustification ? `<div class="ai-justification"><strong>AI Reasoning:</strong> <em>${round.aiJustification}</em></div>` : ''}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Equipment</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Active Hours (per unit)</th>
                        <th>Idle Hours (per unit)</th>
                        <th>Estimated Fuel (Liters)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        round.items.forEach(item => {
            html += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>${item.hours}</td>
                    <td>${item.idleHours}</td>
                    <td>${item.fuel != null ? (item.fuel * item.quantity).toFixed(2) : 'N/A'}</td>
                </tr>
            `;
        });
        html += `
                </tbody>
            </table>
        `;
    });

    html += `
        <div class="total-footer">
            Grand Total Fuel Consumption: ${totalFuel.toFixed(2)} Liters
        </div>
        </body>
        </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'FuelConsumptionReport.html';
    a.click();
    URL.revokeObjectURL(a.href);
};