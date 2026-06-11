# Diera Shop — Implementation Plan (v4)

A Nepal-based clothing e-commerce site with a light pink theme, full backend (MongoDB Atlas), separated user/admin areas, product Q&A, private user↔admin chat, OTP-verified signup, order notifications, **admin-only inline image editing**, and a **working global search**.

---

## 1. Branding & Theme

- Rename to **Diera Shop** (Nepal-based clothing).
- `index.css` design tokens switched to a **light pink** semantic palette (soft blush primary, deep rose accent, warm cream background, charcoal text) — HSL tokens, no hardcoded colors.
- **Theme switcher** in header (Light Pink default + Dusty Rose, Sage Cream, Dark). Saved in `localStorage`, applied via `data-theme` on `<html>` so it persists on every page.
- NPR (रू) currency, updated logo/wordmark, hero copy, footer.
- Full mobile responsiveness pass.

---

## 2. Backend (MongoDB Atlas)

**Database:** MongoDB Atlas (M0 free tier or M10+ for production).  
**ODM:** Mongoose (Node.js/Express API server) or MongoDB Data API if serverless.  
**Auth layer:** Custom JWT tokens + Google OAuth (see §3).

### Collections

| Collection | Key Fields |
|---|---|
| `users` | `_id`, `email`, `passwordHash`, `googleId`, `role` (`user`\|`admin`), `createdAt` |
| `categories` | `_id`, `name`, `slug`, `imageUrl` |
| `products` | `_id`, `name`, `slug`, `description`, `images[]`, `sizes[]`, `colors[]`, `stock`, `price`, `categoryId`, `featured`, `tags[]` |
| `orders` | `_id`, `userId`, `items[]`, `shippingAddress`, `phone`, `paymentMethod`, `status`, `totalNPR` |
| `orderItems` | embedded inside `orders.items[]` |
| `productQuestions` | `_id`, `productId`, `userId`, `question`, `answer`, `answeredAt` |
| `chatMessages` | `_id`, `conversationId`, `senderId`, `senderRole`, `text`, `createdAt` |
| `chatConversations` | `_id`, `userId`, `lastMessage`, `unreadAdmin`, `unreadUser` |
| `notifications` | `_id`, `userId`, `type`, `message`, `read`, `createdAt` |
| `signupOtps` | `_id`, `email`, `codeHash`, `expiresAt`, `attempts` (TTL index on `expiresAt`) |
| `siteImages` | `_id`, `slotKey`, `title`, `subtitle`, `imageUrl`, `alt`, `link`, `sortOrder` |

### Indexes
- `products`: text index on `name`, `description`, `tags` for full-text search (`$text` queries).
- `signupOtps`: TTL index (`expireAfterSeconds: 0` on `expiresAt` field) for automatic cleanup.
- `chatMessages`: index on `conversationId` + `createdAt`.

### Real-time
Use **Socket.io** (on the Express server) with rooms per `conversationId` and per `userId` for:
- `chat_messages` (new message events)
- `product_questions` / `product_answers`
- `notifications` (new notification badge updates)

### File / Image Storage — MongoDB-native (no third-party CDN required)

Images are stored directly in MongoDB using **GridFS** (for files >16 MB) or as **Base64 data URIs embedded in the document** (for files ≤2 MB, simplest approach for site images). The recommended split:

| Use case | Storage method |
|---|---|
| Site images (`siteImages` slots) | Base64 `imageData` field in the document (≤2 MB after resize) |
| Product images (`products.images[]`) | GridFS via `mongoose-gridfs` / `multer-gridfs-storage` (supports any size) |

#### `siteImages` collection — updated fields

```
_id, slotKey, title, subtitle, alt, link, sortOrder,
imageData      (String)   — Base64 data URI, e.g. "data:image/webp;base64,..."
imageMimeType  (String)   — "image/jpeg" | "image/png" | "image/webp"
imageSize      (Number)   — original file size in bytes (for admin display)
uploadedAt     (Date)     — last replaced timestamp
sourceType     (String)   — "local_upload" | "url_drag_drop"
sourceUrl      (String)   — original URL if dragged from internet (audit trail only)
```

