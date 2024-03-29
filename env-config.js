const {
  ISSUER_BASE_URL,
  API_URL,
  CLIENT_ID,
  M2M_CLIENT,
  M2M_SECRET,
  SAML_PK,
  SAML_CERT,
  VERCEL_URL,
  VERCEL_GIT_REPO_SLUG,
  VERCEL_GIT_REPO_OWNER,
  PORT = 7000,
} = process.env;

const appUrl = VERCEL_URL
  ? `https://${VERCEL_GIT_REPO_SLUG}-git-main-${VERCEL_GIT_REPO_OWNER.toLowerCase()}.vercel.app`
  : `http://localhost:${PORT}`;

function checkUrl() {
  return (req, res, next) => {
    const host = req.headers.host;
    if (!appUrl.includes(host)) {
      return res.status(301).redirect(appUrl);
    }
    return next();
  };
}

function removeTrailingSlashFromUrl(url) {
  if (!url || !url.endsWith("/")) return url;

  return url.substring(0, url.length - 1);
}

console.log("\n----------------------------------");
console.log("Envronment Settings:");
console.log(`ISSUER_BASE_URL: ${ISSUER_BASE_URL}`);
console.log(`API_URL: ${API_URL}`);
console.log(`CLIENT_ID: ${CLIENT_ID}`);
if (M2M_SECRET) console.log(`M2M_SECRET: Has Value`);
else console.log(`M2M_SECRET: Not Set`);
console.log(`APP_URL: ${appUrl}`);
console.log("----------------------------------\n");

module.exports = {
  checkUrl,
  APP_URL: appUrl,
  API_URL: API_URL ? removeTrailingSlashFromUrl(API_URL) : '',
  ISSUER_BASE_URL: ISSUER_BASE_URL ? removeTrailingSlashFromUrl(ISSUER_BASE_URL) : '',
  CLIENT_ID: (CLIENT_ID || 'orPLw4uncxdLQgqFatggRilaeqAIe45I'),
  M2M_CLIENT: (M2M_CLIENT || '5aZOsT42VDC87cCxErbUZuT8DqII4X7C'),
  M2M_SECRET: M2M_SECRET,
  SAML_PK: SAML_PK,
  SAML_CERT: SAML_CERT,
  PORT: PORT,
};
