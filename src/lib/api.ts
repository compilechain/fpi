export async function demoRun(payload: any) {
  const res = await fetch("https://api.tec-centric.tech/v1/fpi/demo-run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}