#### Upload endpoint

`POST /api/admin/site-images/:slotKey/image` (protected by `requireAdmin`):
- Accepts `multipart/form-data` (local file) **or** `{ url: "https://…" }` JSON (drag-from-internet).
- `multer` with `memoryStorage()` — file never touches disk.
- Server-side resize with **sharp** (`npm install sharp`): resize to max 1200 × 1200 px, convert to WebP, strip EXIF → keeps Base64 payload small.
- Validate: ≤ 5 MB original, mime type must be `image/jpeg`, `image/png`, or `image/webp`.
- For URL source: server fetches the URL with `node-fetch`, validates Content-Type, then passes buffer through the same sharp pipeline.
- Saves Base64 string into `siteImages.imageData`; returns the slotKey so the frontend can invalidate the React Query cache.

```js
// server/routes/siteImages.js (upload handler sketch)
router.post('/:slotKey/image', verifyToken, requireAdmin, upload.single('image'), async (req, res) => {
  let buffer;
  let sourceType = 'local_upload';
  let sourceUrl = null;

  if (req.file) {
    buffer = req.file.buffer;                          // local file via multer memoryStorage
  } else if (req.body.url) {
    sourceType = 'url_drag_drop';
    sourceUrl = req.body.url;
    const response = await fetch(req.body.url);        // drag-from-internet
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    return res.status(400).json({ error: 'No image provided' });
  }

  const webpBuffer = await sharp(buffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const base64 = `data:image/webp;base64,${webpBuffer.toString('base64')}`;

  await SiteImage.findOneAndUpdate(
    { slotKey: req.params.slotKey },
    { imageData: base64, imageMimeType: 'image/webp',
      imageSize: webpBuffer.byteLength, uploadedAt: new Date(),
      sourceType, sourceUrl },
    { upsert: true, new: true }
  );

  res.json({ ok: true, slotKey: req.params.slotKey });
});
```

#### Serving images back to the browser

`GET /api/site-images/:slotKey` returns the full document including `imageData`.  
The frontend uses `imageData` directly as the `<img src={imageData} />` value — no separate CDN URL needed.  
For product images stored in GridFS: `GET /api/images/:fileId` streams the file with correct `Content-Type` header.

### Search View (MongoDB Atlas Search — optional upgrade)
For advanced search, enable **Atlas Search** (Lucene-based) on the `products` collection.  
For basic search without Atlas Search, use MongoDB `$text` index queries across `products` + a manual category name match.

---

## 3. Authentication

### Google OAuth (Google Cloud Console)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Create an **OAuth 2.0 Client ID** (Web application type).
3. Set **Authorized redirect URIs** to:
   - `http://localhost:5173/auth/google/callback` (dev)
   - `https://dierashop.com/auth/google/callback` (prod)
4. Copy **Client ID** and **Client Secret** into `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALLBACK_URL=https://dierashop.com/auth/google/callback
   ```
5. Enable the **Google People API** in the Cloud Console (needed to fetch profile info).
6. On the backend, use **Passport.js** with `passport-google-oauth20`:
   ```js
   passport.use(new GoogleStrategy({
     clientID: process.env.GOOGLE_CLIENT_ID,
     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
     callbackURL: process.env.GOOGLE_CALLBACK_URL,
   }, async (accessToken, refreshToken, profile, done) => {
     // Upsert user in MongoDB by googleId
     const user = await User.findOneAndUpdate(
       { googleId: profile.id },
       { email: profile.emails[0].value, name: profile.displayName },
       { upsert: true, new: true }
     );
     return done(null, user);
   }));
   ```
7. On success, issue a **JWT** (signed with `JWT_SECRET`) returned to the frontend as an `httpOnly` cookie or `Authorization` header.

