# Gumroad SEO Handoff — Search and Sharing Configuration

This document contains the production SEO titles and descriptions for all three custom pages on **https://shop.farazkh.dev**, ready to enter in Gumroad's **Pages → Search and sharing** settings.

---

## Why This Must Be Entered in Gumroad's Dashboard

Gumroad hosts custom HTML pages inside a sandboxed `/landing/embed` iframe and runs an HTML sanitizer on submitted `profile.html`, `about.html`, and `faq.html` uploads.

### Tags Stripped by Gumroad's Sanitizer (From Custom HTML)
- `<title>`
- `<meta charset>`
- `<meta name="viewport">`
- `<meta name="description">`
- `<link rel="canonical">`
- Open Graph tags (`og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`)
- Twitter / X Card tags (`twitter:card`, `twitter:title`, `twitter:description`)

### SEO Settings Managed by Gumroad Natively
Gumroad renders the outer page `<head>` (which search engines and social link-preview crawlers read) from your **Pages → Search and sharing** settings (introduced October 23, 2026) and your Gumroad profile settings.

> The source entry files (`index.html`, `src/entries/profile.html`, `src/entries/about.html`, `src/entries/faq.html`) retain matching metadata for local development and any future non-Gumroad hosting, but **published Gumroad SEO is controlled by the dashboard values below**.

---

## Exact SEO Values to Enter

### 1. Home / Profile Page (`https://shop.farazkh.dev/`)
- **SEO Title** (52 chars):
  ```text
  FARAZ KAYAN — Digital Templates & Creative Resources
  ```
- **SEO Description** (150 chars):
  ```text
  Thoughtfully designed presentation templates, Canva resources, and web design assets by Faraz Kayan Haque to help you design, present, and build faster.
  ```

---

### 2. About Page (`https://shop.farazkh.dev/about`)
- **SEO Title** (45 chars):
  ```text
  About FARAZ KAYAN — Independent Design Studio
  ```
- **SEO Description** (153 chars):
  ```text
  Meet Faraz Kayan Haque, the independent student builder behind FARAZ KAYAN, crafting practical presentation templates, Canva layouts, and web starter kits.
  ```

---

### 3. FAQ Page (`https://shop.farazkh.dev/faq`)
- **SEO Title** (48 chars):
  ```text
  FAQ — Downloads, Compatibility & Gumroad Support
  ```
- **SEO Description** (152 chars):
  ```text
  Answers to common questions about FARAZ KAYAN digital downloads, PowerPoint, Keynote, and Canva compatibility, editing templates, and Gumroad purchases.
  ```

---

## Where to Enter Each Value in Gumroad

Repeat these steps for each of the three pages (**Profile / Home**, **About**, and **FAQ**):

1. Sign in to your **Gumroad Dashboard** (`app.gumroad.com`).
2. Navigate to **Profile / Pages** (the Pages editor for `farazkayan.gumroad.com` / `shop.farazkh.dev`).
3. Select the page you want to configure:
   - **Profile / Home** (`/`)
   - **About** (`/about`)
   - **FAQ** (`/faq`)
4. Open the **Search and sharing** section in the page settings panel.
5. Paste the exact **SEO Title** into the **Title / Meta title** field.
6. Paste the exact **SEO Description** into the **Description / Meta description** field.
7. Optionally upload a branded social share image (`1200×630`) in the **Social sharing image** field if desired.
8. Save / publish the page settings.
