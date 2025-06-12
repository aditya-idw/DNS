const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const dns = require('dns').promises;
const app = express();
const PORT = process.env.PORT || 3099;

app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to lookup DNS and subdomains
app.get('/api/lookup', async (req, res) => {
  const domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'Domain query param is required' });

  try {
    const crtUrl = `https://crt.sh/?q=%25.${domain}&output=json`;
    const crtResp = await fetch(crtUrl);
    const crtData = await crtResp.json();

    const hosts = new Set();
    crtData.forEach(entry => entry.name_value.split('\n').forEach(n => hosts.add(n.trim())));
    hosts.add(domain);

    const types = ['A','AAAA','ALIAS','CAA','CNAME','HTTPS','MX','NS','SRV','SVCB','TLSA','TXT','SOA'];
    const results = [];

    for (const host of hosts) {
      for (const type of types) {
        try {
          const rec = await dns.resolve(host, type);
          results.push({ host, type, records: rec });
        } catch {};
      }
    }

    res.json({ domain, results });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));