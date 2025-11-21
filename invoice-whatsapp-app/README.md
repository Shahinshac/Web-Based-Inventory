# Invoice WhatsApp App

This project is a web application that allows users to send invoice bills to customers via WhatsApp. It features a user-friendly interface with an invoices tab and a WhatsApp button for easy communication.

## Project Structure

```
invoice-whatsapp-app
├── src
│   ├── app.ts          # Main entry point of the application
│   └── types
│       └── index.ts    # Type definitions for Invoice and Customer
├── package.json        # npm configuration file
├── tsconfig.json       # TypeScript configuration file
└── README.md           # Project documentation
```

## Features

- Display invoices in a user-friendly tab.
- Send invoices to customers via WhatsApp with a default message.
- Type safety through TypeScript interfaces.

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd invoice-whatsapp-app
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Run the application:**
   ```
   npm start
   ```

4. **Access the application:**
   Open your web browser and navigate to `http://localhost:3000` (or the port specified in your app).

## Usage Guidelines

- Navigate to the invoices tab to view all available invoices.
- Click the WhatsApp button next to an invoice to send it to the respective customer.
- Ensure that you have the necessary permissions and WhatsApp integration set up to send messages.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.