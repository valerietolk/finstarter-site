/* FinStarter — Contact us: attachments, validation, success state */
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var viewForm = document.querySelector('.contact__view--form');
  var viewDone = document.querySelector('.contact__view--done');
  var fileInput = document.getElementById('c-file');
  var fileList = document.getElementById('c-files');
  var fileErr = document.getElementById('c-file-err');

  var ALLOWED = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'txt'];
  var MAX_BYTES = 10 * 1024 * 1024;
  var files = [];

  function setError(input, msg) {
    var err = document.getElementById(input.id + '-err');
    input.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
  }
  function fmtSize(b) { return b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB'; }

  function renderFiles() {
    fileList.innerHTML = '';
    files.forEach(function (f, i) {
      var li = document.createElement('li');
      li.className = 'cform__filechip';
      var name = document.createElement('span'); name.textContent = f.name;
      var size = document.createElement('small'); size.textContent = fmtSize(f.size);
      var rm = document.createElement('button'); rm.type = 'button'; rm.setAttribute('aria-label', 'Remove ' + f.name); rm.textContent = '×';
      rm.addEventListener('click', function () { files.splice(i, 1); renderFiles(); });
      li.appendChild(name); li.appendChild(size); li.appendChild(rm);
      fileList.appendChild(li);
    });
  }

  fileInput.addEventListener('change', function () {
    var rejected = [];
    Array.prototype.forEach.call(fileInput.files, function (f) {
      var ext = (f.name.split('.').pop() || '').toLowerCase();
      if (ALLOWED.indexOf(ext) === -1) { rejected.push(f.name + ' — format not supported'); return; }
      if (f.size > MAX_BYTES) { rejected.push(f.name + ' — larger than 10 MB'); return; }
      if (!files.some(function (x) { return x.name === f.name && x.size === f.size; })) files.push(f);
    });
    fileErr.textContent = rejected.join('. ');
    fileInput.value = '';
    renderFiles();
  });

  function validate() {
    var ok = true;
    var name = form.elements.name, email = form.elements.email;
    if (!name.value.trim()) { setError(name, 'Please enter your name.'); ok = false; } else setError(name, '');
    if (!email.value.trim()) { setError(email, 'Please enter your e-mail.'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { setError(email, 'That doesn’t look like a valid e-mail.'); ok = false; }
    else setError(email, '');
    return ok;
  }
  Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (i) {
    i.addEventListener('input', function () { if (i.classList.contains('is-invalid')) setError(i, ''); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) { var bad = form.querySelector('.is-invalid'); if (bad) bad.focus(); return; }
    // TODO: send the form (FormData with `files`) to your CRM / backend here.
    viewForm.hidden = true;
    viewDone.hidden = false;
    viewDone.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
