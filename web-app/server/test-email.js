#!/usr/bin/env node

// Quick Email Configuration Test
// Run: node test-email.js

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📧 EMAIL CONFIGURATION TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Environment Variables:');
console.log('  EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? `✅ SET (${process.env.EMAIL_PASSWORD.length} chars)` : '❌ NOT SET');
console.log('  First 4 chars:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.substring(0, 4) + '****' : 'N/A');
console.log('  Has spaces?', process.env.EMAIL_PASSWORD ? (process.env.EMAIL_PASSWORD.includes(' ') ? '⚠️ YES (REMOVE THEM!)' : '✅ NO') : 'N/A');
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ EMAIL_USER or EMAIL_PASSWORD not set in .env file!');
  process.exit(1);
}

console.log('Creating email transporter...');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

console.log('Testing connection to Gmail SMTP...\n');

transporter.verify(function(error, success) {
  if (error) {
    console.error('❌❌❌ CONNECTION FAILED ❌❌❌');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('\n💡 SOLUTION:');
    console.error('1. Your Gmail App Password is WRONG or EXPIRED');
    console.error('2. Go to: https://myaccount.google.com/apppasswords');
    console.error('3. Delete old password and generate NEW one');
    console.error('4. Update EMAIL_PASSWORD in .env (NO SPACES!)');
    console.error('5. Run this test again');
    process.exit(1);
  } else {
    console.log('✅✅✅ CONNECTION SUCCESSFUL! ✅✅✅');
    console.log('Gmail SMTP server is ready to send emails');
    console.log(`From: ${process.env.EMAIL_USER}`);
    
    // Send test email
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Sending test email...');
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '✅ Test Email - 26:07 Electronics OTP System',
      html: `
        <h2>✅ Success!</h2>
        <p>Your email configuration is working correctly.</p>
        <p>OTP emails will now be delivered successfully.</p>
        <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Test email failed:', error.message);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log(`\nCheck your inbox: ${process.env.EMAIL_USER}`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  }
});
