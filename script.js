(function () {
    var form = document.getElementById('referralForm');
    var submitBtn = document.getElementById('submitBtn');
    var toastContainer = document.getElementById('toastContainer');
    var corsBanner = document.getElementById('cors-banner');

    var config = window.JUNIPER_CONFIG || { apiBaseUrl: '', clientId: '', clientSecret: '' };

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function showToast(type, title, bodyHtml, duration) {
        duration = duration || 0;
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;

        var html = '<button class="toast-close">&times;</button>' +
            '<h3>' + escapeHtml(title) + '</h3>' +
            '<div class="toast-body">' + bodyHtml + '</div>';

        toast.innerHTML = html;
        toastContainer.appendChild(toast);

        toast.querySelector('.toast-close').addEventListener('click', function () {
            dismissToast(toast);
        });

        if (duration > 0) {
            setTimeout(function () { dismissToast(toast); }, duration);
        }
    }

    function dismissToast(toast) {
        if (!toast || !toast.parentNode) return;
        toast.classList.add('removing');
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 250);
    }

    function formatDobDigits(digits) {
        if (digits.length <= 2) {
            return digits;
        }
        if (digits.length <= 4) {
            return digits.slice(0, 2) + '-' + digits.slice(2);
        }
        return digits.slice(0, 2) + '-' + digits.slice(2, 4) + '-' + digits.slice(4);
    }

    function handleDobInput(e) {
        var input = e.target;
        var digits = input.value.replace(/\D/g, '').slice(0, 8);
        input.value = formatDobDigits(digits);
    }

    function isValidDob(value) {
        if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) {
            return false;
        }

        var parts = value.split('-');
        var month = parseInt(parts[0], 10);
        var day = parseInt(parts[1], 10);
        var year = parseInt(parts[2], 10);
        var date = new Date(year, month - 1, day);

        return date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day;
    }

    function validateForm() {
        var valid = true;
        var requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(function (field) {
            field.classList.remove('invalid');
            if (!field.value.trim()) {
                field.classList.add('invalid');
                valid = false;
            } else if (field.id === 'patientDob' && !isValidDob(field.value.trim())) {
                field.classList.add('invalid');
                valid = false;
            }
        });
        if (!valid) {
            var first = form.querySelector('.invalid');
            if (first) first.focus();
        }
        return valid;
    }

    function formatDobForApi(value) {
        var parts = value.split('-');
        return parts[2] + '-' + parts[0] + '-' + parts[1];
    }

    function buildPayload() {
        var dobRaw = document.getElementById('patientDob').value.trim();
        var payload = {
            patientFirstName: document.getElementById('patientFirstName').value.trim(),
            patientLastName: document.getElementById('patientLastName').value.trim(),
            patientDob: formatDobForApi(dobRaw),
            patientEmail: document.getElementById('patientEmail').value.trim(),
            mrn: document.getElementById('mrn').value.trim(),
            referralSender: document.getElementById('referralSender').value.trim(),
            diagnosisName: document.getElementById('diagnosisName').value.trim(),
            icd10Code: document.getElementById('icd10Code').value.trim(),
            referringProvider: document.getElementById('referringProvider').value.trim(),
            payerName: document.getElementById('payerName').value.trim(),
            memberId: document.getElementById('memberId').value.trim()
        };

        var phone = document.getElementById('patientPhone').value.trim();
        if (phone) {
            payload.patientPhone = phone;
        }

        var reason = document.getElementById('reasonForReferral').value.trim();
        if (reason) {
            payload.reasonForReferral = reason;
        }

        return payload;
    }

    function handleSuccess(data) {
        var cid = data.correlationId || 'N/A';
        var msg = data.message || 'Referral payload received successfully and queued for processing.';
        var body = '<p>' + escapeHtml(msg) + '</p>' +
            '<div class="correlation-id"><span>Correlation ID: <strong>' + escapeHtml(cid) + '</strong></span>' +
            '<button class="btn-copy" onclick="navigator.clipboard.writeText(\'' + escapeHtml(cid).replace(/'/g, "\\'") + '\').then(function(){this.textContent=\'Copied!\';var b=this;setTimeout(function(){b.textContent=\'Copy\';},1500)})">Copy</button></div>';

        var status = data.status || 'Accepted';
        showToast('success', status + ' — ' + escapeHtml(data.status || 'Accepted'), body);
    }

    function handleError(status, body) {
        var detail = '';
        try {
            var json = typeof body === 'string' ? JSON.parse(body) : body;
            detail = '<pre>' + escapeHtml(JSON.stringify(json, null, 2)) + '</pre>';
        } catch (e) {
            detail = '<p>' + escapeHtml(body || 'No response body') + '</p>';
        }
        showToast('error', 'Request Failed (' + status + ')', detail, 10000);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        form.querySelectorAll('[required]').forEach(function (f) { f.classList.remove('invalid'); });

        if (!config.apiBaseUrl || !config.clientId || !config.clientSecret) {
            showToast('error', 'Configuration Missing',
                '<p>Edit <code>config.js</code> with your <strong>apiBaseUrl</strong>, <strong>clientId</strong>, and <strong>clientSecret</strong> values, then reload this page.</p>',
                10000);
            return;
        }

        if (!validateForm()) {
            var dobField = document.getElementById('patientDob');
            var message = dobField.classList.contains('invalid') && dobField.value.trim()
                ? '<p>Please enter a valid date of birth in MM-DD-YYYY format.</p>'
                : '<p>Please fill in all required fields.</p>';
            showToast('error', 'Validation Error', message, 5000);
            return;
        }

        var payload = buildPayload();
        var url = config.apiBaseUrl.replace(/\/+$/, '') + '/inbound-referral';

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            var response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'client_id': config.clientId,
                    'client_secret': config.clientSecret
                },
                body: JSON.stringify(payload)
            });

            var responseBody = await response.text();

            if (response.ok) {
                var data = JSON.parse(responseBody);
                handleSuccess(data);
            } else {
                handleError(response.status, responseBody);
            }
        } catch (err) {
            if (err instanceof TypeError && err.message.indexOf('Failed to fetch') !== -1) {
                corsBanner.style.display = 'flex';
                showToast('error', 'Network Error',
                    '<p>Could not reach the API. This is likely a CORS issue — ensure the CORS policy is enabled on the Experience API in Anypoint API Manager.</p>' +
                    '<pre>' + escapeHtml(err.message) + '</pre>',
                    10000);
            } else {
                showToast('error', 'Error', '<p>' + escapeHtml(err.message) + '</p>', 10000);
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Referral';
        }
    }

    document.getElementById('patientDob').addEventListener('input', handleDobInput);

    form.addEventListener('submit', handleSubmit);
})();