import cron from 'node-cron';
import Salon from '../models/salonSchema.js';
import { sendEmail } from '../utils/mailer.js';

cron.schedule('* * * * *', async () => {
  try {
    console.log('🕐 Queue notifier running...');
    const salons = await Salon.find();
    console.log(`📊 Found ${salons.length} salons to check`);

    for (const salon of salons) {
      // Skip if salon lacks valid location to avoid unintended validation saves
      if (
        !salon.location ||
        !salon.location.type ||
        !Array.isArray(salon.location.coordinates)
      ) {
        console.log(`⚠️ Skipping salon ${salon.name} - invalid location data`);
        continue;
      }

      console.log(
        `🏪 Checking salon: ${salon.name} (${salon.queue.length} in queue)`
      );
      let changed = false;

      salon.queue.forEach((customer, index) => {
        if (!customer.notified && index === 0) {
          console.log(
            `🔔 Customer ${customer.customerName} is next in line at ${salon.name}`
          );
          const subject = `You're next at ${salon.name}`;
          const text = `Hi ${
            customer.customerName || ''
          },\n\nYour turn is coming up next for ${customer.service} at ${
            salon.name
          }. Please reach the salon.\n\nAddress: ${salon.address}\nContact: ${
            salon.contact
          }`;
          const html = `<p>Hi ${
            customer.customerName || ''
          },</p><p>Your turn is coming up next for <b>${
            customer.service
          }</b> at <b>${
            salon.name
          }</b>. Please reach the salon.</p><p><b>Address:</b> ${
            salon.address
          }<br/><b>Contact:</b> ${salon.contact}</p>`;

          if (customer.customerEmail) {
            console.log(
              `📧 Attempting to send email to: ${customer.customerEmail}`
            );
            sendEmail({
              to: customer.customerEmail,
              subject,
              text,
              html,
            }).catch((err) => {
              console.error(
                `❌ Email failed for ${customer.customerEmail}:`,
                err.message
              );
            });
          } else {
            console.log(
              `⚠️ No email address for customer ${customer.customerName}`
            );
          }

          console.log(`✅ Marking ${customer.customerName} as notified`);
          customer.notified = true;
          changed = true;
        }
      });

      if (changed) {
        try {
          await salon.save();
          console.log(
            `💾 Saved salon ${salon.name} with updated notifications`
          );
        } catch (saveErr) {
          console.error(
            'Failed to save salon during notification tick:',
            saveErr.message
          );
        }
      }
    }
    console.log('✅ Queue notifier completed');
  } catch (err) {
    console.error('Queue notifier error:', err.message);
  }
});
