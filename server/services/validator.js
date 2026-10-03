import dns from 'dns';
import { promisify } from 'util';
import net from 'net';

const resolveMx = promisify(dns.resolveMx);

export async function validateEmail(email) {
  if (!email || !email.includes('@')) return { valid: false, reason: 'Invalid format' };

  const domain = email.split('@')[1];

  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: 'No MX records' };
    }

    const mx = mxRecords.sort((a, b) => a.priority - b.priority)[0];
    const smtpValid = await checkSmtp(mx.exchange, email);

    return {
      valid: smtpValid,
      reason: smtpValid ? 'Valid' : 'SMTP rejected',
      mx: mx.exchange,
    };
  } catch {
    return { valid: false, reason: 'DNS lookup failed' };
  }
}

function checkSmtp(mxHost, email) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let step = 0;

    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 10000);

    socket.connect(25, mxHost, () => {});

    socket.on('data', (data) => {
      const response = data.toString();

      if (step === 0 && response.startsWith('220')) {
        socket.write(`EHLO verify.local\r\n`);
        step = 1;
      } else if (step === 1 && response.startsWith('250')) {
        socket.write(`MAIL FROM:<verify@verify.local>\r\n`);
        step = 2;
      } else if (step === 2 && response.startsWith('250')) {
        socket.write(`RCPT TO:<${email}>\r\n`);
        step = 3;
      } else if (step === 3) {
        socket.write('QUIT\r\n');
        clearTimeout(timeout);
        socket.destroy();
        resolve(response.startsWith('250'));
      }
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

export function validatePhone(phone) {
  if (!phone) return { valid: false, reason: 'Empty' };
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  const valid = /^\+?\d{8,15}$/.test(cleaned);
  return { valid, cleaned, reason: valid ? 'Valid format' : 'Invalid format' };
}
