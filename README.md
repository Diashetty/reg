# Open Studio Summer Program – Registration App

HTML + CSS + JavaScript + jQuery + PHP application form. On submit, the details appear as a styled, printable confirmation.

```
index.html        form and confirmation view
css/style.css     styling (including print rules)
js/app.js         jQuery: validation, AJAX, confirmation
php/submit.php    server-side validation, returns JSON
```

## How it works

1. The browser validates the form, then POSTs it to `php/submit.php`.
2. If PHP answers, the confirmation shows "Processed by the PHP server."
3. If there is no PHP (GitHub Pages), the same confirmation is built in the browser and shows "Processed in your browser."

## Deploy to GitHub Pages (static, no PHP)

1. Create a repository and upload everything in this folder (`index.html` must be at the root).
2. Go to **Settings → Pages**, set the source to your main branch and `/ (root)`, and save.
3. Open `https://<your-username>.github.io/<repo-name>/`.

GitHub Pages cannot run PHP, so `php/submit.php` is not executed there. The browser fallback takes over.

## Run or host with PHP

- Locally: `php -S localhost:8000` in this folder, then open http://localhost:8000
- Online: upload the folder to any PHP host (shared hosting, Render, Railway, etc.).

To keep submissions, save `$d` in `php/submit.php` (database, file or email) before the success response.
