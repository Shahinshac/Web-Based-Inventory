export interface Invoice {
    id: number;
    amount: number;
    date: string;
    customerId: number;
    status: 'paid' | 'unpaid' | 'pending';
}

export interface Customer {
    id: number;
    name: string;
    phoneNumber: string;
    email: string;
}