### Email + Password with OTP

- **Signup flow:**
  1. `POST /api/auth/send-otp` — generates 6-digit code, hashes with bcrypt, saves to `signupOtps` (10-min expiry, max 5 attempts), sends email via **Nodemailer** (Gmail SMTP or SendGrid).
  2. `POST /api/auth/verify-otp` — validates hash, creates `users` document with hashed password (`bcrypt`), returns JWT.
- **Login:** `POST /api/auth/login` — compare bcrypt hash, return JWT.
- **Password reset:** `POST /api/auth/forgot-password` → email reset link with signed token → `POST /api/auth/reset-password`.

### Admin Auth

- `/admin/login` and `/admin/signup` are separate frontend routes.
- Admin signup: `POST /api/auth/admin/signup` — requires `adminSignupCode` field checked against `process.env.ADMIN_SIGNUP_CODE` on the server.
- Role stored as `users.role = 'admin'`.

### Route Guards (Frontend)

- `<ProtectedRoute>` — checks for valid JWT / auth context; redirects to `/login` if absent.
- `<AdminRoute>` — additionally checks `user.role === 'admin'`; redirects to `/` if not admin.

### Middleware (Backend)

```js
// authMiddleware.js
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};
```

---

## 4. Routes & Files (separate admin vs user)

```text
src/pages/
  Index, Category, ProductDetail, Checkout, SearchResults
  auth/Login, Signup, VerifyOtp, ResetPassword
  account/Dashboard, Orders, Profile, Chat, Notifications
src/pages/admin/
  Login, Signup, Layout
  Dashboard, Products, ProductEditor, Categories,
  Orders, Questions, Chats, Users, SiteImages
src/components/
  user/  (CartDrawer, ProductQA, ChatWidget, NotificationBell, ThemeSwitcher, SearchBar)
  admin/ (AdminSidebar, DataTable, ProductForm, ChatPanel, EditableImage)
  ProtectedRoute, AdminRoute, ThemeProvider
src/hooks/
  useAuth, useRole, useCart, useTheme, useNotifications, useSearch

server/
  index.js              (Express entry point)
  routes/
    auth.js, products.js, categories.js, orders.js,
    questions.js, chat.js, notifications.js, siteImages.js, search.js, upload.js
  models/
    User, Product, Category, Order, Question,
    ChatMessage, ChatConversation, Notification, SignupOtp, SiteImage
  middleware/
    auth.js, adminOnly.js, upload.js (multer)
  socket/
    chatHandler.js, notificationHandler.js
  utils/
    email.js (Nodemailer), jwt.js, otp.js
```

---

## 5. Admin-Only Inline Image Editing

Wherever the site shows a managed image (collection tiles, hero banner, category cards, lookbook), wrap it in an `<EditableImage slotKey="…">` component.

### How the component works

- On mount, calls `GET /api/site-images/:slotKey` and uses the returned `imageData` (Base64 data URI) as `<img src>`. Falls back to a static placeholder if no record exists yet, so the public site always renders.
- When `useRole()` returns `admin`, a **pencil icon button** appears at the top-right corner on hover (always visible/tappable on mobile). Completely hidden from non-admin users — the button is not rendered at all, not just CSS-hidden.
- Clicking the pencil opens `<ImageEditorDialog>`.

### ImageEditorDialog — two input methods

#### Method 1: Upload from local device
- A styled drag-and-drop zone (`<input type="file" accept="image/*">` hidden behind a styled div).
- Admin can either **click to browse** files or **drag a file from their desktop** onto the zone.
- Shows a live thumbnail preview of the selected file before saving.
- Validates client-side: file must be jpg/png/webp and ≤ 5 MB; shows inline error otherwise.
- On confirm → `POST /api/admin/site-images/:slotKey/image` as `multipart/form-data`.

