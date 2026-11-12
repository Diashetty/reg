<?php
/**
 * submit.php – receives the registration form, validates it on the server
 * and returns the cleaned data as JSON. Requires PHP 7.4+.
 *
 * NOTE: GitHub Pages is static hosting and cannot run PHP. On GitHub Pages
 * this file is never executed; js/app.js falls back to browser-side processing.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['success' => false, 'errors' => ['form' => 'Send the form with POST.']]);
}

function field(string $key): string {
    return (isset($_POST[$key]) && is_string($_POST[$key])) ? trim(strip_tags($_POST[$key])) : '';
}
function oneLine(string $s): string {
    return preg_replace('/\s+/u', ' ', $s) ?? $s;
}

// Allowed values (must match the options in index.html)
$genders   = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
$levels    = ['High school', 'Diploma', 'Bachelor’s degree', 'Master’s degree', 'Other'];
$tracks    = ['Web Development', 'Data Analysis', 'UI/UX Design', 'Digital Marketing'];
$interests = ['Mentorship', 'Hackathons', 'Internship placement', 'Scholarship'];

$d = [
    'fullName'  => oneLine(field('fullName')),
    'email'     => field('email'),
    'phone'     => oneLine(field('phone')),
    'dob'       => field('dob'),
    'gender'    => field('gender'),
    'city'      => oneLine(field('city')),
    'education' => field('education'),
    'track'     => field('track'),
    'statement' => str_replace("\r\n", "\n", field('statement')),
];
$picked = (isset($_POST['interests']) && is_array($_POST['interests']))
    ? array_filter($_POST['interests'], 'is_string') : [];
$d['interests'] = array_values(array_intersect($interests, $picked));

// ---- Validation (same rules as js/app.js) ----
$e = [];
if (mb_strlen($d['fullName']) < 2 || !preg_match('/^[\p{L} .\'-]+$/u', $d['fullName'])) {
    $e['fullName'] = 'Enter your full name using letters only.';
}
if (!filter_var($d['email'], FILTER_VALIDATE_EMAIL)) {
    $e['email'] = 'Enter a valid email, like name@example.com.';
}
$digits = strlen(preg_replace('/\D/', '', $d['phone']) ?? '');
if (!preg_match('/^\+?[0-9\s()-]+$/', $d['phone']) || $digits < 7 || $digits > 15) {
    $e['phone'] = 'Enter a phone number with 7 to 15 digits.';
}
$dob = DateTime::createFromFormat('!Y-m-d', $d['dob']);
if (!$dob || $dob->format('Y-m-d') !== $d['dob']) {
    $e['dob'] = 'Select your date of birth.';
} else {
    $today = new DateTime('today');
    if ($dob > $today || $dob->diff($today)->y < 16) {
        $e['dob'] = 'Applicants must be at least 16 years old.';
    }
}
if (!in_array($d['gender'], $genders, true))    { $e['gender'] = 'Choose one option.'; }
if (mb_strlen($d['city']) < 2)                  { $e['city'] = 'Enter your city.'; }
if (!in_array($d['education'], $levels, true))  { $e['education'] = 'Choose your highest education.'; }
if (!in_array($d['track'], $tracks, true))      { $e['track'] = 'Choose a program track.'; }
$len = mb_strlen($d['statement']);
if ($len < 20)       { $e['statement'] = 'Write at least 20 characters.'; }
elseif ($len > 500)  { $e['statement'] = 'Keep it to 500 characters or fewer.'; }
if (!isset($_POST['terms'])) {
    $e['terms'] = 'Confirm the details and agree to the terms to continue.';
}

if ($e) {
    respond(422, ['success' => false, 'errors' => $e]);
}

// ---- Success ----
// To keep the application, save $d here (database, CSV file or email) before responding.
// Output is JSON and the page inserts it with jQuery .text(), so it is not interpreted as HTML.
respond(200, [
    'success'     => true,
    'ref'         => 'OS27-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6)),
    'submittedAt' => date(DATE_ATOM),
    'data'        => $d,
]);
