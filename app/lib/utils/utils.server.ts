export function json(data: any, options: { status: number } = { status: 200 }) {
  return new Response(JSON.stringify(data), {
    status: options.status,
    headers: { "Content-Type": "application/json" },
  });
}
