/*
 * Registration form logic (jQuery).
 *
 * 1. Validates the form in the browser.
 * 2. Sends it to php/submit.php with AJAX.
 * 3. If there is no PHP on the host (e.g. GitHub Pages), it falls back to
 *    building the confirmation in the browser, so the app still works.
 */
$(function () {
  'use strict';

  var ENDPOINT = 'php/submit.php';
  var MIN_AGE = 16;
  var $form = $('#regForm');
  var $btn = $form.find('button[type=submit]');

  $('#dob').attr('max', new Date().toISOString().split('T')[0]);

  $('#statement').on('input', function () { $('#count').text(this.value.length); });

  // Clear a field's error as soon as the person edits it
  $form.on('input change', ':input', function () {
    var key = (this.name || '').replace('[]', '');
    $('.err[data-for="' + key + '"]').text('');
    $(this).removeAttr('aria-invalid');
  });

  /* ---------- Read + validate ---------- */
  function read() {
    return {
      fullName: $('#fullName').val().trim().replace(/\s+/g, ' '),
      email: $('#email').val().trim(),
      phone: $('#phone').val().trim(),
      dob: $('#dob').val(),
      gender: $('input[name=gender]:checked').val() || '',
      city: $('#city').val().trim().replace(/\s+/g, ' '),
      education: $('#education').val(),
      track: $('#track').val(),
      interests: $('input[name="interests[]"]:checked').map(function () { return this.value; }).get(),
      statement: $('#statement').val().trim(),
      terms: $('#terms').is(':checked')
    };
  }

  function ageOf(iso) {
    var b = new Date(iso + 'T00:00:00'), t = new Date();
    var age = t.getFullYear() - b.getFullYear();
    var m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) { age--; }
    return age;
  }

  // Same rules as php/submit.php
  function validate(d) {
    var e = {}, digits = d.phone.replace(/\D/g, '');
    if (d.fullName.length < 2 || !/^[\p{L} .'-]+$/u.test(d.fullName)) { e.fullName = 'Enter your full name using letters only.'; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { e.email = 'Enter a valid email, like name@example.com.'; }
    if (!/^\+?[0-9\s()-]+$/.test(d.phone) || digits.length < 7 || digits.length > 15) { e.phone = 'Enter a phone number with 7 to 15 digits.'; }
    if (!d.dob) { e.dob = 'Select your date of birth.'; }
    else if (ageOf(d.dob) < MIN_AGE) { e.dob = 'Applicants must be at least ' + MIN_AGE + ' years old.'; }
    if (!d.gender) { e.gender = 'Choose one option.'; }
    if (d.city.length < 2) { e.city = 'Enter your city.'; }
    if (!d.education) { e.education = 'Choose your highest education.'; }
    if (!d.track) { e.track = 'Choose a program track.'; }
    if (d.statement.length < 20) { e.statement = 'Write at least 20 characters.'; }
    if (d.statement.length > 500) { e.statement = 'Keep it to 500 characters or fewer.'; }
    if (!d.terms) { e.terms = 'Confirm the details and agree to the terms to continue.'; }
    return e;
  }

  function clearErrors() {
    $('.err').text('');
    $form.find('[aria-invalid]').removeAttr('aria-invalid');
  }

  function showErrors(errors) {
    clearErrors();
    var first = null;
    $.each(errors, function (key, msg) {
      var $err = $('.err[data-for="' + key + '"]').text(msg);
      var $input = $('#' + key).attr('aria-invalid', 'true');
      if (!first && $err.length) { first = $input.length ? $input : $err.closest('.field').find('input').first(); }
    });
    if (first) { first.trigger('focus'); }
  }

  /* ---------- Submit ---------- */
  function localResult(d) {
    var ref = 'OS27-';
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (var i = 0; i < 6; i++) { ref += chars.charAt(Math.floor(Math.random() * chars.length)); }
    return { success: true, ref: ref, submittedAt: new Date().toISOString(), data: d };
  }

  $form.on('submit', function (ev) {
    ev.preventDefault();
    var data = read(), errors = validate(data);
    if (!$.isEmptyObject(errors)) { showErrors(errors); return; }
    clearErrors();
    $btn.prop('disabled', true).text('Submitting…');

    $.ajax({ url: ENDPOINT, method: 'POST', data: $form.serialize(), dataType: 'json', timeout: 8000 })
      .done(function (res) {
        if (res && res.success) { showReceipt(res, 'php'); }
        else { showErrors((res && res.errors) || {}); }
      })
      .fail(function (xhr) {
        var body = xhr.responseJSON;
        if (xhr.status === 422 && body && body.errors) { showErrors(body.errors); return; }
        // No PHP available on this host: process in the browser instead
        showReceipt(localResult(data), 'browser');
      })
      .always(function () { $btn.prop('disabled', false).text('Submit application'); });
  });

  /* ---------- Confirmation ---------- */
  function fmtDate(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'long' });
  }

  function showReceipt(res, mode) {
    var d = res.data;
    var rows = [
      ['Full name', d.fullName], ['Email', d.email], ['Phone', d.phone],
      ['Date of birth', fmtDate(d.dob)], ['Gender', d.gender], ['City', d.city],
      ['Highest education', d.education], ['Program track', d.track],
      ['Interests', d.interests.length ? d.interests.join(', ') : 'None selected'],
      ['Statement', d.statement]
    ];
    var $dl = $('<dl class="details">');
    $.each(rows, function (_, r) {
      // .text() keeps user input from being interpreted as HTML
      $dl.append($('<div class="row">').toggleClass('wide', r[0] === 'Statement')
        .append($('<dt>').text(r[0]), $('<dd>').text(r[1])));
    });

    var when = new Date(res.submittedAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
    var note = mode === 'php' ? 'Processed by the PHP server.' : 'Processed in your browser because this host has no PHP.';

    $('#receipt').empty().append(
      $('<article class="ticket">').append(
        $('<header class="ticket-head">').append(
          $('<h2 tabindex="-1">').text('Application received'),
          $('<p>').text('Thank you, ' + d.fullName.split(' ')[0] + '. Keep this reference for any follow-up.')
        ),
        $('<div class="ref">').append($('<span>').text('Reference'), $('<strong>').text(res.ref)),
        $dl,
        $('<p class="stamp">').text('Submitted on ' + when)
      ),
      $('<p class="note no-print">').text(note)
    );

    $('#formView').prop('hidden', true);
    $('#receiptView').prop('hidden', false);
    window.scrollTo(0, 0);
    $('#receipt h2').trigger('focus');
  }

  $('#printBtn').on('click', function () { window.print(); });

  $('#newBtn').on('click', function () {
    $form[0].reset();
    clearErrors();
    $('#count').text('0');
    $('#receiptView').prop('hidden', true);
    $('#formView').prop('hidden', false);
    $('#fullName').trigger('focus');
  });
});
