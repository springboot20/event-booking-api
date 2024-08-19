import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import expressHandlebars from 'nodemailer-express-handlebars';
import path from 'path';

const OAuth2 = google.auth.OAuth2;

function isTokenExpired(token: any) {
  let currentTimestamp = Math.floor(Date.now() / 1000);
  return currentTimestamp >= token.expiry_date;
}

async function refreshAccessToken(auth: any) {
  try {
    const { tokens } = await auth.refreshAccessToken();
    auth.setCredentials(tokens);

    return tokens.access_token;
  } catch (error) {
    console.log(`Error ocurred while refreshing access token : ${error}`);
  }
}

const createTransporter = async () => {
  const OAuth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  if (isTokenExpired(OAuth2Client.credentials)) {
    let refreshedAccessToken = await refreshAccessToken(OAuth2Client);

    if (refreshedAccessToken) {
      OAuth2Client.setCredentials({
        access_token: refreshedAccessToken,
        refresh_token: process.env.REFRESH_TOKEN,
        token_type: 'Bearer',
        expiry_date: OAuth2Client.credentials.expiry_date,
      });
    } else {
      console.error('Failed to refresh access token');
      return null;
    }
  }

  return nodemailer.createTransport({
    // @ts-ignore
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL,
      pass: process.env.EMAIL_HOST_PASSWORD,
      accessToken: OAuth2Client.credentials.access_token,
      refreshToken: process.env.REFRESH_TOKEN,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    },
    tls: {
      rejectUnauthorized: false, // This line bypasses SSL certificate verification
    },
  }) as any;
};

const sendMail = async (email: string, subject: string, payload: any, template: string) => {
  try {
    const transporter = await createTransporter();

    transporter.use(
      'compile',
      expressHandlebars({
        viewEngine: {
          extname: '.hbs',
          partialsDir: path.resolve(__dirname, '../views/partials/'),
          layoutsDir: path.resolve(__dirname, '../views/layouts/'),
          defaultLayout: 'layout',
        },
        extName: '.hbs',
        viewPath: path.resolve(__dirname, '../views/partials/'),
      })
    );

    const options = () => {
      return {
        from: process.env.EMAIL,
        to: email,
        subject,
        template: template,
        context: payload,
      };
    };
    const info = await transporter.sendMail(options());

    console.log('Message Id : %s' + info.messageId);
  } catch (error) {
    console.log(`${error}`);
  }
};

export { sendMail };
