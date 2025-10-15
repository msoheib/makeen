# Testing Guide - Web React Branch

Complete guide to testing your Makeen Property Management System web application.

## Prerequisites

Before testing, ensure you have:
- ✅ Node.js 18+ installed
- ✅ npm installed
- ✅ Git (to be on the correct branch)
- ✅ A modern browser (Chrome, Firefox, Safari, or Edge)

## Step 1: Verify You're on the Correct Branch

```bash
# Check current branch
git branch

# You should see:
# * web-react  (with asterisk)
#   main

# If you're on main, switch to web-react
git checkout web-react
```

## Step 2: Install Dependencies

```bash
# Install all required packages
npm install

# This will install:
# - React 18.3
# - Material-UI 6.3
# - React Router 7.1
# - Vite 6.0
# - All other dependencies
```

**Expected output:**
```
added 1234 packages in 45s
```

## Step 3: Configure Environment Variables

```bash
# Create your .env file
cp .env.example .env

# Open .env and add your Supabase credentials
```

**Edit `.env` file:**
```env
VITE_SUPABASE_URL=https://fbabpaorcvatejkrelrf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ENCRYPTION_KEY=your-unique-production-key-here
```

> **Note**: The Supabase URL and key are already in your `app.json` file. You can use those same values.

## Step 4: Start the Development Server

```bash
# Start Vite dev server
npm run dev
```

**Expected output:**
```
VITE v6.0.7  ready in 234 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**✅ Success Indicator**: Server starts without errors

## Step 5: Open in Browser

1. Open your browser
2. Navigate to: `http://localhost:3000`
3. You should see the **Login Page**

### What You Should See

**Login Page:**
- Purple "Makeen" branding at top
- Email input field
- Password input field
- "Sign In" button
- "Don't have an account? Sign Up" link

`✶ Insight ─────────────────────────────────────`
**Why you see the login page first:**

The app redirects all unauthenticated users to `/auth/login`. This is a security feature - only users with valid Supabase accounts can access the dashboard.
`─────────────────────────────────────────────────`

## Step 6: Test Authentication

### Option A: Sign Up (New User)

1. Click **"Sign Up"** link
2. Fill in the form:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Phone: `+966501234567` (optional)
   - Role: Select `Tenant` or `Owner`
   - Password: `test1234` (minimum 8 characters)
   - Confirm Password: `test1234`
3. Click **"Sign Up"**

**Expected Behavior:**
- Success message: "Account created successfully"
- Message: "Your account is pending approval"
- Auto-redirect to login page after 3 seconds

**⚠️ Important**: New accounts require admin approval. You'll need to approve the user in Supabase:

```sql
-- Run this in Supabase SQL Editor
UPDATE users
SET status = 'approved'
WHERE email = 'test@example.com';
```

### Option B: Use Existing Account

If you have an existing approved account:

1. Enter your **email**
2. Enter your **password**
3. Click **"Sign In"**

**Expected Behavior:**
- Loading spinner appears briefly
- Redirect to dashboard at `/dashboard`
- Sidebar appears (desktop) or hamburger menu (mobile)
- Welcome message with your name

## Step 7: Test Dashboard Features

Once logged in, you should see:

### Dashboard Home (`/dashboard`)

**Desktop View:**
- ✅ Top app bar with language toggle, dark mode, notifications, profile
- ✅ Left sidebar with navigation menu
- ✅ Main content area with stat cards
- ✅ 6 stat cards in grid (3 columns)
- ✅ Welcome message with your first name

**Mobile View (resize browser to < 900px):**
- ✅ Hamburger menu button (top left)
- ✅ Stat cards stack (1 column)
- ✅ Bottom area with feature highlights

### Test Dashboard Interactions

1. **Language Toggle:**
   - Click the 🌐 icon in top bar
   - Select "العربية" (Arabic)
   - **Expected**: Entire UI flips to RTL, text becomes Arabic
   - Select "English" to switch back