#### Method 2: Drag-and-drop an image from the internet
- A second drop zone labeled "Or drag an image from a website here".
- Admin opens a browser tab, finds any image, drags it directly onto this zone.
- The browser provides a `DataTransfer` object; the component checks `e.dataTransfer.items` for `kind === 'string'` and `type === 'text/uri-list'` to extract the image URL, **or** checks `files[0]` if the OS resolved it to a file blob first.
- Shows a preview fetched via an `<img>` tag (cross-origin; preview only).
- On confirm → `POST /api/admin/site-images/:slotKey/image` as JSON `{ url: "https://…" }`; the **server fetches and processes** the image (never trusting the client to send raw bytes from a foreign URL).

```tsx
// Drag-from-internet handler sketch (frontend)
const handleExternalDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const url = e.dataTransfer.getData('text/uri-list')
           || e.dataTransfer.getData('text/plain');
  if (url?.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp)/i)) {
    setDraftUrl(url);          // show preview
    setMode('url');
  }
};
```

#### Metadata fields (same dialog, below the image input)
- Title, Subtitle, Alt text, Link target — all optional, saved alongside `imageData` in the `siteImages` document.

### Save flow (end-to-end)

```
Admin picks/drops image
  → client validates type + size (local) or extracts URL (internet drop)
  → POST /api/admin/site-images/:slotKey/image   [requireAdmin middleware]
      → server: multer memoryStorage OR node-fetch from URL
      → sharp: resize ≤ 1200px, convert to WebP, strip EXIF
      → Base64 encode → save to siteImages.imageData in MongoDB
  → server responds { ok: true }
  → React Query invalidateQueries(['siteImage', slotKey])
  → <EditableImage> re-fetches → <img src={imageData}> updates instantly
  → dialog closes, pencil icon returns
```

### Security
- `POST /api/admin/site-images/:slotKey/image` is behind `verifyToken` + `requireAdmin` — 403 for everyone else.
- Server-side URL fetch for internet drops never exposes internal network (validate URL is a public `https://` address, reject `localhost`/private ranges).
- All `/api/admin/*` routes uniformly protected by `requireAdmin` middleware.

### Admin Site Images page (`/admin/site-images`)
- Lists every `siteImages` document in a table: slot key, current image thumbnail, title, last updated.
- Each row has an "Edit" button that opens the same `<ImageEditorDialog>` — a bulk-management alternative to inline editing.
- "Reset to default" button sets `imageData` to `null` (component falls back to placeholder).

---

## 6. Working Global Search

Replace the current decorative search with a real one:

- `SearchBar` in the header opens a command-palette style dropdown with:
  - Live results as you type (debounced 200 ms).
  - Sections: **Products**, **Categories**, **Pages**.
  - Popular searches chips (static seed; configurable in admin later).
- Backend: `GET /api/search?q=…`
  - Uses MongoDB `$text` search on `products` (name, description, tags).
  - Separate `$regex` / `$text` on `categories.name`.
  - Returns top 8 per section, sorted by relevance score (`{ score: { $meta: 'textScore' } }`).
- Hitting Enter or "See all results" navigates to `/search?q=…` → `SearchResults` page with filters: category, size, color, price range (all applied as MongoDB query params).
- Keyboard-accessible (⌘K / Ctrl-K to open, arrow keys, Escape).
- Mobile: full-screen overlay search.

---

## 7. Product Q&A & Private Chat

- **Q&A** on product detail page: logged-in users post questions via `POST /api/questions`; admin answers from `/admin/questions` via `PATCH /api/admin/questions/:id/answer`; Socket.io emits answer event; asker gets in-app + email notification.
- **Private chat**: floating button (logged-in only) → `/account/chat`; admin inbox at `/admin/chats`; one conversation per user; real-time via Socket.io rooms (`conversation:{id}`).

---

## 8. Cart, Checkout & Orders

