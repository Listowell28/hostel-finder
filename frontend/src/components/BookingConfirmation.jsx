// frontend/src/components/BookingConfirmation.jsx
import { useState } from 'react';
import { Button, Dialog, Typography } from '@material-ui/core';
import { CheckCircle } from '@material-ui/icons';

function BookingConfirmation({ booking, hostel, onClose }) {
    const [smsSent, setSmsSent] = useState(false);

    const sendTestSMS = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/sms/test`,
                {
                    phone: booking.user_phone,
                    message: `Test SMS from Hostel Finder! Your booking #${booking.id} is confirmed.`
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSmsSent(true);
                alert('SMS sent successfully!');
            }
        } catch (error) {
            alert('Failed to send SMS');
        }
    };

    return (
        <Dialog open={true} onClose={onClose}>
            <div className="p-8 text-center">
                <CheckCircle className="text-green-500 text-6xl mb-4" />
                <Typography variant="h5" className="mb-2">
                    Booking Confirmed! 🎉
                </Typography>
                <Typography className="text-gray-600 mb-4">
                    Your booking has been confirmed. An SMS has been sent to your phone.
                </Typography>
                <Typography className="text-sm text-gray-500">
                    📱 Check your phone for confirmation
                </Typography>
                <Button
                    variant="outlined"
                    onClick={sendTestSMS}
                    className="mt-4"
                >
                    Resend SMS
                </Button>
            </div>
        </Dialog>
    );
}