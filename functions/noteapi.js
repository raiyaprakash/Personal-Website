export async function onRequest(context) {

    const { request, env } = context;
    const { DB } = env;

    try {

        // ---------- LOAD ----------
        if (request.method === "GET") {

            const url = new URL(request.url);
            const id = (url.searchParams.get("id") || "").trim();

            if (!/^[A-Za-z0-9]{1,50}$/.test(id)) {
                return Response.json({
                    success: false,
                    error: "Invalid Note ID"
                }, { status: 400 });
            }

            const note = await DB.prepare(
                "SELECT content, updated FROM notes WHERE id=?1"
            )
            .bind(id)
            .first();

            return Response.json({
                success: true,
                content: note?.content || "",
                updated: note?.updated || null
            });
        }

        // ---------- SAVE ----------
        if (request.method === "POST") {

            const body = await request.json();

            const id = (body.id || "").trim();
            const content = String(body.content || "");

            if (!/^[A-Za-z0-9]{1,50}$/.test(id)) {
                return Response.json({
                    success: false,
                    error: "Invalid Note ID"
                }, { status: 400 });
            }

            await DB.prepare(`
                INSERT INTO notes (id, content, updated)
                VALUES (?1, ?2, CURRENT_TIMESTAMP)
                ON CONFLICT(id)
                DO UPDATE SET
                    content = excluded.content,
                    updated = CURRENT_TIMESTAMP
            `)
            .bind(id, content)
            .run();

            return Response.json({
                success: true,
                updated: new Date().toISOString()
            });
        }

        return new Response("Method Not Allowed", {
            status: 405
        });

    } catch (e) {

        return Response.json({
            success: false,
            error: e.message
        }, {
            status: 500
        });

    }
}
