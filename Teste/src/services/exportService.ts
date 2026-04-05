import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Movement } from '../types';

export const exportToCSV = (products: Product[]) => {
  const headers = ['ID', 'Nome', 'Categoria', 'Estoque', 'Unidade', 'Preço de Custo', 'Estoque Mínimo', 'Status'];
  const rows = products.map(p => [
    p.id,
    p.name,
    p.category,
    p.quantity,
    p.unit,
    p.cost_price,
    p.min_quantity ?? '-',
    (p.min_quantity !== null && p.quantity <= p.min_quantity) ? 'Estoque Baixo' : 'Normal'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `estoque_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (products: Product[], selectedFields: string[], includeTotalValue: boolean) => {
  const doc = new jsPDF();
  
  const fieldLabels: Record<string, string> = {
    id: 'ID',
    name: 'Nome',
    category: 'Categoria',
    quantity: 'Estoque',
    unit: 'Unidade',
    cost_price: 'V. Unitário',
    min_quantity: 'Mínimo',
    status: 'Status',
    total_value: 'V. Total'
  };

  const activeFields = [...selectedFields];
  if (includeTotalValue && !activeFields.includes('total_value')) {
    activeFields.push('total_value');
  }

  const tableColumn = activeFields.map(field => fieldLabels[field] || field);
  
  const tableRows = products.map(p => {
    return activeFields.map(field => {
      if (field === 'cost_price') return `R$ ${p.cost_price.toFixed(2)}`;
      if (field === 'total_value') return `R$ ${(p.quantity * p.cost_price).toFixed(2)}`;
      if (field === 'min_quantity') return p.min_quantity ?? '-';
      if (field === 'status') return (p.min_quantity !== null && p.quantity <= p.min_quantity) ? 'Estoque Baixo' : 'Normal';
      return (p as any)[field] ?? '-';
    });
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 25,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255] },
  });

  doc.setFontSize(14);
  doc.text('Relatório de Estoque', 14, 15);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 21);
  
  doc.save(`estoque_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportMovementsToPDF = (movements: Movement[]) => {
  const doc = new jsPDF();
  const tableColumn = ['Data', 'Tipo', 'Produto', 'Qtd', 'Origem/Destino', 'Doc/Motivo'];
  const tableRows = movements.map(m => {
    const date = new Date(m.date).toLocaleString('pt-BR');
    const type = m.type === 'IN' ? 'ENTRADA' : 'SAÍDA';
    const origin = m.type === 'IN' ? (m.supplier_name || m.location) : m.destination;
    const docVal = m.type === 'IN' ? m.doc_number : m.reason;
    return [date, type, m.product_name, m.quantity, origin, docVal];
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255] },
  });

  doc.text('Relatório de Movimentações de Estoque', 14, 15);
  doc.save(`movimentacoes_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportMovementsToCSV = (movements: Movement[]) => {
  const headers = "Data,Tipo,Produto,Quantidade,Origem/Destino,Documento/Motivo\n";
  const rows = movements.map(m => {
    const date = new Date(m.date).toLocaleString('pt-BR');
    const type = m.type === 'IN' ? 'ENTRADA' : 'SAÍDA';
    const origin = m.type === 'IN' ? (m.supplier_name || m.location) : m.destination;
    const doc = m.type === 'IN' ? m.doc_number : m.reason;
    return `"${date}","${type}","${m.product_name}","${m.quantity}","${origin}","${doc}"`;
  }).join("\n");
  
  const csvContent = headers + rows;
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `movimentacoes_estoque_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportGenericToCSV = (data: any[], columns: { key: string, label: string }[], filename: string) => {
  const headers = columns.map(col => col.label);
  const rows = data.map(item => columns.map(col => item[col.key] ?? '-'));

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportGenericToPDF = (data: any[], columns: { key: string, label: string }[], title: string, filename: string) => {
  const doc = new jsPDF();
  const tableColumn = columns.map(col => col.label);
  const tableRows = data.map(item => columns.map(col => item[col.key] ?? '-'));

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 25,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255] },
  });

  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 21);
  
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};
