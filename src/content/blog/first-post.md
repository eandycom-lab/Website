---
title: Neuanfang mit Astro, Decap CMS und Cloudflare Pages
description: "Ein Blick unter die Haube: Warum diese Website auf statische
  Performance, Git-basiertes Headless-Publishing und Edge-Hosting setzt."
pubDate: 2026-11-11T21:56:00.000+01:00
heroImage: /images/headbildmcp.jpg
---
Willkommen auf der neuen Website! 



Nach einigem Experimentieren mit verschiedenen Setups läuft dieses Projekt nun auf einem schlanken, modernen Stack, der maximale Performance mit minimaler Server-Verwaltung kombiniert.



\### Der Tech-Stack im Überblick



\* \*\*Astro:\** Zero-JS-by-default Architektur. HTML wird komplett vorab statisch generiert, was für herausragende Ladezeiten und perfekte Core Web Vitals sorgt.

\* \*\*Decap CMS:\** Ein Open-Source-fähiges, Git-basiertes CMS. Inhalte werden nicht in einer SQL-Datenbank abgelegt, sondern direkt als Markdown-Dateien im Git-Repository versioniert.

\* \*\*Decap Turbo & GitHub:\** Sichere und unkomplizierte OAuth-Authentifizierung ohne schweren Backend-Server.

\* \*\*Cloudflare Pages:\** Globales Edge-Deployment mit automatischen Builds bei jedem neuen Git-Commit.



\### Warum dieser Ansatz?



Content Management direkt an Git zu koppeln bedeutet volle Datenhoheit: Keine proprietären Datenbanken, kein Vendor-Lock-in und vollständige Versionskontrolle für jeden einzelnen Satz. Wenn ein Post im Browser veröffentlicht wird, landet er transparent als Commit im Repository und ist Sekunden später weltweit auf dem CDN verfügbar.



Mehr technische Einblicke, Homelab-Setups und Notizen folgen hier in Kürze.
