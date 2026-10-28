// CRM configuration. Nothing secret lives here: the CRM key is entered in Settings (or arrives in the screen-pop link).
window.CRM_CONFIG = {
  apiUrl: "https://bleybpoyrdbmqsfyylcj.supabase.co/functions/v1/crm-api",
  defaultVertical: "telecom",
  // Add a vertical here when its handlers exist on the platform (grab, airline, retail ...).
  verticals: {
    telecom: { label: "ACME Telecom", logo: "../assets/acme-telecom-logo.png", currency: "SGD" }
  }
};
