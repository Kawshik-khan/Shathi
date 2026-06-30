// BFF probe.
const t0 = Date.now();
try {
  const r = await fetch("http://localhost:3000/api/backend-auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "diag_134418@example.com", x: "y" }),
    cache: "no-store",
  });
  const txt = await r.text();
  console.log(`status=${r.status} elapsedMs=${Date.now() - t0}`);
  console.log(`body=${txt.slice(0, 500)}`);
} catch (e) {
  console.log(`error name=${e?.name} message=${e?.message} elapsedMs=${Date.now() - t0}`);
}
