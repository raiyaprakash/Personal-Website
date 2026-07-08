export async function onRequest(context) {

    const { request, env } = context;
    const { DB } = env;

    // LOAD
    if (request.method === "GET") {

        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return Response.json({
                success: false,
                error: "Missing note id"
            }, { status: 400 });
        }

        const note = await DB.prepare(
            "SELECT content, updated FROM notes WHERE id=?"
        )
        .bind(id)
        .first();

        return Response.json({
            success: true,
            content: note?.content || "",
            updated: note?.updated || null
        });
    }

    // SAVE
    if (request.method === "POST") {

        const body = await request.json();

        if (!body.id) {
            return Response.json({
                success: false,
                error: "Missing note id"
            }, { status: 400 });
        }

        await DB.prepare(`
            INSERT INTO notes(id, content, updated)
            VALUES(?1, ?2, CURRENT_TIMESTAMP)
            ON CONFLICT(id)
            DO UPDATE SET
                content = excluded.content,
                updated = CURRENT_TIMESTAMP
        `)
        .bind(body.id, body.content || "")
        .run();

        return Response.json({
            success: true
        });
    }

    return new Response("Method Not Allowed", {
        status: 405
    });
}
