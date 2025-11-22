import express, { Request, Response } from 'express';
import { Invoice, Customer } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Sample data for invoices and customers
const invoices: Invoice[] = [
    { id: 1, amount: 100, customerId: 1, date: '2025-11-01', status: 'pending' },
    { id: 2, amount: 200, customerId: 2, date: '2025-11-02', status: 'paid' },
];

const customers: Customer[] = [
    { id: 1, name: 'John Doe', phoneNumber: '+1234567890', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', phoneNumber: '+0987654321', email: 'jane@example.com' },
];

// Function to generate default message
const generateDefaultMessage = (invoice: Invoice, customer: Customer): string => {
    return `Hello ${customer.name},\n\nYour invoice of amount $${invoice.amount} is ready. Thank you!`;
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
                const invoice = ${JSON.stringify(invoices)}.find(inv => inv.id === invoiceId);
                const customer = ${JSON.stringify(customers)}.find(cust => cust.id === invoice.customerId);
                // build message on the client side using the invoice & customer objects
                const message = "Hello " + customer.name + ",\n\nYour invoice of amount $" + invoice.amount + " is ready. Thank you!";
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