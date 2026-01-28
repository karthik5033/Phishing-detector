# Blocking System - Fixed!

## What Changed

### 1. **Faster Sync** (30 seconds instead of 5 minutes)
- Extension now checks for blocklist updates every 30 seconds
- Much faster response to block/unblock actions

### 2. **Immediate Sync on Block/Unblock**
- Dashboard now sends a message to extension immediately after blocking
- No need to wait for auto-sync
- Extension updates within 1 second

### 3. **Force Sync Command**
You can manually trigger sync anytime:
```javascript
// In extension console (chrome://extensions > service worker)
chrome.runtime.sendMessage({type: "SYNC_BLOCKLIST"}, (r) => console.log(r));
```

## How to Use

### Block a Domain:
1. Visit any site (e.g., `masto.ai`)
2. Go to Dashboard → Activity
3. Click on the domain
4. Click "Block this Domain Permanently"
5. **Extension syncs automatically within 1 second**
6. Try visiting the site again → Should see blocking page

### Unblock a Domain:
1. Go to Dashboard → Activity
2. Click on blocked domain
3. Click "Unblock Domain"
4. **Extension syncs automatically within 1 second**
5. Site should be accessible again

## Troubleshooting

### Still seeing popup after unblocking?
1. **Wait 2-3 seconds** for sync to complete
2. **Refresh the page** you're trying to visit
3. If still blocked, check extension console:
   ```javascript
   console.log(Array.from(permanentBlocklist));
   ```

### Popup not showing after blocking?
1. **Reload extension**: `chrome://extensions` → reload icon
2. **Check backend**: `curl http://127.0.0.1:8000/api/v1/blocklist`
3. **Force sync**: Run sync command in extension console

## Quick Test

```bash
# 1. Block a domain
curl -X POST http://127.0.0.1:8000/api/v1/block \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'

# 2. Wait 2 seconds

# 3. Try visiting https://example.com
# Should see blocking page

# 4. Unblock
curl -X POST http://127.0.0.1:8000/api/v1/unblock \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'

# 5. Wait 2 seconds

# 6. Try visiting https://example.com again
# Should work now
```

## Technical Details

- **Sync Interval**: 30 seconds (configurable in service-worker.js line 129)
- **Force Sync**: Triggered automatically by dashboard after block/unblock
- **Cache**: Extension caches blocklist in memory (`permanentBlocklist` Set)
- **Normalization**: Domains are lowercased and stripped of protocol/path