2. **Dark Mode:**
   - Click the ☀️/🌙 icon in top bar
   - **Expected**: Theme changes to dark/light instantly
   - All colors adapt (background, text, cards)

3. **Notifications:**
   - Click the 🔔 icon
   - **Expected**: Navigate to `/dashboard/notifications` (placeholder page)

4. **User Profile:**
   - Click your avatar (initials in circle)
   - **Expected**: Dropdown menu appears
   - Options: Profile, Settings, Logout

5. **Sidebar Navigation:**
   - Click "Properties" in sidebar
   - **Expected**: Navigate to `/dashboard/properties`

## Step 8: Test Properties Page

Navigate to **Properties** from sidebar:

### Properties List Features

**Search:**
```
1. Type "luxury" in search box
2. Results filter in real-time
3. Clear search to see all again
```

**Filters:**
```
1. Status Dropdown:
   - Select "Available"
   - See only available properties
   - Check active filter chip appears

2. Type Dropdown:
   - Select "Apartment"
   - See only apartments
   - Check active filter chip appears

3. Remove Filters:
   - Click X on any filter chip
   - Filter clears immediately
```

**View Modes (Desktop Only):**
```
1. Click Grid icon (📊)
   - See property cards in grid
   - 3 columns on desktop

2. Click Table icon (📋)
   - See data table view
   - Sortable columns
   - Pagination at bottom
```

**Table Features (Desktop Only):**
```
1. Click "Title" column header
   - Sorts A→Z
   - Click again for Z→A
   - Arrow indicates sort direction

2. Click "Price" column header
   - Sorts low→high
   - Click again for high→low

3. Change "Rows per page"
   - Try 5, 10, 25 options
   - Table updates

4. Click page arrows
   - Navigate between pages
```

**Property Cards:**
```
1. Hover over card (desktop)
   - Card lifts up smoothly
   - Shadow increases

2. Click 👁️ (View) button
   - Navigates to property details
   - (Currently shows placeholder)

3. Click ✏️ (Edit) button
   - Navigates to edit page
   - (Currently shows placeholder)
```

## Step 9: Test Mobile Responsive Design

### Using Chrome DevTools

1. **Open DevTools**: Press `F12`
2. **Toggle Device Toolbar**: Press `Ctrl+Shift+M` (Windows) or `Cmd+Shift+M` (Mac)
3. **Select Device**: Choose from dropdown

**Test These Devices:**

| Device | Width | Expected Behavior |
|--------|-------|-------------------|
| **iPhone SE** | 375px | 1 column grid, hamburger menu, stacked filters |
| **iPhone 12 Pro** | 390px | 1 column grid, touch-friendly buttons |
| **iPad** | 768px | 2 column grid, temporary drawer |
| **iPad Pro** | 1024px | 3 column grid, permanent sidebar |
| **Desktop** | 1920px | 3 column grid, all features visible |

### Mobile-Specific Features to Test

**Navigation:**
```
1. Tap hamburger menu (☰)
   - Drawer slides from left
   - Full-screen overlay
   - Tap outside to close

2. Tap navigation item
   - Page changes
   - Drawer closes automatically
```

**Stat Cards:**
```
1. Check single column layout
2. Verify touch targets (easy to tap)
3. Scroll smoothly through cards
```

**Properties Page:**
```
1. Verify grid view only (no table)
2. Check search is full-width
3. Filters stack vertically
4. Cards easy to tap
5. Add button full-width
```

## Step 10: Test RTL (Arabic) Mode

1. Click language toggle (🌐)
2. Select "العربية"

**Verify RTL Changes:**
- ✅ Sidebar moves to right side
- ✅ Text aligns right
- ✅ Icons flip horizontally
- ✅ Menu items right-aligned
- ✅ Breadcrumbs reverse direction
- ✅ Stat card layout mirrors
- ✅ Cairo font loads

**Test Navigation in RTL:**
```
1. Hamburger menu on right side
2. Drawer slides from right
3. All interactions feel natural
```

## Step 11: Test Dark Mode

