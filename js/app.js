// Work order form: validate, save in localStorage, list, export CSV
(function () {
  var KEY = 'crane-work-orders';
  var form = document.getElementById('wo-form');
  if (!form) return;
  var fields = ['customer', 'site', 'crane', 'jobtype', 'priority', 'date', 'description'];
  var labels = { customer: 'Customer', site: 'Site', crane: 'Crane', jobtype: 'Job type', priority: 'Priority', date: 'Date', description: 'Description' };
  var status = document.getElementById('form-status');
  var table = document.getElementById('wo-table');
  var tbody = table.querySelector('tbody');
  var empty = document.getElementById('wo-empty');
  var exportBtn = document.getElementById('export-csv');
  var clearBtn = document.getElementById('clear-all');

  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }

  function render() {
    var list = load();
    tbody.textContent = '';
    list.forEach(function (o, i) {
      var tr = document.createElement('tr');
      ['date', 'customer', 'site', 'crane', 'jobtype', 'priority', 'description'].forEach(function (k) {
        var td = document.createElement('td');
        td.textContent = o[k];
        tr.appendChild(td);
      });
      var td = document.createElement('td');
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Remove';
      b.setAttribute('aria-label', 'Remove work order for ' + o.customer + ' on ' + o.date);
      b.addEventListener('click', function () {
        var l = load(); l.splice(i, 1); save(l); render();
        status.textContent = 'Work order removed.';
        exportBtn.focus();
      });
      td.appendChild(b);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    table.hidden = list.length === 0;
    empty.hidden = list.length !== 0;
    exportBtn.disabled = clearBtn.disabled = list.length === 0;
  }

  function validate() {
    var first = null, data = {};
    fields.forEach(function (f) {
      var el = document.getElementById(f), err = document.getElementById(f + '-err');
      var val = el.value.trim();
      data[f] = val;
      if (!val) {
        err.textContent = labels[f] + ' is required.';
        err.hidden = false;
        el.setAttribute('aria-invalid', 'true');
        if (!first) first = el;
      } else {
        err.hidden = true;
        el.removeAttribute('aria-invalid');
      }
    });
    return { data: data, first: first };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var r = validate();
    if (r.first) {
      status.textContent = 'Please fix the errors and try again.';
      r.first.focus();
      return;
    }
    var list = load();
    list.push(r.data);
    if (!save(list)) {
      status.textContent = 'Could not save: this browser is blocking storage.';
      return;
    }
    form.reset();
    render();
    status.textContent = 'Work order saved.';
    document.getElementById('customer').focus();
  });

  function csvCell(v) {
    v = String(v);
    // guard against spreadsheet formula injection
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  }
  exportBtn.addEventListener('click', function () {
    var rows = [fields.map(function (f) { return csvCell(labels[f]); }).join(',')];
    load().forEach(function (o) {
      rows.push(fields.map(function (f) { return csvCell(o[f]); }).join(','));
    });
    var blob = new Blob(['﻿' + rows.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'work-orders.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    status.textContent = 'CSV exported.';
  });
  clearBtn.addEventListener('click', function () {
    if (window.confirm('Delete all saved work orders on this device?')) {
      save([]); render(); status.textContent = 'All work orders deleted.';
    }
  });
  render();
})();
