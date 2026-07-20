(async () => {
  const base = 'http://localhost:5002/api/notes';
  const log = (label, obj) => console.log(`\n=== ${label} ===\n`, JSON.stringify(obj, null, 2));

  try {
    // Create
    let res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Automated Test Note', content: 'Created by test script' }),
    });
    const created = await res.json();
    log('CREATE', created);

    // Get all
    res = await fetch(base);
    const all = await res.json();
    log('GET ALL', all);

    const id = created && created.data && created.data.id ? created.data.id : (all.data && all.data[0] && all.data[0].id);
    if (!id) {
      console.error('No note ID found to continue tests');
      process.exit(1);
    }

    // Get by id
    res = await fetch(`${base}/${id}`);
    const single = await res.json();
    log('GET BY ID', single);

    // Update
    res = await fetch(`${base}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title', content: 'Updated content' }),
    });
    const updated = await res.json();
    log('UPDATE', updated);

    // Delete
    res = await fetch(`${base}/${id}`, { method: 'DELETE' });
    const deleted = await res.json();
    log('DELETE', deleted);

    console.log('\nAll tests completed.');
  } catch (err) {
    console.error('Test script error:', err);
    process.exit(1);
  }
})();
