import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { SITE_TITLE } from "../../consts";
import snapshot from "../../data/radar-snapshot.json";
import type { PublishedRadarItem } from "../../lib/radar";

export const GET: APIRoute = (context) => {
  const items = ((snapshot.items ?? []) as PublishedRadarItem[])
    .slice()
    .sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf());

  return rss({
    title: `${SITE_TITLE} – Update Radar`,
    description: "Deutsche Zusammenfassungen offizieller Releases für Self-Hosting, Linux, Local AI und Home Automation.",
    site: context.site ?? "https://sysai.sh",
    items: items.map((item) => ({
      title: `${item.appName} ${item.version}: ${item.titleDe}`,
      description: `${item.summaryDe} (KI-gestützte Zusammenfassung offizieller Release Notes; nicht praktisch getestet.)`,
      pubDate: new Date(item.publishedAt),
      link: item.sourceUrl,
    })),
  });
};
