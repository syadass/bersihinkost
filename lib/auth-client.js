/* Helper sederhana untuk memposting formulir auth dan menyimpan token. */
export async function postAuth(endpoint, body) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  return res
}