Click dark mode toggle (☀️/🌙):

**Verify Dark Mode:**
- ✅ Background: Dark gray (#121212)
- ✅ Cards: Lighter gray (#1e1e1e)
- ✅ Text: White/light gray
- ✅ Primary color: Still purple
- ✅ Hover effects work
- ✅ Shadows adjusted for dark
- ✅ All readable and comfortable

## Step 12: Test Performance

### Load Time

```bash
# Open browser DevTools
# Go to Network tab
# Reload page (Ctrl+R)

Expected Results:
- Initial load: < 2 seconds
- JavaScript bundle: < 500KB gzipped
- Fonts: Load in < 500ms
- No errors in Console
```

### Smooth Interactions

Test these for 60fps smoothness:
- ✅ Sidebar drawer animation
- ✅ Card hover effects
- ✅ View mode switching
- ✅ Dark mode toggle
- ✅ Language switching
- ✅ Page navigation

## Troubleshooting

### Issue: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: "Cannot find module" errors

**Solution:**
```bash
# Verify you're on web-react branch
git branch

# Pull latest changes
git pull origin web-react

# Reinstall dependencies
npm install
```

### Issue: Login doesn't work

**Possible Causes:**

1. **Wrong Supabase credentials**
   - Check `.env` file
   - Verify URL and key match Supabase dashboard

2. **User not approved**
   ```sql
   -- Check user status in Supabase
   SELECT email, status FROM users WHERE email = 'your@email.com';

   -- Approve if needed
   UPDATE users SET status = 'approved' WHERE email = 'your@email.com';
   ```

3. **Network error**
   - Check browser Console (F12)
   - Look for red error messages
   - Verify internet connection

### Issue: Blank page after login

**Check Console:**
```
1. Press F12
2. Look for errors in Console tab
3. Common issues:
   - Translation files missing
   - Store not hydrating
   - Route configuration error
```

**Solution:**
```bash
# Restart dev server
# Press Ctrl+C to stop
npm run dev
```

### Issue: Styles look broken

**Possible Causes:**

1. **Tailwind not working**
   - Check `tailwind.config.js` exists
   - Verify `src/index.css` imports Tailwind

2. **MUI theme not loading**
   - Check browser Console for errors
   - Verify fonts loaded

**Solution:**
```bash
# Rebuild
npm run build
npm run dev
```

### Issue: Hot reload not working

**Solution:**
```bash
# Restart Vite
# Press Ctrl+C
npm run dev

# Or force refresh browser
# Press Ctrl+Shift+R
```

## Success Checklist

Before proceeding to Phase 4, verify:

- ✅ Login/Signup works
- ✅ Dashboard loads with stat cards
- ✅ Navigation sidebar works
- ✅ Properties page shows cards
- ✅ Search/filters work
- ✅ Grid/table toggle works (desktop)
- ✅ Mobile menu opens/closes
- ✅ Dark mode toggles correctly
- ✅ RTL mode works (Arabic)
- ✅ No console errors
- ✅ Smooth 60fps animations
- ✅ Responsive on all screen sizes

## Next Steps

Once testing is complete:

1. **Report any issues** you find
2. **Take screenshots** of any bugs
3. **Note browser/device** where issues occur
4. **Ready for Phase 4** if all checks pass!

## Quick Test Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (when added)
npm test

# Lint code
npm run lint

# Check TypeScript
npx tsc --noEmit
```

## Browser Testing Matrix

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Fully Supported |
| Firefox | Latest | ✅ Fully Supported |
| Safari | Latest | ✅ Fully Supported |
| Edge | Latest | ✅ Fully Supported |
| Chrome Mobile | Latest | ✅ Fully Supported |
| Safari iOS | Latest | ✅ Fully Supported |

---

**Need Help?**

If you encounter issues not covered here:
1. Check browser Console (F12) for errors
2. Verify `.env` configuration
3. Ensure you're on `web-react` branch
4. Try restarting the dev server

Happy testing! 🚀
