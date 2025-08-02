const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Configurar transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Configuración para producción (ejemplo con Gmail)
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Plantillas de email
const emailTemplates = {
  welcome: {
    subject: '¡Bienvenido a PropFinder!',
    template: 'welcome.html',
  },
  passwordReset: {
    subject: 'Restablecer Contraseña - PropFinder',
    template: 'password-reset.html',
  },
  emailVerification: {
    subject: 'Verificar Email - PropFinder',
    template: 'email-verification.html',
  },
  propertyContact: {
    subject: 'Nuevo Contacto - PropFinder',
    template: 'property-contact.html',
  },
  visitConfirmation: {
    subject: 'Visita Confirmada - PropFinder',
    template: 'visit-confirmation.html',
  },
  paymentConfirmation: {
    subject: 'Pago Confirmado - PropFinder',
    template: 'payment-confirmation.html',
  },
};

// Cargar plantilla HTML
const loadTemplate = async (templateName) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', templateName);
    const template = await fs.readFile(templatePath, 'utf8');
    return template;
  } catch (error) {
    console.error(`Error cargando plantilla ${templateName}:`, error);
    return null;
  }
};

// Reemplazar variables en plantilla
const replaceVariables = (template, variables) => {
  let result = template;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key]);
  });
  return result;
};

// Enviar email
const sendEmail = async (to, templateType, variables = {}) => {
  try {
    const transporter = createTransporter();
    const templateConfig = emailTemplates[templateType];
    if (!templateConfig) {
      throw new Error(`Template ${templateType} no encontrado`);
    }

    const template = await loadTemplate(templateConfig.template);
    if (!template) {
      throw new Error(`No se pudo cargar la plantilla ${templateConfig.template}`);
    }

    const htmlContent = replaceVariables(template, variables);
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@propfinder.com',
      to,
      subject: templateConfig.subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
};

// Funciones específicas de email
const sendWelcomeEmail = async (user) => {
  const variables = {
    name: user.name,
    email: user.email,
    loginUrl: `${process.env.FRONTEND_URL}/login`,
  };
  return sendEmail(user.email, 'welcome', variables);
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const variables = {
    name: user.name,
    resetUrl,
    expiryHours: 24,
  };
  return sendEmail(user.email, 'passwordReset', variables);
};

const sendEmailVerification = async (user, verificationToken) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const variables = {
    name: user.name,
    verifyUrl,
    email: user.email,
  };
  return sendEmail(user.email, 'emailVerification', variables);
};

const sendPropertyContactEmail = async (agent, property, contact) => {
  const variables = {
    agentName: agent.name,
    propertyTitle: property.title,
    propertyAddress: property.address,
    contactName: contact.name,
    contactEmail: contact.email,
    contactPhone: contact.phone,
    message: contact.message,
    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
  };
  return sendEmail(agent.email, 'propertyContact', variables);
};

const sendVisitConfirmationEmail = async (user, visit, property) => {
  const variables = {
    userName: user.name,
    propertyTitle: property.title,
    propertyAddress: property.address,
    visitDate: new Date(visit.visit_date).toLocaleDateString('es-ES'),
    visitTime: new Date(visit.visit_date).toLocaleTimeString('es-ES'),
    agentName: visit.agent_name,
    agentPhone: visit.agent_phone,
    notes: visit.notes || 'Sin notas adicionales',
  };
  return sendEmail(user.email, 'visitConfirmation', variables);
};

const sendPaymentConfirmationEmail = async (user, payment, property) => {
  const variables = {
    userName: user.name,
    amount: payment.amount,
    currency: payment.currency,
    paymentMethod: payment.payment_method,
    propertyTitle: property?.title || 'Servicio general',
    transactionId: payment.stripe_payment_intent_id || payment.paypal_payment_id,
    date: new Date(payment.created_at).toLocaleDateString('es-ES'),
  };
  return sendEmail(user.email, 'paymentConfirmation', variables);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
  sendPropertyContactEmail,
  sendVisitConfirmationEmail,
  sendPaymentConfirmationEmail,
};