- Cart in `localStorage` (guest-friendly).
- Checkout collects shipping address + phone + payment method (**COD**, **Khalti**, **eSewa**).
- `POST /api/orders/create` — validates cart, creates `orders` document, triggers email + notification.
- COD: order status set to `pending` immediately.
- Khalti/eSewa: order set to `awaiting_payment` until gateway webhook confirms (stubbed until docs).
- User views orders at `/account/orders` (`GET /api/orders/mine`).
- Admin manages at `/admin/orders` (`GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status`).

---

## 9. Order Notifications

On order placement & status change:

1. **Email** via **Nodemailer** (Gmail SMTP / SendGrid):
   - Templates: `order-confirmation.html`, `order-status-update.html` (light-pink branded, inline CSS).
   - Sent from `createOrder` and `updateOrderStatus` service functions with a unique `orderId` to prevent duplicate sends.
2. **In-app notification**: insert into `notifications` collection; Socket.io emits `notification:new` to the user's room; header bell shows real-time unread count; `/account/notifications` lists history.
3. **Admin notification**: new order also emits `notification:new` to the admin's room + sends admin email.

---

## 10. Admin Dashboard

`/admin`:
- Stats: total orders, NPR revenue, registered users, pending questions, unread chats — all via `GET /api/admin/stats`.
- Product CRUD + image upload via GridFS (stored in MongoDB).
- Category CRUD, Order management, Q&A moderation, Chat inbox, User list.
- **Site Images** page: lists all `siteImages` slots in one place (alternative to inline editing).

---

## 11. Technical Notes

- **Frontend:** React + Vite + TypeScript, React Router v6, React Query (TanStack), Tailwind CSS.
- **Backend:** Node.js + Express, Mongoose ODM, Socket.io, Passport.js, Nodemailer.
- **Database:** MongoDB Atlas (connection string in `MONGODB_URI` env var).
- **Auth:** JWT (`jsonwebtoken`), bcrypt for passwords + OTP hashing.
- **Validation:** `zod` on all API route bodies; Mongoose schema validation as second layer.
- **File uploads:** `multer` (memoryStorage, no disk writes) + `sharp` for server-side resize/WebP conversion. Site images saved as Base64 in MongoDB. Product images stored in MongoDB **GridFS** via `multer-gridfs-storage`.
- **No third-party image CDN required** — all image data lives in MongoDB Atlas.
- **Environment variables (`.env`):**
  ```
  MONGODB_URI=
  JWT_SECRET=
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GOOGLE_CALLBACK_URL=
  ADMIN_SIGNUP_CODE=
  EMAIL_HOST=          # smtp.gmail.com or smtp.sendgrid.net
  EMAIL_USER=
  EMAIL_PASS=
  ```
- Real-time Socket.io subscriptions cleaned up on component unmount (`socket.off(...)` in `useEffect` cleanup).
- Inline image edit uses optimistic UI + React Query cache invalidation.
- CORS configured on Express to allow only the frontend origin.

---

## 12. Out of Scope This Round

- Live Khalti/eSewa API integration (stubbed until docs).
- AI-powered image editing inside the dialog (current scope is upload/replace + metadata). Can add later.
- Multi-language.

---

## Execution Order

1. MongoDB Atlas cluster + collections + indexes + seed `siteImages`.
2. Express server scaffold + Mongoose models + JWT middleware.
3. Google OAuth setup in Cloud Console + Passport.js integration.
4. Email/OTP auth routes + Nodemailer setup.
5. Theme + branding (React frontend).
6. Route guards (`<ProtectedRoute>`, `<AdminRoute>`).
7. Admin shell + product/category CRUD + Site Images page + GridFS upload for products.
8. `EditableImage` component + apply to collection tiles, hero, banners.
9. Global search (`SearchBar` + `/search` page + MongoDB `$text` index).
10. Customer shopping flow + checkout + `createOrder` service.
11. Order email (Nodemailer) + in-app notifications (Socket.io).
12. Product Q&A + private chat (Socket.io rooms).
13. Mobile polish + QA.

> **Before starting:** confirm `ADMIN_SIGNUP_CODE` value and email provider (Gmail SMTP vs SendGrid).