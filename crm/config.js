// CRM configuration. Nothing secret lives here: the CRM key is entered in Settings (or arrives in the screen-pop link).
window.CRM_CONFIG = {
  apiUrl: "https://bleybpoyrdbmqsfyylcj.supabase.co/functions/v1/crm-api",
  defaultVertical: "telecom",
  // Add a vertical here when its handlers exist on the platform (grab, airline, retail ...).
  verticals: {
    telecom: {
      label: "ACME Telecom", logo: "../assets/acme-telecom-logo.png", currency: "SGD",
      // Proactive WhatsApp: preview shown to the agent before sending ({name} = first name).
      // The real message is built by the Connect flow Telecom_Proactive_Notification; keep these in step with it.
      proactive: {
        Notification: "Roaming alert\nHello {name}, your mobile line has just connected to a network overseas. Data roaming is charged at pay-per-use rates.\nButtons: Yes (keep data roaming on) / No (turn it off)",
        Offer: "Roaming Asia 10-day pack\nHello {name}, since you often travel overseas: 4 GB of data for S$22, no pay-per-use roaming charges, easy to add in the ACME Telecom app.\nButtons: Learn More / Interested / Maybe later",
        Reminder: "Offer reminder\nHi {name}! Just checking in: the Roaming Asia 10-day pack (4 GB for S$22) is still available.\nButtons: Learn more / Interested / Maybe later",
      },
    },
  },
};
