// frontend/src/pages/AdminSMS.jsx
import { useState, useEffect } from 'react';
import { Card, Table, Button, Chip } from '@material-ui/core';

function AdminSMS() {
    const [smsLogs, setSmsLogs] = useState([]);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        fetchSmsLogs();
        fetchBalance();
    }, []);

    const fetchSmsLogs = async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/admin/sms-logs`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setSmsLogs(response.data);
    };

    const fetchBalance = async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/admin/sms-balance`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setBalance(response.data.balance);
    };

    const sendTestSMS = async () => {
        const phone = prompt('Enter phone number:');
        if (phone) {
            const token = localStorage.getItem('token');
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/admin/sms-test`,
                { phone, message: 'Test SMS from Hostel Finder!' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Test SMS sent!');
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">📱 SMS Management</h2>
                <div className="flex items-center space-x-4">
                    <Chip 
                        label={`Balance: GHS ${balance}`} 
                        color={balance < 10 ? 'secondary' : 'primary'}
                    />
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={sendTestSMS}
                    >
                        Send Test SMS
                    </Button>
                </div>
            </div>

            <Card className="p-4">
                <Table>
                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>Recipient</th>
                            <th>Message</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {smsLogs.map(log => (
                            <tr key={log.id}>
                                <td>#{log.booking_id}</td>
                                <td>{log.recipient_phone}</td>
                                <td className="max-w-xs truncate">
                                    {log.message}
                                </td>
                                <td>
                                    <Chip 
                                        label={log.status}
                                        color={log.status === 'sent' ? 'success' : 'error'}
                                        size="small"
                                    />
                                </td>
                                <td>{new Date(log.sent_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>

            <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold">📊 SMS Statistics</h4>
                <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>Total Sent: 1,234</div>
                    <div>Delivered: 1,200</div>
                    <div>Failed: 34</div>
                </div>
            </div>
        </div>
    );
}