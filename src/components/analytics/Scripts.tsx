import Script from "next/script";
import { env } from "@/lib/env";

/**
 * ANA-001/ANA-002 — Script analytics di root layout.
 * Hanya dimuat jika env terisi (jangan load script kosong di dev).
 *
 * - GTM: dataLayer + gtm.js (jika NEXT_PUBLIC_GTM_ID ada).
 * - GA4: gtag langsung (jika NEXT_PUBLIC_GA4_ID ada dan GTM tidak dipakai).
 * - Meta Pixel: fbq init + PageView.
 * - TikTok Pixel: ttq load + page.
 *
 * Semua script pakai `afterInteractive` (bukan blocking render).
 * Consent mode (SEC-004, doc/08) menyusul bila cookie banner dibutuhkan.
 */
export function AnalyticsScripts() {
  const gtmId = env.NEXT_PUBLIC_GTM_ID;
  const ga4Id = env.NEXT_PUBLIC_GA4_ID;
  const metaId = env.NEXT_PUBLIC_META_PIXEL_ID;
  const tiktokId = env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

  if (!gtmId && !ga4Id && !metaId && !tiktokId) return null;

  return (
    <>
      {gtmId ? (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="GTM"
            />
          </noscript>
        </>
      ) : null}

      {ga4Id && !gtmId ? (
        <>
          <Script id="ga4-init" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} />
          <Script id="ga4-config" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${ga4Id}');`}
          </Script>
        </>
      ) : null}

      {metaId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaId}');fbq('track','PageView');`}
        </Script>
      ) : null}

      {tiktokId ? (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(i){ttq.init=function(){ttq.push(["init",i])};ttq.page()};
var s=d.getElementsByTagName(t)[0];var p=d.createElement(t);p.async=!0;p.src="https://analytics.tiktok.com/i18n/pixel/events.js";
s.parentNode.insertBefore(p,s)}(window,document,'script','ttq');ttq.load('${tiktokId}');ttq.page();`}
        </Script>
      ) : null}
    </>
  );
}
