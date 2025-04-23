import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import expressHandlebars from 'nodemailer-express-handlebars';
import path from 'path';
import fs from 'fs';

const OAuth2 = google.auth.OAuth2;

function isTokenExpired(token: any) {
  let currentTimestamp = Date.now();
  return currentTimestamp >= token.expiry_date;
}

const saveTokens = (tokens: any) => {
  const token_data = {
    access_token: tokens?.access_token,
    refresh_token: tokens?.refresh_token || process.env.REFRESH_TOKEN,
    expiry_date: tokens?.expiry_date,
  };

  fs.writeFileSync('tokens.json', JSON.stringify(token_data));
};

const loadTokens = () => {
  if (fs.existsSync('tokens.json')) {
    const token_data = fs.readFileSync('tokens.json');
    return JSON.parse(token_data as unknown as string);
  }
  return null;
};

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const OAuth2Client = new OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  OAuth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const tokens = await OAuth2Client.refreshAccessToken();
    OAuth2Client.setCredentials(tokens.credentials);

    saveTokens(tokens.credentials);

    return tokens.credentials.access_token;
  } catch (error) {
    console.log(`Error ocurred while refreshing access token : ${error}`);
  }
}

const createTransporter = async () => {
  const tokens = loadTokens();

  const OAuth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  OAuth2Client.setCredentials({
    access_token: tokens ? tokens?.access_token : process.env.ACCESS_TOKEN,
    refresh_token: tokens ? tokens?.refresh_token : process.env.REFRESH_TOKEN,
    token_type: 'Bearer',
    expiry_date: tokens ? tokens?.expiry_date : process.env.EXPIRY_DATE,
  });

  OAuth2Client.generateAuthUrl({
    scope: process.env.SCOPES,
    include_granted_scopes: true,
  });

  if (isTokenExpired(OAuth2Client.credentials)) {
    console.log('Access token expired Refreshing...');

    await refreshAccessToken(
      OAuth2Client.credentials.refresh_token as string,
      process.env.CLIENT_ID as string,
      process.env.CLIENT_SECRET as string
    );
  }

  return nodemailer.createTransport({
    // @ts-ignore
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL,
      pass: process.env.EMAIL_HOST_PASSWORD,
      accessToken: OAuth2Client.credentials.access_token,
      refreshToken: OAuth2Client.credentials.refresh_token,
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
