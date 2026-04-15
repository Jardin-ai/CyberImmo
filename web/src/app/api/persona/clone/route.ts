import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

const ALLOWED_MIME = new Set(["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-wav"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse FormData ────────────────────────────────────────────────────────
    const form = await req.formData();
    const audioFile = form.get("audio");
    const personaId = form.get("personaId");

    if (!(audioFile instanceof File) || typeof personaId !== "string") {
      return Response.json({ error: "BadRequest", message: "缺少必要参数" }, { status: 400 });
    }

    // ── Validate file ─────────────────────────────────────────────────────────
    if (audioFile.size > MAX_BYTES) {
      return Response.json(
        { error: "FileTooLarge", message: "音频文件不能超过 5MB" },
        { status: 400 }
      );
    }
    if (!ALLOWED_MIME.has(audioFile.type)) {
      return Response.json(
        { error: "InvalidType", message: "仅支持 WAV / MP3 格式" },
        { status: 400 }
      );
    }

    // ── Ownership check ───────────────────────────────────────────────────────
    const admin = createAdminClient();
    const { data: persona, error: personaError } = await admin
      .from("personas")
      .select("id")
      .eq("id", personaId)
      .eq("user_id", user.id)
      .single();

    if (personaError || !persona) {
      return Response.json({ error: "PersonaNotFound" }, { status: 404 });
    }

    // ── Upload to Supabase voice-samples ──────────────────────────────────────
    const ext = audioFile.name.split(".").pop() ?? "wav";
    const storagePath = `${user.id}/${personaId}/${Date.now()}.${ext}`;
    const arrayBuffer = await audioFile.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from("voice-samples")
      .upload(storagePath, arrayBuffer, {
        contentType: audioFile.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[clone] Storage upload error:", uploadError);
      return Response.json(
        { error: "StorageError", message: "音频上传失败，请重试" },
        { status: 500 }
      );
    }

    // Signed URL valid for 1 hour — DashScope must fetch it within this window
    const { data: signedData, error: signedError } = await admin.storage
      .from("voice-samples")
      .createSignedUrl(storagePath, 3600);

    if (signedError || !signedData?.signedUrl) {
      console.error("[clone] Signed URL error:", signedError);
      return Response.json(
        { error: "StorageError", message: "无法生成音频访问链接" },
        { status: 500 }
      );
    }

    // ── Call DashScope CosyVoice voice-enrollment ─────────────────────────────
    const dashscopeKey = process.env.DASHSCOPE_API_KEY;
    if (!dashscopeKey) {
      console.error("[clone] DASHSCOPE_API_KEY not configured");
      return Response.json(
        { error: "ConfigError", message: "声纹服务未配置" },
        { status: 503 }
      );
    }

    const dashRes = await fetch(
      "https://dashscope.aliyuncs.com/api/v1/services/audio/cosyvoice/voice-enrollment",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${dashscopeKey}`,
          "Content-Type": "application/json",
          "X-DashScope-Async": "disable",
        },
        body: JSON.stringify({
          model: "cosyvoice-clone-v1",
          input: {
            url: signedData.signedUrl,
          },
        }),
      }
    );

    if (!dashRes.ok) {
      const errBody = await dashRes.text().catch(() => "");
      console.error("[clone] DashScope error:", dashRes.status, errBody);
      return Response.json(
        {
          error: "VoiceCloningFailed",
          message: "声纹提取失败，请确保音频无背景噪音且时长15–30秒",
        },
        { status: 502 }
      );
    }

    const dashJson = await dashRes.json();
    // DashScope returns: { output: { voice_id: string }, ... }
    const voiceId: string | undefined = dashJson?.output?.voice_id;

    if (!voiceId) {
      console.error("[clone] DashScope response missing voice_id:", dashJson);
      return Response.json(
        { error: "VoiceCloningFailed", message: "声纹提取失败，未获取到音色ID" },
        { status: 502 }
      );
    }

    // ── Persist voice_id + sample URL to persona ──────────────────────────────
    const { error: updateError } = await admin
      .from("personas")
      .update({
        voice_id: voiceId,
        voice_sample_url: storagePath,
      })
      .eq("id", personaId);

    if (updateError) {
      console.error("[clone] DB update error:", updateError);
      // Non-fatal: voice was cloned, just failed to persist — return success anyway
    }

    return Response.json({ voice_id: voiceId });
  } catch (error) {
    console.error("[clone] Unexpected error:", error);
    return Response.json(
      { error: "InternalError", message: "服务器内部错误" },
      { status: 500 }
    );
  }
}
