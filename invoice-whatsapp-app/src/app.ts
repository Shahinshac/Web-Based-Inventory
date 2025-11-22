import express, { Request, Response } from 'express';
import { Invoice, Customer } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Sample company + data for invoices and customers
const companyInfo = { name: 'Acme Supplies', phone: '+91-98765-43210', address: '123, Demo Street, Mumbai' };

const invoices: Invoice[] = [
    { id: 1, amount: 100, customerId: 1, date: '2025-11-01', status: 'pending', items: [{ name: 'Pen', qty: 2, rate: 10 }, { name: 'Notebook', qty: 1, rate: 80 }] },
    { id: 2, amount: 200, customerId: 2, date: '2025-11-02', status: 'paid', items: [{ name: 'Pack of pencils', qty: 4, rate: 20 }] },
];

const customers: Customer[] = [
    { id: 1, name: 'John Doe', phoneNumber: '+1234567890', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', phoneNumber: '+0987654321', email: 'jane@example.com' },
];

// Function to generate default message
const generateDefaultMessage = (invoice: Invoice, customer: Customer): string => {
    const items = invoice.items || [];
    const summary = items.slice(0, 3).map(it => `${it.name} x${it.qty} @ $${it.rate}`).join(', ');
    const more = items.length > 3 ? ` (and ${items.length - 3} more)` : '';

    return `Hi ${customer.name},\n\n${companyInfo.name} has generated an invoice for you.\nInvoice: ${invoice.id}\nDate: ${invoice.date}\nItems: ${summary}${more}\nTotal: $${invoice.amount}\nStatus: ${invoice.status}\n\nYou can view/print the bill at: http://localhost:3000/invoices\n\nThanks, ${companyInfo.name}`;
};

// Endpoint to render invoices and WhatsApp button
app.get('/invoices', (req: Request, res: Response) => {
    res.send(`
        <h1>Invoices</h1>
        <ul>
            ${invoices.map(invoice => `
                <li>
                    Invoice ID: ${invoice.id} - Amount: $${invoice.amount}
                    <button onclick="sendWhatsApp(${invoice.id})">Send via WhatsApp</button>
                </li>
            `).join('')}
        </ul>
        <script>
            function sendWhatsApp(invoiceId) {
                // Use fresh copies of the invoices/customers/company arrays so we avoid any stale values
                const invoicesArr = ${JSON.stringify(invoices)};
                const customersArr = ${JSON.stringify(customers)};
                const company = ${JSON.stringify(companyInfo)};
                const invoice = invoicesArr.find(inv => inv.id === invoiceId);
                const customer = customersArr.find(cust => cust.id === invoice.customerId);

                // Generate the message at click-time so the time/timestamp is fresh for each send
                const now = new Date();
                // Use a readable local timestamp — change to toISOString() if you prefer ISO format
                const timestamp = now.toLocaleString();

                const itemsArr = invoice.items || [];
                const short = itemsArr.slice(0, 3).map(it => it.name + ' x' + it.qty + ' @ $' + it.rate).join(', ');
                const moreNote = itemsArr.length > 3 ? ' (+' + (itemsArr.length - 3) + ' more)' : '';

                const messageLines = [
                    company.name + ' - Invoice',
                    '',
                    'Hello ' + customer.name + ',',
                    '',
                    'Invoice: ' + invoice.id,
                    'Date: ' + (invoice.date || timestamp),
                    'Status: ' + (invoice.status || 'unknown'),
                    'Items: ' + (short || '—') + moreNote,
                    'Total: $' + invoice.amount,
                    '',
                    'View/print: http://localhost:3000/invoices',
                    'Sent at: ' + timestamp,
                    '',
                    'Thanks — ' + company.name
                ];

                const message = messageLines.join('\n');
                const whatsappUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(message);
                window.open(whatsappUrl, '_blank');
            }
        </script>
    `);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});